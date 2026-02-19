-- ============================================================
-- OPEARI: Terms & Privacy Consent Columns
-- ============================================================
-- Run this SQL to add consent tracking for legal compliance
-- ============================================================

-- Add consent tracking columns
ALTER TABLE members
ADD COLUMN IF NOT EXISTS tos_accepted_at timestamptz,
ADD COLUMN IF NOT EXISTS tos_version text,
ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamptz,
ADD COLUMN IF NOT EXISTS privacy_version text,
ADD COLUMN IF NOT EXISTS liability_acknowledged_at timestamptz;

-- Comments for clarity
COMMENT ON COLUMN members.tos_accepted_at IS 'Timestamp when user accepted Terms of Service';
COMMENT ON COLUMN members.tos_version IS 'Version of ToS accepted (e.g., "2026-01-25")';
COMMENT ON COLUMN members.privacy_accepted_at IS 'Timestamp when user accepted Privacy Policy';
COMMENT ON COLUMN members.privacy_version IS 'Version of Privacy Policy accepted';
COMMENT ON COLUMN members.liability_acknowledged_at IS 'Timestamp when user acknowledged liability disclaimer';
