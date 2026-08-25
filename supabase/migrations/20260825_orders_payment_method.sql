/*
# Add payment_method to orders — Cash on Delivery support

Problem:
  Checkout only supported prepaid orders via Razorpay. Customers who
  can't or don't want to pay online had no way to check out.

Fix:
  1. Add `payment_method` (text, default 'online') to `orders` so a
     checkout can record whether it was paid online (Razorpay) or is
     Cash on Delivery. Existing rows backfill to 'online' since every
     past order went through Razorpay.
  2. Constrain it to the two known values so bad client data can't slip
     in.
  3. COD orders are inserted with payment_method = 'cod' and no
     payment_id (nothing was charged yet) — the admin panel surfaces
     this so staff know to collect cash on delivery instead of
     expecting a Razorpay reference.
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'online';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_method_check'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_payment_method_check
      CHECK (payment_method IN ('online', 'cod'));
  END IF;
END $$;
