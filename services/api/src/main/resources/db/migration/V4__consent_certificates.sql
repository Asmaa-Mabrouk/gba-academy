-- Legal consent record (which document version, when) and certificate issue date.
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document TEXT NOT NULL CHECK (document IN ('terms','privacy','refund','marketing')),
  version TEXT NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT true,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX user_consents_user_idx ON user_consents(user_id);

ALTER TABLE enrollments ADD COLUMN completed_at TIMESTAMPTZ;
UPDATE enrollments SET completed_at = now() WHERE certificate_code IS NOT NULL AND completed_at IS NULL;
