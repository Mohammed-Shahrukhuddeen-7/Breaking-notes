
-- Tighten AI insert policies
DROP POLICY "Anyone signed in inserts summaries" ON public.ai_summaries;
CREATE POLICY "Auth users insert summaries"
  ON public.ai_summaries FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY "Anyone signed in inserts quizzes" ON public.ai_quizzes;
CREATE POLICY "Auth users insert quizzes"
  ON public.ai_quizzes FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Revoke EXECUTE from PUBLIC on SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_points_and_streak(UUID, INTEGER) FROM PUBLIC;

-- has_role is called from RLS policies (runs as table owner), no direct caller needed
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM authenticated;
