/*
# Fix orders table — missing payment_id column

Problem:
  Cart.tsx inserts a `payment_id` field into `orders` right after a
  successful Razorpay payment (the payment_id is the Razorpay
  payment reference). No migration ever added this column, so every
  checkout has been failing at the DB write step with
  "column orders.payment_id does not exist" — the customer is charged
  but the order never lands in the database (they see
  "Payment succeeded but order save failed").

Fix:
  1. Add `payment_id` (text, nullable — guest/legacy rows won't have one).
  2. Unique partial index on payment_id so the same Razorpay payment can
     never be recorded as two separate orders (e.g. a double-submit from
     a slow network retry).
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_id_unique
  ON orders (payment_id) WHERE payment_id IS NOT NULL;
