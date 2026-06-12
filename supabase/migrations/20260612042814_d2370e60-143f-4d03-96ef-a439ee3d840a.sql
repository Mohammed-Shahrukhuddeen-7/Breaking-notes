
-- =====================================================================
-- ENUMS
-- =====================================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.task_difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE public.task_status AS ENUM ('pending', 'completed');
CREATE TYPE public.note_tag AS ENUM ('notes', 'pyq', 'important', 'lab_manual', 'formula_sheet');

-- =====================================================================
-- UPDATED_AT helper
-- =====================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =====================================================================
-- PROFILES
-- =====================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  total_points INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- USER ROLES
-- =====================================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- =====================================================================
-- AUTO-CREATE PROFILE on signup
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- POMODORO SESSIONS
-- =====================================================================
CREATE TABLE public.pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL,
  points_awarded INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.pomodoro_sessions TO authenticated;
GRANT ALL ON public.pomodoro_sessions TO service_role;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sessions"
  ON public.pomodoro_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions"
  ON public.pomodoro_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_pomodoro_user_completed ON public.pomodoro_sessions(user_id, completed_at DESC);

-- =====================================================================
-- TASKS
-- =====================================================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  difficulty public.task_difficulty NOT NULL DEFAULT 'medium',
  status public.task_status NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tasks"
  ON public.tasks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_tasks_updated
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================================
-- STREAK HISTORY
-- =====================================================================
CREATE TABLE public.streak_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, active_date)
);
GRANT SELECT, INSERT ON public.streak_history TO authenticated;
GRANT ALL ON public.streak_history TO service_role;
ALTER TABLE public.streak_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own streaks"
  ON public.streak_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own streaks"
  ON public.streak_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- SEMESTERS / SUBJECTS / NOTES
-- =====================================================================
CREATE TABLE public.semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  position INTEGER NOT NULL DEFAULT 0,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.semesters TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.semesters TO authenticated;
GRANT ALL ON public.semesters TO service_role;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in reads semesters"
  ON public.semesters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins write semesters"
  ON public.semesters FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update semesters"
  ON public.semesters FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete semesters"
  ON public.semesters FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (semester_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in reads subjects"
  ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins write subjects"
  ON public.subjects FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update subjects"
  ON public.subjects FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete subjects"
  ON public.subjects FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER,
  tag public.note_tag NOT NULL DEFAULT 'notes',
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in reads notes"
  ON public.notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins write notes"
  ON public.notes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update notes"
  ON public.notes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete notes"
  ON public.notes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_notes_subject ON public.notes(subject_id);
CREATE INDEX idx_notes_semester ON public.notes(semester_id);

-- =====================================================================
-- AI USAGE / SUMMARIES / QUIZZES
-- =====================================================================
CREATE TABLE public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  requests_used INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, usage_date)
);
GRANT SELECT, INSERT, UPDATE ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO service_role;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ai usage"
  ON public.ai_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own ai usage"
  ON public.ai_usage FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own ai usage"
  ON public.ai_usage FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.ai_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL UNIQUE REFERENCES public.notes(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  key_concepts TEXT,
  formulas TEXT,
  revision_points TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ai_summaries TO authenticated;
GRANT ALL ON public.ai_summaries TO service_role;
ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in reads summaries"
  ON public.ai_summaries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone signed in inserts summaries"
  ON public.ai_summaries FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.ai_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL UNIQUE REFERENCES public.notes(id) ON DELETE CASCADE,
  quiz_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ai_quizzes TO authenticated;
GRANT ALL ON public.ai_quizzes TO service_role;
ALTER TABLE public.ai_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in reads quizzes"
  ON public.ai_quizzes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone signed in inserts quizzes"
  ON public.ai_quizzes FOR INSERT TO authenticated WITH CHECK (true);

-- =====================================================================
-- STREAK + POINTS update RPC
-- Award points & update streak (called by server fns).
-- =====================================================================
CREATE OR REPLACE FUNCTION public.award_points_and_streak(_user_id UUID, _points INTEGER)
RETURNS public.profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  prof public.profiles;
  today DATE := CURRENT_DATE;
  yesterday DATE := CURRENT_DATE - 1;
  new_streak INTEGER;
BEGIN
  SELECT * INTO prof FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'profile not found'; END IF;

  -- Streak calc
  IF prof.last_active_date = today THEN
    new_streak := prof.current_streak;
  ELSIF prof.last_active_date = yesterday THEN
    new_streak := prof.current_streak + 1;
  ELSE
    new_streak := 1;
  END IF;

  UPDATE public.profiles SET
    total_points = total_points + _points,
    current_streak = new_streak,
    best_streak = GREATEST(best_streak, new_streak),
    last_active_date = today
  WHERE id = _user_id
  RETURNING * INTO prof;

  INSERT INTO public.streak_history (user_id, active_date)
  VALUES (_user_id, today)
  ON CONFLICT (user_id, active_date) DO NOTHING;

  RETURN prof;
END; $$;

GRANT EXECUTE ON FUNCTION public.award_points_and_streak(UUID, INTEGER) TO authenticated;

-- =====================================================================
-- REALTIME (leaderboard)
-- =====================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
