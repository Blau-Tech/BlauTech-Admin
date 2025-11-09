-- RLS Policies for BlauTech Admin Panel
-- Run these in your Supabase SQL Editor

-- ============================================
-- SIGNUPS TABLE POLICIES
-- ============================================

-- Allow authenticated users with admin role to read signups
CREATE POLICY "Admins can read signups"
ON public.signups
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);

-- Allow admins to delete signups
CREATE POLICY "Admins can delete signups"
ON public.signups
FOR DELETE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);

-- ============================================
-- EVENTS TABLE POLICIES
-- ============================================

CREATE POLICY "Admins can manage events"
ON public.events
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);

-- ============================================
-- HACKATHONS TABLE POLICIES
-- ============================================

CREATE POLICY "Admins can manage hackathons"
ON public.hackathons
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);

-- ============================================
-- SCHOLARSHIPS TABLE POLICIES
-- ============================================

CREATE POLICY "Admins can manage scholarships"
ON public.scholarships
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);

-- ============================================
-- PARTNER EVENTS TABLE POLICIES
-- ============================================
-- First, check if your table exists and what it's named:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%partner%';

-- If your table is still named "partner events" (with space), rename it first:
-- ALTER TABLE "partner events" RENAME TO partner_events;

-- Then create the policy on the renamed table:
CREATE POLICY "Admins can manage partner events"
ON public.partner_events
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);

