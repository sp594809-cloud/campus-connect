
-- 1) dsa_completions: restrict SELECT to owner only (notes are personal)
DROP POLICY IF EXISTS dsac_select_all ON public.dsa_completions;
CREATE POLICY dsac_select_own ON public.dsa_completions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2) interview_experiences: hide author_id of anonymous posts
DROP POLICY IF EXISTS ie_select_all ON public.interview_experiences;
CREATE POLICY ie_select_visible ON public.interview_experiences
  FOR SELECT TO authenticated
  USING (
    auth.uid() = author_id
    OR public.has_role(auth.uid(), 'recruiter'::public.app_role)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR anonymous = false
  );

CREATE OR REPLACE VIEW public.interview_experiences_public
  WITH (security_invoker = off) AS
SELECT
  id,
  CASE WHEN anonymous THEN NULL::uuid ELSE author_id END AS author_id,
  company_name, company_category, role, role_type, application_source,
  ctc_lpa, outcome, rejection_round, interview_year, interview_month,
  overall_difficulty, prep_duration_months, interviewer_behavior,
  mistakes, strategy, anonymous, verified, upvotes_count,
  college_year_at_time, created_at, updated_at
FROM public.interview_experiences;

REVOKE ALL ON public.interview_experiences_public FROM PUBLIC, anon;
GRANT SELECT ON public.interview_experiences_public TO authenticated;
