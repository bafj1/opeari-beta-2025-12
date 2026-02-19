-- Connections table
CREATE TABLE IF NOT EXISTS connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate connection requests
  UNIQUE(requester_id, recipient_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_recipient ON connections(recipient_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);

-- RLS policies
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Users can see connections they're part of
CREATE POLICY "Users can view own connections"
  ON connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Users can create connection requests
CREATE POLICY "Users can send connection requests"
  ON connections FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Recipients can update connection status (accept/decline)
CREATE POLICY "Recipients can update connection status"
  ON connections FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Users can delete their own sent requests (cancel)
CREATE POLICY "Users can cancel own requests"
  ON connections FOR DELETE
  USING (auth.uid() = requester_id AND status = 'pending');

-- RPC: Get connection count
CREATE OR REPLACE FUNCTION get_connection_count(user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM connections
  WHERE (requester_id = user_id OR recipient_id = user_id)
    AND status = 'accepted';
$$ LANGUAGE SQL SECURITY DEFINER;

-- RPC: Get mutual connections count
CREATE OR REPLACE FUNCTION get_mutual_connections(user_a UUID, user_b UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM (
    -- People connected to user_a
    SELECT CASE 
      WHEN requester_id = user_a THEN recipient_id 
      ELSE requester_id 
    END AS connected_to
    FROM connections
    WHERE (requester_id = user_a OR recipient_id = user_a)
      AND status = 'accepted'
    
    INTERSECT
    
    -- People connected to user_b
    SELECT CASE 
      WHEN requester_id = user_b THEN recipient_id 
      ELSE requester_id 
    END AS connected_to
    FROM connections
    WHERE (requester_id = user_b OR recipient_id = user_b)
      AND status = 'accepted'
  ) AS mutual;
$$ LANGUAGE SQL SECURITY DEFINER;

-- RPC: Get connection status
CREATE OR REPLACE FUNCTION get_connection_status(user_a UUID, user_b UUID)
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT status FROM connections 
     WHERE (requester_id = user_a AND recipient_id = user_b)
        OR (requester_id = user_b AND recipient_id = user_a)
     LIMIT 1),
    'none'
  );
$$ LANGUAGE SQL SECURITY DEFINER;
