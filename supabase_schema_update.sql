-- Waitlist Status Guardrail Migration
-- Purpose: Add status tracking to waitlist entries to ensure manual approval before access.

-- 1. Add 'status' column with default 'pending'
ALTER TABLE waitlist 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- 2. Add 'review_notes' for admin comments
ALTER TABLE waitlist 
ADD COLUMN IF NOT EXISTS review_notes text;

-- 3. Add 'invited_at' to track when the official invite was sent
ALTER TABLE waitlist 
ADD COLUMN IF NOT EXISTS invited_at timestamptz;

-- 4. Add check constraint to ensure valid status values
ALTER TABLE waitlist 
ADD CONSTRAINT waitlist_status_check 
CHECK (status IN ('pending', 'approved', 'declined', 'onboarded'));

-- Comments for documentation
COMMENT ON COLUMN waitlist.status IS 'Current state of the applicant. Default pending. Must be approved to receive invite.';
COMMENT ON COLUMN waitlist.review_notes IS 'Internal notes by admin during review.';
