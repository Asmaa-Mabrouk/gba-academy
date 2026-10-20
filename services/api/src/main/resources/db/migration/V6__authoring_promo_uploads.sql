-- Authoring and commerce features (Oct 2026): mentor images, course approval workflow, live capacity,
-- course materials and lesson quizzes, uploaded files, meeting links, promo codes.

-- 1. Mentor photo (URL of an uploaded image).
ALTER TABLE mentors ADD COLUMN image_url TEXT;

-- 2. Course approval workflow. Existing courses are already live, so they start as approved.
--    draft -> pending (mentor submits) -> approved | rejected (admin decides) -> rejected goes back to editing.
ALTER TABLE courses
  ADD COLUMN status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('draft','pending','approved','rejected')),
  ADD COLUMN review_note TEXT,                       -- admin's reason when rejecting
  ADD COLUMN submitted_at TIMESTAMPTZ,
  ADD COLUMN created_by UUID REFERENCES users(id),
  ADD COLUMN materials JSONB NOT NULL DEFAULT '[]',  -- course-level downloads: [{id,name,url,size}]
  ADD COLUMN quizzes JSONB NOT NULL DEFAULT '{}';    -- {lessonId: quiz}. Kept apart from modules so correct answers never reach the public catalogue.
ALTER TABLE courses ADD CONSTRAINT courses_published_needs_approval_chk CHECK (NOT published OR status = 'approved');
CREATE INDEX idx_courses_status ON courses(status) WHERE status <> 'approved';

-- 3. Live cohorts: maximum learners, and the minimum that must book for the cohort to run (e.g. 10).
ALTER TABLE offerings
  ADD COLUMN capacity INT CHECK (capacity IS NULL OR capacity > 0),
  ADD COLUMN min_learners INT CHECK (min_learners IS NULL OR min_learners > 0),
  ADD CONSTRAINT offerings_min_le_capacity_chk CHECK (capacity IS NULL OR min_learners IS NULL OR min_learners <= capacity);
UPDATE offerings o SET capacity = (SELECT max(seats) FROM live_sessions s WHERE s.offering_id = o.id)
 WHERE o.mode <> 'recorded' AND EXISTS (SELECT 1 FROM live_sessions s WHERE s.offering_id = o.id);

-- 4. Live sessions: where the meeting lives. join_url already exists (V1).
ALTER TABLE live_sessions
  ADD COLUMN meeting_provider TEXT CHECK (meeting_provider IS NULL OR meeting_provider IN ('google_meet','manual','fake')),
  ADD COLUMN meeting_ref TEXT;                       -- provider's event id, used to update or cancel the meeting

-- 5. Uploaded files (images, videos, documents). Bytes live in the FileStorage port; this is the register.
CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('image','video','document')),
  original_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
  storage_key TEXT NOT NULL UNIQUE,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_media_files_user ON media_files(uploaded_by, created_at DESC);

-- 6. Promo codes. used_count can never pass max_uses, so two simultaneous checkouts cannot overspend a code.
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL CHECK (code = upper(code) AND code ~ '^[A-Z0-9_-]{3,32}$'),
  percent_off INT NOT NULL CHECK (percent_off BETWEEN 1 AND 100),
  max_uses INT CHECK (max_uses IS NULL OR max_uses > 0),   -- NULL = unlimited
  used_count INT NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  expires_at TIMESTAMPTZ,                                  -- NULL = never
  active BOOLEAN NOT NULL DEFAULT TRUE,
  note TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT promo_used_le_max_chk CHECK (max_uses IS NULL OR used_count <= max_uses)
);
CREATE UNIQUE INDEX promo_codes_code_uq ON promo_codes(code);
CREATE TABLE promo_redemptions (
  promo_id UUID NOT NULL REFERENCES promo_codes(id),
  user_id UUID NOT NULL REFERENCES users(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  discount_halalas INT NOT NULL CHECK (discount_halalas >= 0),
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (promo_id, user_id)                          -- one use per learner
);
CREATE INDEX idx_promo_redemptions_order ON promo_redemptions(order_id);

ALTER TABLE orders
  ADD COLUMN promo_code TEXT,
  ADD COLUMN discount_halalas INT NOT NULL DEFAULT 0 CHECK (discount_halalas >= 0);
