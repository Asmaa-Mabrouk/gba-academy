-- Scale and integrity pass (architecture review, Oct 2026). Safe on existing data; see docs/architecture-review.md.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Login and registration look users up with lower(email): make that fast AND make e-mail unique regardless of case.
CREATE UNIQUE INDEX users_email_lower_uq ON users (lower(email));

-- Foreign keys that were not indexed (joins, per-user and per-course reads, cascading checks).
CREATE INDEX idx_order_lines_order     ON order_lines(order_id);
CREATE INDEX idx_order_lines_offering  ON order_lines(offering_id);
CREATE INDEX idx_orders_user_created   ON orders(user_id, created_at DESC);
CREATE INDEX idx_enrollments_offering  ON enrollments(offering_id);
CREATE INDEX idx_enrollments_order     ON enrollments(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_sessions_offering_at  ON live_sessions(offering_id, starts_at);
CREATE INDEX idx_sessions_starts       ON live_sessions(starts_at);
CREATE INDEX idx_courses_mentor        ON courses(mentor_id);
CREATE INDEX idx_reviews_course_recent ON reviews(course_id, created_at DESC);
CREATE INDEX idx_reviews_user          ON reviews(user_id) WHERE user_id IS NOT NULL;

-- The public catalogue only reads published courses, most popular first.
CREATE INDEX idx_courses_published_pop ON courses(learners DESC) WHERE published;

-- Catalogue search is ILIKE '%text%' on title/subtitle: a trigram index turns that from a table scan into an index scan.
CREATE INDEX idx_courses_title_trgm    ON courses USING gin ((title::text) gin_trgm_ops);
CREATE INDEX idx_courses_subtitle_trgm ON courses USING gin ((subtitle::text) gin_trgm_ops);

-- Data integrity the application already assumes, now enforced by the database.
ALTER TABLE orders ADD CONSTRAINT orders_totals_chk
  CHECK (subtotal_halalas >= 0 AND vat_halalas >= 0 AND total_halalas = subtotal_halalas + vat_halalas);
ALTER TABLE order_lines ADD CONSTRAINT order_lines_price_chk CHECK (price_halalas >= 0);
ALTER TABLE enrollments ADD CONSTRAINT enrollments_progress_chk CHECK (progress_pct BETWEEN 0 AND 100);
ALTER TABLE live_sessions ADD CONSTRAINT sessions_seats_chk CHECK (seats > 0 AND seats_taken >= 0 AND seats_taken <= seats);
ALTER TABLE live_sessions ADD CONSTRAINT sessions_duration_chk CHECK (duration_min > 0);
ALTER TABLE courses ADD CONSTRAINT courses_hours_chk CHECK (hours > 0);
ALTER TABLE courses ADD CONSTRAINT courses_rating_chk CHECK (rating BETWEEN 0 AND 5);
ALTER TABLE mentors ADD CONSTRAINT mentors_rating_chk CHECK (rating BETWEEN 0 AND 5);
