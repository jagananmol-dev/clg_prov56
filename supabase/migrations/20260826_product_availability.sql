/*
# Product availability (stock) control

Problem:
  There was no way to mark a product out of stock. The admin's only
  lever was deleting the product outright, which also orphans its past
  order line items, reviews, and wishlist rows.

Fix:
  Add `is_available` (boolean, default true) and `unavailable_reason`
  (text, nullable) to `products`. When is_available = false, the
  storefront keeps the product visible but disables Add to Cart / Buy
  and shows the reason (e.g. "Out of stock") instead of hiding it
  outright.
*/

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT true;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS unavailable_reason text;
