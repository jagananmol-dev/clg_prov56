/*
 * @file 20260806_student_thoughts_table.sql
 * @description Student thoughts/testimonials table with admin moderation.
 *
 * Changes:
 *  1. CREATE student_thoughts table
 *  2. Enable RLS and grant public read access
 *  3. Allow authenticated users to insert their own thought
 */

-- ─────────────────────────────────────────────
-- 1. STUDENT THOUGHTS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_thoughts (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name  TEXT         NOT NULL CHECK (char_length(student_name) BETWEEN 2 AND 100),
  product_name  TEXT         NOT NULL CHECK (char_length(product_name) BETWEEN 2 AND 200),
  content       TEXT         NOT NULL CHECK (char_length(content) BETWEEN 10 AND 1000),
  status        TEXT         NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_thoughts_user_id ON student_thoughts(user_id);
CREATE INDEX IF NOT EXISTS idx_student_thoughts_status ON student_thoughts(status);

ALTER TABLE student_thoughts ENABLE ROW LEVEL SECURITY;

-- Public users can read only approved thoughts
DROP POLICY IF EXISTS "student_thoughts_select_approved" ON student_thoughts;
CREATE POLICY "student_thoughts_select_approved" ON student_thoughts
  FOR SELECT TO anon
  USING (status = 'approved');

-- Logged-in users can read approved thoughts and their own submissions
DROP POLICY IF EXISTS "student_thoughts_select_own" ON student_thoughts;
CREATE POLICY "student_thoughts_select_own" ON student_thoughts
  FOR SELECT TO authenticated
  USING (status = 'approved' OR user_id = auth.uid());

-- Logged-in users can insert their own thought
DROP POLICY IF EXISTS "student_thoughts_insert_own" ON student_thoughts;
CREATE POLICY "student_thoughts_insert_own" ON student_thoughts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users may update or delete only their own pending thoughts
DROP POLICY IF EXISTS "student_thoughts_update_own" ON student_thoughts;
CREATE POLICY "student_thoughts_update_own" ON student_thoughts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "student_thoughts_delete_own" ON student_thoughts;
CREATE POLICY "student_thoughts_delete_own" ON student_thoughts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');
