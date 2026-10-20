-- Admin portal support: unpublished courses, and mentor profiles linked to a login account (for the mentor portal).
ALTER TABLE courses ADD COLUMN published BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE mentors ADD COLUMN user_id UUID UNIQUE REFERENCES users(id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
