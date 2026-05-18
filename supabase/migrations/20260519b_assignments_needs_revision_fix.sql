-- Allow learners to update their own submission when status is 'submitted'
-- OR 'needs_revision'. The prior policy only allowed 'submitted', which
-- silently blocked the entire "needs revision → resubmit" flow.
--
-- (The server-side service uses supabaseAdmin which bypasses RLS, so the
-- bug was actually in the service code — fixed there too. This keeps the
-- RLS policy consistent with the actual rule.)

DROP POLICY IF EXISTS "Update own submissions before grading" ON assignment_submissions;
CREATE POLICY "Update own submissions before grading" ON assignment_submissions
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND status IN ('submitted', 'needs_revision')
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status IN ('submitted', 'needs_revision')
  );
