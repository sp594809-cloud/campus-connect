
-- Profile additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text UNIQUE,
  ADD COLUMN IF NOT EXISTS college_name text,
  ADD COLUMN IF NOT EXISTS graduation_year integer,
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resume_url text;

-- Roles system
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('student', 'recruiter', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;
CREATE POLICY user_roles_select_own ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS user_roles_admin_all ON public.user_roles;
CREATE POLICY user_roles_admin_all ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Recruiter tables
CREATE TABLE IF NOT EXISTS public.recruiter_saved_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL,
  student_id uuid NOT NULL,
  shortlisted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recruiter_id, student_id)
);
ALTER TABLE public.recruiter_saved_candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rsc_recruiter_all ON public.recruiter_saved_candidates;
CREATE POLICY rsc_recruiter_all ON public.recruiter_saved_candidates
  FOR ALL TO authenticated
  USING (auth.uid() = recruiter_id AND public.has_role(auth.uid(), 'recruiter'))
  WITH CHECK (auth.uid() = recruiter_id AND public.has_role(auth.uid(), 'recruiter'));

CREATE TABLE IF NOT EXISTS public.recruiter_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL,
  student_id uuid NOT NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.recruiter_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rn_recruiter_all ON public.recruiter_notes;
CREATE POLICY rn_recruiter_all ON public.recruiter_notes
  FOR ALL TO authenticated
  USING (auth.uid() = recruiter_id AND public.has_role(auth.uid(), 'recruiter'))
  WITH CHECK (auth.uid() = recruiter_id AND public.has_role(auth.uid(), 'recruiter'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_karma_total ON public.profiles (karma_total DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_branch ON public.profiles (branch);
CREATE INDEX IF NOT EXISTS idx_profiles_placement ON public.profiles (placement_status);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON public.profiles (verified);
CREATE INDEX IF NOT EXISTS idx_profiles_grad_year ON public.profiles (graduation_year);
CREATE INDEX IF NOT EXISTS idx_profiles_skills_gin ON public.profiles USING gin (skills);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);

-- Employability score view
CREATE OR REPLACE VIEW public.employability_score_view AS
SELECT
  p.id,
  p.name,
  p.username,
  p.avatar_url,
  p.branch,
  p.year,
  p.college_name,
  p.graduation_year,
  p.placement_status,
  p.company,
  p.verified,
  p.skills,
  p.karma_total,
  COALESCE(ds.current_streak, 0) AS current_streak,
  COALESCE(ds.longest_streak, 0) AS longest_streak,
  COALESCE(ds.total_completed, 0) AS total_completed,
  COALESCE(ie.cnt, 0) AS interview_posts_count,
  COALESCE(po.cnt, 0) AS posts_count,
  LEAST(100, ROUND(
      LEAST(40, p.karma_total::numeric / 25)
    + LEAST(25, COALESCE(ds.current_streak,0)::numeric * 0.8)
    + LEAST(20, COALESCE(ds.total_completed,0)::numeric * 0.4)
    + LEAST(15, COALESCE(ie.cnt,0)::numeric * 3)
  ))::int AS employability_score
FROM public.profiles p
LEFT JOIN public.dsa_streaks ds ON ds.user_id = p.id
LEFT JOIN (
  SELECT author_id, COUNT(*)::int AS cnt
  FROM public.interview_experiences GROUP BY author_id
) ie ON ie.author_id = p.id
LEFT JOIN (
  SELECT author_id, COUNT(*)::int AS cnt
  FROM public.posts GROUP BY author_id
) po ON po.author_id = p.id
WHERE p.onboarded = true;

GRANT SELECT ON public.employability_score_view TO authenticated, anon;
