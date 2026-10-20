-- Announcement banners (ads slider on the home page): free webinars, GPMF, PMO summit...
CREATE TABLE banners (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title       jsonb       NOT NULL,
    subtitle    jsonb       NOT NULL DEFAULT '{"ar":"","en":""}',
    cta_label   jsonb       NOT NULL DEFAULT '{"ar":"","en":""}',
    link_url    text,
    image_url   text,
    theme       text        NOT NULL DEFAULT 'navy' CHECK (theme IN ('navy','gold','teal','violet')),
    starts_at   timestamptz,
    ends_at     timestamptz,
    active      boolean     NOT NULL DEFAULT true,
    sort_order  integer     NOT NULL DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT banners_window_chk CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at),
    CONSTRAINT banners_link_chk CHECK (link_url IS NULL OR link_url ~ '^(https://\S+|/\S*)$')
);
CREATE INDEX idx_banners_live ON banners (active, sort_order);
