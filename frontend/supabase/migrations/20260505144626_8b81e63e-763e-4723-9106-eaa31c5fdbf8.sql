
-- Enums
CREATE TYPE public.company_category AS ENUM ('product','service','fintech','gcc','startup','core');
CREATE TYPE public.application_source AS ENUM ('tpo','referral','off_campus','linkedin','pool_campus');
CREATE TYPE public.interview_outcome AS ENUM ('selected','rejected','waitlisted','withdrew');
CREATE TYPE public.role_type AS ENUM ('internship','full_time','ppo');
CREATE TYPE public.difficulty_level AS ENUM ('easy','medium','hard');
CREATE TYPE public.round_type AS ENUM ('oa','technical','system_design','managerial','hr','group_discussion');
CREATE TYPE public.interviewer_behavior AS ENUM ('friendly','neutral','stress_test','rude');

-- Main table
CREATE TABLE public.interview_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  company_name text NOT NULL,
  company_category public.company_category NOT NULL DEFAULT 'product',
  role text NOT NULL,
  role_type public.role_type NOT NULL DEFAULT 'full_time',
  application_source public.application_source NOT NULL DEFAULT 'tpo',
  ctc_lpa numeric,
  outcome public.interview_outcome NOT NULL,
  rejection_round text,
  interview_year int NOT NULL,
  interview_month int,
  college_year_at_time text,
  overall_difficulty public.difficulty_level NOT NULL DEFAULT 'medium',
  prep_duration_months int,
  interviewer_behavior public.interviewer_behavior,
  mistakes text DEFAULT '',
  strategy text DEFAULT '',
  anonymous boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  upvotes_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ie_company ON public.interview_experiences(company_name);
CREATE INDEX idx_ie_category ON public.interview_experiences(company_category);
CREATE INDEX idx_ie_year ON public.interview_experiences(interview_year);
CREATE INDEX idx_ie_author ON public.interview_experiences(author_id);

CREATE TRIGGER trg_ie_updated BEFORE UPDATE ON public.interview_experiences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.interview_experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY ie_select_all ON public.interview_experiences FOR SELECT TO authenticated USING (true);
CREATE POLICY ie_insert_self ON public.interview_experiences FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY ie_update_self ON public.interview_experiences FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY ie_delete_self ON public.interview_experiences FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- Rounds
CREATE TABLE public.interview_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.interview_experiences(id) ON DELETE CASCADE,
  round_number int NOT NULL,
  round_type public.round_type NOT NULL,
  duration_minutes int,
  difficulty public.difficulty_level NOT NULL DEFAULT 'medium',
  question_types text[] NOT NULL DEFAULT '{}',
  interviewer_behavior public.interviewer_behavior,
  description text DEFAULT '',
  code_snippet text,
  code_language text,
  mistakes_made text DEFAULT '',
  strategy_used text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ir_exp ON public.interview_rounds(experience_id);

ALTER TABLE public.interview_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY ir_select_all ON public.interview_rounds FOR SELECT TO authenticated USING (true);
CREATE POLICY ir_insert_author ON public.interview_rounds FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.interview_experiences e WHERE e.id = experience_id AND e.author_id = auth.uid()));
CREATE POLICY ir_update_author ON public.interview_rounds FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.interview_experiences e WHERE e.id = experience_id AND e.author_id = auth.uid()));
CREATE POLICY ir_delete_author ON public.interview_rounds FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.interview_experiences e WHERE e.id = experience_id AND e.author_id = auth.uid()));
