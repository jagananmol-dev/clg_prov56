/*
# Remove OTP verification — unused feature

Context:
  20260810_phone_otp_and_profile.sql added a `phone_otps` table,
  a `phone_verified` flag on profiles, and a cleanup function, meant to
  back an OTP-verification flow for phone numbers at signup.

  That flow was never actually built: the Express backend that would
  serve /api/otp/send|verify kept OTPs in-memory (never touched this
  table), and that route was never even mounted onto the app. The
  frontend never called it either. Phone numbers are now captured and
  stored directly at signup (see profiles.phone), with no OTP step —
  so this table, its index, its cleanup function, and the
  verification-status flag are all dead weight. Removing them.

  `profiles.phone` and its unique index (one account per phone) stay —
  those are actively used.
*/

DROP FUNCTION IF EXISTS public.cleanup_expired_otps();

DROP TABLE IF EXISTS phone_otps;

ALTER TABLE profiles
  DROP COLUMN IF EXISTS phone_verified;
