-- Global Business Academy: core schema. Money is integer halalas. Bilingual text is JSONB {"ar":"","en":""}.
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  mobile TEXT,
  locale TEXT NOT NULL DEFAULT 'ar' CHECK (locale IN ('ar','en')),
  roles TEXT[] NOT NULL DEFAULT ARRAY['learner'],
  registering_for TEXT NOT NULL DEFAULT 'self' CHECK (registering_for IN ('self','child')),
  marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE mentors (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE,
  name JSONB NOT NULL, title JSONB NOT NULL, bio JSONB NOT NULL,
  expertise TEXT[] NOT NULL DEFAULT '{}', languages TEXT[] NOT NULL DEFAULT '{}',
  hue INT NOT NULL DEFAULT 40,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0, review_count INT NOT NULL DEFAULT 0, learners INT NOT NULL DEFAULT 0
);

-- The course is the master record. It never holds a date or a price: those live on offerings.
CREATE TABLE courses (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE,
  audience TEXT NOT NULL CHECK (audience IN ('kids','youth','experts')),
  level TEXT NOT NULL CHECK (level IN ('beginner','intermediate','advanced')),
  topic TEXT NOT NULL,
  title JSONB NOT NULL, subtitle JSONB NOT NULL, description JSONB NOT NULL,
  outcomes JSONB NOT NULL DEFAULT '[]', modules JSONB NOT NULL DEFAULT '[]', -- syllabus kept as JSON, see docs/data-model.md
  mentor_id TEXT NOT NULL REFERENCES mentors(id),
  hours INT NOT NULL, languages TEXT[] NOT NULL DEFAULT '{ar}',
  featured BOOLEAN NOT NULL DEFAULT FALSE, is_new BOOLEAN NOT NULL DEFAULT FALSE, bestseller BOOLEAN NOT NULL DEFAULT FALSE,
  age_range TEXT, certificate BOOLEAN NOT NULL DEFAULT TRUE, cpd_points INT,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0, review_count INT NOT NULL DEFAULT 0, learners INT NOT NULL DEFAULT 0
);

-- What a learner actually buys: a course in a given mode (recorded / live / blended).
CREATE TABLE offerings (
  id TEXT PRIMARY KEY, course_id TEXT NOT NULL REFERENCES courses(id),
  mode TEXT NOT NULL CHECK (mode IN ('recorded','live','blended')),
  price_halalas INT NOT NULL CHECK (price_halalas >= 0), compare_at_halalas INT,
  access_days INT, cohort_label JSONB
);
CREATE TABLE live_sessions (
  id TEXT PRIMARY KEY, offering_id TEXT NOT NULL REFERENCES offerings(id),
  starts_at TIMESTAMPTZ NOT NULL, duration_min INT NOT NULL,
  seats INT NOT NULL, seats_taken INT NOT NULL DEFAULT 0, title JSONB NOT NULL,
  join_url TEXT -- filled by the live-video provider adapter
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('pending','paid','failed','refunded')),
  subtotal_halalas INT NOT NULL, vat_halalas INT NOT NULL, total_halalas INT NOT NULL,
  payment_method TEXT NOT NULL, gateway_ref TEXT, invoice_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE SEQUENCE order_seq START 1;
CREATE TABLE order_lines (
  id BIGSERIAL PRIMARY KEY, order_id UUID NOT NULL REFERENCES orders(id),
  offering_id TEXT NOT NULL REFERENCES offerings(id), price_halalas INT NOT NULL
);

CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id), offering_id TEXT NOT NULL REFERENCES offerings(id),
  order_id UUID REFERENCES orders(id),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(), expires_at TIMESTAMPTZ,
  completed_lesson_ids TEXT[] NOT NULL DEFAULT '{}', progress_pct INT NOT NULL DEFAULT 0,
  certificate_code TEXT UNIQUE,
  UNIQUE (user_id, offering_id)
);

CREATE TABLE reviews (
  id TEXT PRIMARY KEY, course_id TEXT NOT NULL REFERENCES courses(id),
  user_id UUID REFERENCES users(id), author TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5), comment JSONB NOT NULL, mentor_reply JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_courses_audience ON courses(audience);
CREATE INDEX idx_offerings_course ON offerings(course_id);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_reviews_course ON reviews(course_id);
