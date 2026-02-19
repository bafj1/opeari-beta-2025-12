-- Create invites table to track sent invitation
CREATE TABLE IF NOT EXISTS invites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    invitee_email text NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    accepted_at timestamptz,
    created_at timestamptz DEFAULT now(),
    UNIQUE(inviter_id, invitee_email)
);

CREATE INDEX IF NOT EXISTS idx_invites_inviter ON invites(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(invitee_email);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invites" ON invites FOR SELECT USING (inviter_id = auth.uid());
CREATE POLICY "Users can create invites" ON invites FOR INSERT WITH CHECK (inviter_id = auth.uid());
