
-- 1) Profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consent_acknowledged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS recruiter_visible boolean NOT NULL DEFAULT false;

-- 2) Reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid,
  content_type text NOT NULL CHECK (content_type IN ('post','message','community_message','listing')),
  content_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN ('harassment','inappropriate','misinformation','scam','other')),
  details text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','actioned','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

CREATE UNIQUE INDEX IF NOT EXISTS reports_unique_per_user_content
  ON public.reports (reporter_id, content_type, content_id);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports (status, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_insert_self" ON public.reports;
CREATE POLICY "reports_insert_self" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_select_self_or_admin" ON public.reports;
CREATE POLICY "reports_select_self_or_admin" ON public.reports
  FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "reports_update_admin" ON public.reports;
CREATE POLICY "reports_update_admin" ON public.reports
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) Communities: moderator + rules
ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS moderator_id uuid,
  ADD COLUMN IF NOT EXISTS rules text;

UPDATE public.communities SET moderator_id = created_by WHERE moderator_id IS NULL;

UPDATE public.communities SET rules = COALESCE(rules,
  E'Welcome to this community 👋\n\nPlease keep things respectful:\n• No hate speech, harassment, or personal attacks\n• Stay on topic and contribute meaningfully\n• No spam, scams, or self-promotion without context\n• Reports are reviewed; repeat offenders are removed\n\nThe moderator can update these rules at any time.'
);

CREATE OR REPLACE FUNCTION public.on_community_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.moderator_id IS NULL THEN
    NEW.moderator_id := NEW.created_by;
  END IF;
  IF NEW.rules IS NULL OR length(trim(NEW.rules)) = 0 THEN
    NEW.rules := E'Welcome to this community 👋\n\nPlease keep things respectful:\n• No hate speech, harassment, or personal attacks\n• Stay on topic and contribute meaningfully\n• No spam, scams, or self-promotion without context\n• Reports are reviewed; repeat offenders are removed\n\nThe moderator can update these rules at any time.';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS communities_on_create ON public.communities;
CREATE TRIGGER communities_on_create
  BEFORE INSERT ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.on_community_created();

DROP POLICY IF EXISTS "communities_update_moderator" ON public.communities;
CREATE POLICY "communities_update_moderator" ON public.communities
  FOR UPDATE TO authenticated
  USING (auth.uid() = moderator_id OR auth.uid() = created_by)
  WITH CHECK (auth.uid() = moderator_id OR auth.uid() = created_by);

-- 4) Moderator RPCs
CREATE OR REPLACE FUNCTION public.delete_community_message(_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_cid uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT community_id INTO v_cid FROM public.community_messages WHERE id = _message_id;
  IF v_cid IS NULL THEN RAISE EXCEPTION 'Message not found'; END IF;
  IF NOT public.is_community_moderator(v_cid, v_uid) THEN
    RAISE EXCEPTION 'Only community moderators can remove messages';
  END IF;
  DELETE FROM public.community_messages WHERE id = _message_id;
END $$;

CREATE OR REPLACE FUNCTION public.remove_community_member(_community_id uuid, _user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_primary uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_community_moderator(_community_id, v_uid) THEN
    RAISE EXCEPTION 'Only community moderators can remove members';
  END IF;
  SELECT moderator_id INTO v_primary FROM public.communities WHERE id = _community_id;
  IF v_primary = _user_id THEN
    RAISE EXCEPTION 'Cannot remove the primary moderator';
  END IF;
  DELETE FROM public.community_members WHERE community_id = _community_id AND user_id = _user_id;
END $$;

CREATE OR REPLACE FUNCTION public.transfer_community_moderator(_community_id uuid, _new_mod uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_primary uuid;
  v_member boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT moderator_id INTO v_primary FROM public.communities WHERE id = _community_id;
  IF v_primary IS NULL OR v_primary <> v_uid THEN
    RAISE EXCEPTION 'Only the current primary moderator can transfer the role';
  END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.community_members WHERE community_id = _community_id AND user_id = _new_mod
  ) INTO v_member;
  IF NOT v_member THEN
    RAISE EXCEPTION 'New moderator must be a member of this community';
  END IF;
  UPDATE public.communities SET moderator_id = _new_mod WHERE id = _community_id;
  INSERT INTO public.community_moderators (community_id, user_id, role)
    VALUES (_community_id, _new_mod, 'moderator')
  ON CONFLICT DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION public.update_community_rules(_community_id uuid, _rules text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_community_moderator(_community_id, v_uid) THEN
    RAISE EXCEPTION 'Only community moderators can edit the rules';
  END IF;
  UPDATE public.communities SET rules = _rules WHERE id = _community_id;
END $$;

-- 5) Recreate employability_score_view including recruiter_visible
DROP VIEW IF EXISTS public.employability_score_view;
CREATE VIEW public.employability_score_view AS
 SELECT p.id,
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
    p.recruiter_visible,
    COALESCE(ds.current_streak, 0) AS current_streak,
    COALESCE(ds.longest_streak, 0) AS longest_streak,
    COALESCE(ds.total_completed, 0) AS total_completed,
    COALESCE(ie.cnt, 0) AS interview_posts_count,
    COALESCE(po.cnt, 0) AS posts_count,
    (LEAST((100)::numeric, round((((LEAST((40)::numeric, ((p.karma_total)::numeric / (25)::numeric)) + LEAST((25)::numeric, ((COALESCE(ds.current_streak, 0))::numeric * 0.8))) + LEAST((20)::numeric, ((COALESCE(ds.total_completed, 0))::numeric * 0.4))) + LEAST((15)::numeric, ((COALESCE(ie.cnt, 0))::numeric * (3)::numeric))))))::integer AS employability_score
   FROM (((public.profiles p
     LEFT JOIN public.dsa_streaks ds ON ((ds.user_id = p.id)))
     LEFT JOIN ( SELECT interview_experiences.author_id,
            (count(*))::integer AS cnt
           FROM public.interview_experiences
          GROUP BY interview_experiences.author_id) ie ON ((ie.author_id = p.id)))
     LEFT JOIN ( SELECT posts.author_id,
            (count(*))::integer AS cnt
           FROM public.posts
          GROUP BY posts.author_id) po ON ((po.author_id = p.id)))
  WHERE (p.onboarded = true);

GRANT SELECT ON public.employability_score_view TO authenticated;
GRANT SELECT ON public.employability_score_view TO service_role;
