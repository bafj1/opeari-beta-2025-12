-- Migration: 11_caregiver_invites.sql
-- Description: Create caregiver_invites table for referral tracking

CREATE TABLE IF NOT EXISTS caregiver_invites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    email text NOT NULL,
    name text,
    note text,
    relationship text DEFAULT 'personal',
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'expired')),
    created_at timestamptz DEFAULT now(),
    accepted_at timestamptz,
    UNIQUE(inviter_id, email)
);

ALTER TABLE caregiver_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invites"
    ON caregiver_invites FOR SELECT
    USING (inviter_id = auth.uid());

CREATE POLICY "Users can create invites"
    ON caregiver_invites FOR INSERT
    WITH CHECK (inviter_id = auth.uid());
