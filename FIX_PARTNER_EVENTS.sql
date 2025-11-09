-- Fix Partner Events Table and RLS Policy
-- Run these commands in order in your Supabase SQL Editor

-- Step 1: Check what tables exist with "partner" in the name
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%partner%';

-- Step 2: If you see "partner events" (with space), rename it:
-- ALTER TABLE "partner events" RENAME TO partner_events;

-- Step 3: If the table is already named partner_events, skip step 2

-- Step 4: Drop any existing policies on the old table name (if they exist)
DROP POLICY IF EXISTS "Admins can manage partner events" ON public."partner events";

-- Step 5: Create the RLS policy on the correct table (partner_events)
CREATE POLICY "Admins can manage partner events"
ON public.partner_events
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);

-- Step 6: Verify the policy was created
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'partner_events';

