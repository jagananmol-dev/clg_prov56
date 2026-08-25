/*
# Phone OTP Verification & Profile Phone Link — The Dorm Store

1. phone_otps table
   - Stores hashed OTP codes with expiry
   - Rate-limited by phone (max 3 per 15 minutes enforced in app layer)
   - Auto-cleanup of expired OTPs

2. Update handle_new_user() trigger
   - Now also copies `phone` from raw_user_meta_data into profiles.phone

3. Unique constraint on profiles.phone
   - Prevents duplicate phone registrations (one account per phone)

4. phone_verified column on profiles
   - Tracks whether the phone number has been OTP-verified
*/

-- ─────────────────────────────────────────────
-- 1. PHONE_OTPS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS phone_otps (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT        NOT NULL,
  otp_hash    TEXT        NOT NULL,       -- bcrypt hash of the 6-digit code
  expires_at  TIMESTAMPTZ NOT NULL,       -- OTP valid for 5 minutes
  verified    BOOLEAN     DEFAULT FALSE,  -- set to true after successful verification
  attempts    INTEGER     DEFAULT 0,      -- wrong-guess counter (max 5)
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by phone + not-yet-expired
CREATE INDEX IF NOT EXISTS idx_phone_otps_phone_expires
  ON phone_otps (phone, expires_at DESC);

-- RLS: only the backend (service_role) touches this table
ALTER TABLE phone_otps ENABLE ROW LEVEL SECURITY;

-- No policies = no access for anon/authenticated — only service_role can read/write
-- (This is intentional — OTP verification goes through the backend API, not direct DB access)

-- ─────────────────────────────────────────────
-- 2. ADD phone_verified COLUMN TO PROFILES
-- ─────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- ─────────────────────────────────────────────
-- 3. UNIQUE INDEX ON profiles.phone
--    Prevents two accounts from using the same phone number.
--    Partial index: only enforces uniqueness for non-null values.
-- ─────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique
  ON profiles (phone) WHERE phone IS NOT NULL;

-- ─────────────────────────────────────────────
-- 4. UPDATE handle_new_user() TRIGGER
--    Now copies both full_name and phone from user_metadata → profiles
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone     = EXCLUDED.phone,
    updated_at = now();
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────
-- 5. CLEANUP FUNCTION — delete expired OTPs (run periodically or on demand)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM phone_otps WHERE expires_at < now();
END;
$$;
