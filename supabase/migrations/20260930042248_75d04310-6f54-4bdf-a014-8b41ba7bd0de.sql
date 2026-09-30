-- Limit quiz cache reads to administrators and disable unused direct cache writes.
DROP POLICY IF EXISTS "Auth users insert quizzes" ON public.ai_quizzes;
DROP POLICY IF EXISTS "Anyone signed in inserts quizzes" ON public.ai_quizzes;
DROP POLICY IF EXISTS "Anyone signed in reads quizzes" ON public.ai_quizzes;
REVOKE INSERT ON TABLE public.ai_quizzes FROM authenticated;
CREATE POLICY "Admins read quizzes"
  ON public.ai_quizzes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Auth users insert summaries" ON public.ai_summaries;
DROP POLICY IF EXISTS "Anyone signed in inserts summaries" ON public.ai_summaries;
REVOKE INSERT ON TABLE public.ai_summaries FROM authenticated;

-- Keep safe leaderboard/profile fields readable while making the email column unreadable.
REVOKE SELECT ON TABLE public.profiles FROM authenticated;
GRANT SELECT (id, username, avatar_url, total_points, current_streak, best_streak, last_active_date, created_at, updated_at)
  ON TABLE public.profiles TO authenticated;