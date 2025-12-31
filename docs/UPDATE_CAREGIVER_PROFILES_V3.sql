-- Add V3 fields to caregiver_profiles table
ALTER TABLE caregiver_profiles 
ADD COLUMN IF NOT EXISTS hourly_rate TEXT,
ADD COLUMN IF NOT EXISTS logistics TEXT[], -- array: own_car, lift_weight, cooking, etc.
ADD COLUMN IF NOT EXISTS referrals JSONB, -- array of objects: { name, email, phone, relation, description }
ADD COLUMN IF NOT EXISTS contact_time TEXT;
