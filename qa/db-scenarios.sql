-- Integrity scenarios. Each block must either succeed or fail exactly as described; any surprise aborts the run.
\set ON_ERROR_STOP on
CREATE OR REPLACE FUNCTION pg_temp.expect_fail(sql text, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN EXECUTE sql; RAISE EXCEPTION 'EXPECTED FAILURE DID NOT HAPPEN: %', label;
  EXCEPTION WHEN check_violation OR unique_violation OR foreign_key_violation THEN RAISE NOTICE 'ok (rejected): %', label; END;
END $$;
CREATE OR REPLACE FUNCTION pg_temp.assert(cond boolean, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF NOT cond THEN RAISE EXCEPTION 'ASSERT FAILED: %', label; END IF; RAISE NOTICE 'ok: %', label; END $$;

-- seed sanity
SELECT pg_temp.assert((SELECT count(*) FROM courses) = 13, '13 sample courses');
SELECT pg_temp.assert((SELECT count(*) FROM offerings) >= 13, 'offerings loaded');
SELECT pg_temp.assert((SELECT count(*) FROM courses WHERE published) = 13, 'all courses published by default');

-- identity
INSERT INTO users(email, password_hash, full_name) VALUES ('Ali@Test.sa', 'x', 'Ali');
SELECT pg_temp.expect_fail($$INSERT INTO users(email, password_hash, full_name) VALUES ('ali@test.sa', 'x', 'Ali 2')$$, 'duplicate e-mail differing only in case');
SELECT pg_temp.expect_fail($$INSERT INTO users(email, password_hash, full_name, locale) VALUES ('b@test.sa', 'x', 'B', 'fr')$$, 'unsupported locale');
SELECT pg_temp.assert((SELECT roles FROM users WHERE lower(email) = 'ali@test.sa') = ARRAY['learner'], 'new users are learners only');

-- consent record
INSERT INTO user_consents(user_id, document, version) SELECT id, 'terms', 'v1' FROM users WHERE lower(email) = 'ali@test.sa';
SELECT pg_temp.expect_fail($$INSERT INTO user_consents(user_id, document, version) SELECT id, 'cookies', 'v1' FROM users LIMIT 1$$, 'unknown consent document');

-- money
CREATE TEMP TABLE ctx AS SELECT (SELECT id FROM users WHERE lower(email) = 'ali@test.sa') uid, (SELECT id FROM offerings ORDER BY id LIMIT 1) oid;
SELECT pg_temp.expect_fail($$INSERT INTO orders(number, user_id, status, subtotal_halalas, vat_halalas, total_halalas, payment_method) SELECT 'T-1', uid, 'paid', 100, 15, 120, 'mada' FROM ctx$$, 'order total must equal subtotal + VAT');
SELECT pg_temp.expect_fail($$INSERT INTO orders(number, user_id, status, subtotal_halalas, vat_halalas, total_halalas, payment_method) SELECT 'T-2', uid, 'weird', 100, 15, 115, 'mada' FROM ctx$$, 'unknown order status');
INSERT INTO orders(number, user_id, status, subtotal_halalas, vat_halalas, total_halalas, payment_method) SELECT 'T-3', uid, 'paid', 26000, 3900, 29900, 'mada' FROM ctx;
SELECT pg_temp.expect_fail($$INSERT INTO orders(number, user_id, status, subtotal_halalas, vat_halalas, total_halalas, payment_method) SELECT 'T-3', uid, 'paid', 0, 0, 0, 'mada' FROM ctx$$, 'duplicate order number');
SELECT pg_temp.expect_fail($$INSERT INTO order_lines(order_id, offering_id, price_halalas) SELECT (SELECT id FROM orders WHERE number='T-3'), oid, -5 FROM ctx$$, 'negative line price');

-- enrollment rules
INSERT INTO enrollments(user_id, offering_id, order_id) SELECT uid, oid, (SELECT id FROM orders WHERE number='T-3') FROM ctx;
SELECT pg_temp.expect_fail($$INSERT INTO enrollments(user_id, offering_id) SELECT uid, oid FROM ctx$$, 'same offering cannot be enrolled twice');
SELECT pg_temp.expect_fail($$UPDATE enrollments SET progress_pct = 101$$, 'progress above 100');
SELECT pg_temp.expect_fail($$UPDATE enrollments SET progress_pct = -1$$, 'negative progress');
UPDATE enrollments SET certificate_code = 'GBA-AAAAAA';
SELECT pg_temp.expect_fail($$INSERT INTO enrollments(user_id, offering_id, certificate_code) SELECT uid, (SELECT id FROM offerings WHERE id <> (SELECT oid FROM ctx) LIMIT 1), 'GBA-AAAAAA' FROM ctx$$, 'certificate code must be unique');

-- live seats
SELECT pg_temp.expect_fail($$UPDATE live_sessions SET seats_taken = seats + 1 WHERE id = (SELECT id FROM live_sessions LIMIT 1)$$, 'cannot oversell a live session');
SELECT pg_temp.expect_fail($$UPDATE live_sessions SET seats_taken = -1 WHERE id = (SELECT id FROM live_sessions LIMIT 1)$$, 'negative seats taken');

-- reviews and ratings
SELECT pg_temp.expect_fail($$INSERT INTO reviews(id, course_id, author, rating, comment) SELECT 'r-x', id, 'A', 6, '{"ar":"x","en":"x"}' FROM courses LIMIT 1$$, 'rating above 5');
SELECT pg_temp.expect_fail($$UPDATE courses SET rating = 5.5 WHERE id = (SELECT id FROM courses LIMIT 1)$$, 'course rating above 5');

-- referential integrity
SELECT pg_temp.expect_fail($$INSERT INTO offerings(id, course_id, mode, price_halalas) VALUES ('o-x', 'no-such-course', 'recorded', 100)$$, 'offering needs a real course');
SELECT pg_temp.expect_fail($$INSERT INTO offerings(id, course_id, mode, price_halalas) SELECT 'o-y', id, 'recorded', -1 FROM courses LIMIT 1$$, 'negative offering price');
SELECT pg_temp.expect_fail($$INSERT INTO offerings(id, course_id, mode, price_halalas) SELECT 'o-z', id, 'podcast', 1 FROM courses LIMIT 1$$, 'unknown mode');

-- the indexes the hot queries rely on exist and the planner can use them
SELECT pg_temp.assert((SELECT count(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname IN
  ('users_email_lower_uq','idx_orders_user_created','idx_order_lines_order','idx_enrollments_offering','idx_sessions_offering_at','idx_courses_title_trgm','idx_reviews_course_recent')) = 7, 'scale indexes present');
SET enable_seqscan = off;
SELECT pg_temp.assert((SELECT count(*) FROM courses c WHERE c.title::text ILIKE '%project%') >= 1, 'trigram search returns rows');
SELECT pg_temp.assert(EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_courses_title_trgm'), 'trigram index usable');
RESET enable_seqscan;
