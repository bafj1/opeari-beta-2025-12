-- =============================================================================
-- Migration: 26_endorsements_table.sql
-- Purpose: Creates endorsements table for referral-based reputation system
-- Run in: Supabase SQL Editor
-- =============================================================================

-- Endorsements table: stores referral-based reviews
CREATE TABLE IF NOT EXISTS endorsements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who gave the endorsement
    endorser_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    endorser_name TEXT,

    -- Who received it (by email if not yet on platform, by member_id if they are)
    recipient_email TEXT,
    recipient_id UUID REFERENCES members(id) ON DELETE SET NULL,

    -- Endorsement data
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    relationship TEXT,
    note TEXT,

    -- Source: where this endorsement came from
    source TEXT DEFAULT 'referral',

    -- Status
    is_visible BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_endorsements_recipient_email ON endorsements(recipient_email);
CREATE INDEX IF NOT EXISTS idx_endorsements_recipient_id ON endorsements(recipient_id);
CREATE INDEX IF NOT EXISTS idx_endorsements_endorser_id ON endorsements(endorser_id);

-- Unique constraint: one endorsement per endorser per recipient email
CREATE UNIQUE INDEX IF NOT EXISTS idx_endorsements_unique
ON endorsements(endorser_id, recipient_email)
WHERE recipient_email IS NOT NULL;

-- RLS policies
ALTER TABLE endorsements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "endorsements_read" ON endorsements
    FOR SELECT USING (is_visible = true);

CREATE POLICY "endorsements_insert" ON endorsements
    FOR INSERT WITH CHECK (auth.uid() = endorser_id);

CREATE POLICY "endorsements_update" ON endorsements
    FOR UPDATE USING (auth.uid() = endorser_id);

-- When a referred user signs up, link their endorsements by email to their member_id
CREATE OR REPLACE FUNCTION link_endorsements_on_signup()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE endorsements
    SET recipient_id = NEW.id
    WHERE recipient_email = (
        SELECT email FROM auth.users WHERE id = NEW.id
    )
    AND recipient_id IS NULL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: when a new member row is created, link any pending endorsements
DROP TRIGGER IF EXISTS trigger_link_endorsements ON members;
CREATE TRIGGER trigger_link_endorsements
    AFTER INSERT ON members
    FOR EACH ROW
    EXECUTE FUNCTION link_endorsements_on_signup();
