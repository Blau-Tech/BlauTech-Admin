-- Create RLS Policy for partner_events table
-- Run this in your Supabase SQL Editor

CREATE POLICY "Admins can manage partner events"
ON public.partner_events
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
  OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);

-- Verify the policy was created
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'partner_events';

