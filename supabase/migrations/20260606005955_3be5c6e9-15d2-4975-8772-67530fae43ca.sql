
-- 1) PROFILE PRIVACY
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS discoverable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_visibility text NOT NULL DEFAULT 'connections'
    CHECK (profile_visibility IN ('public','connections','private')),
  ADD COLUMN IF NOT EXISTS views_incognito boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_self" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT TO authenticated USING (profile_visibility = 'public');
CREATE POLICY "profiles_select_connections" ON public.profiles
  FOR SELECT TO authenticated USING (
    profile_visibility = 'connections' AND public.are_connected(auth.uid(), id)
  );

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT id, name, branch, year, bio, avatar_url, interests, skills,
         open_to_mentor, looking_for_mentor_in, placement_status, company,
         college_email_verified
  FROM public.profiles
  WHERE discoverable = true AND onboarded = true;
GRANT SELECT ON public.profiles_public TO authenticated;

-- 2) PROFILE VIEWS LOG
CREATE TABLE IF NOT EXISTS public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'profile',
  viewed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profile_views_viewed_recent
  ON public.profile_views (viewed_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS profile_views_pair_recent
  ON public.profile_views (viewer_id, viewed_id, viewed_at DESC);
GRANT SELECT, INSERT ON public.profile_views TO authenticated;
GRANT ALL ON public.profile_views TO service_role;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pv_select_viewed" ON public.profile_views
  FOR SELECT TO authenticated USING (auth.uid() = viewed_id);
CREATE POLICY "pv_insert_self" ON public.profile_views
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_id);

CREATE OR REPLACE FUNCTION public.log_profile_view(_viewed uuid, _source text DEFAULT 'profile')
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_me uuid := auth.uid();
  v_incognito boolean;
  v_recent boolean;
BEGIN
  IF v_me IS NULL OR v_me = _viewed THEN RETURN; END IF;
  SELECT views_incognito INTO v_incognito FROM public.profiles WHERE id = v_me;
  IF v_incognito THEN RETURN; END IF;
  SELECT EXISTS (
    SELECT 1 FROM public.profile_views
    WHERE viewer_id = v_me AND viewed_id = _viewed
      AND viewed_at > now() - interval '1 hour'
  ) INTO v_recent;
  IF v_recent THEN RETURN; END IF;
  INSERT INTO public.profile_views (viewer_id, viewed_id, source)
  VALUES (v_me, _viewed, COALESCE(_source, 'profile'));
END $$;

-- 3) COMMUNITY MODERATORS
CREATE TABLE IF NOT EXISTS public.community_moderators (
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'mod' CHECK (role IN ('mod','faculty')),
  assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_moderators TO authenticated;
GRANT ALL ON public.community_moderators TO service_role;
ALTER TABLE public.community_moderators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cmod_select_all" ON public.community_moderators
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "cmod_insert_creator" ON public.community_moderators
  FOR INSERT TO authenticated WITH CHECK (public.is_community_admin(community_id, auth.uid()));
CREATE POLICY "cmod_delete_creator" ON public.community_moderators
  FOR DELETE TO authenticated USING (public.is_community_admin(community_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.is_community_moderator(_cid uuid, _uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_moderators
    WHERE community_id = _cid AND user_id = _uid
  ) OR public.is_community_admin(_cid, _uid)
$$;

INSERT INTO public.community_moderators (community_id, user_id, role, assigned_by)
SELECT c.id, c.created_by, 'mod', c.created_by
FROM public.communities c
WHERE c.created_by IS NOT NULL
ON CONFLICT DO NOTHING;

-- 4) MODERATION PIPELINE
DO $$ BEGIN
  CREATE TYPE public.moderation_status AS ENUM ('pending','approved','rejected','shadow');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS moderation_status public.moderation_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS moderation_reason text,
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz;
ALTER TABLE public.community_messages
  ADD COLUMN IF NOT EXISTS moderation_status public.moderation_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS moderation_reason text,
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz;

UPDATE public.posts SET moderation_status = 'approved' WHERE moderation_status = 'pending';
UPDATE public.community_messages SET moderation_status = 'approved' WHERE moderation_status = 'pending';

DROP POLICY IF EXISTS "posts_select_all" ON public.posts;
CREATE POLICY "posts_select_visible" ON public.posts
  FOR SELECT TO authenticated USING (
    moderation_status = 'approved' OR auth.uid() = author_id
  );

DROP POLICY IF EXISTS "cmsg_select_members" ON public.community_messages;
CREATE POLICY "cmsg_select_visible" ON public.community_messages
  FOR SELECT TO authenticated USING (
    public.is_community_member(community_id, auth.uid())
    AND (
      moderation_status = 'approved'
      OR auth.uid() = sender_id
      OR public.is_community_moderator(community_id, auth.uid())
    )
  );

CREATE POLICY "cmsg_update_moderator" ON public.community_messages
  FOR UPDATE TO authenticated USING (public.is_community_moderator(community_id, auth.uid()));
CREATE POLICY "cmsg_delete_moderator_extra" ON public.community_messages
  FOR DELETE TO authenticated USING (public.is_community_moderator(community_id, auth.uid()));

CREATE TABLE IF NOT EXISTS public.moderation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_table text NOT NULL,
  target_id uuid NOT NULL,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  decision text NOT NULL,
  model text,
  scores jsonb,
  matched_terms text[],
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.moderation_events TO authenticated;
GRANT ALL ON public.moderation_events TO service_role;
ALTER TABLE public.moderation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mev_select_author" ON public.moderation_events
  FOR SELECT TO authenticated USING (auth.uid() = author_id);

CREATE TABLE IF NOT EXISTS public.banned_terms (
  term text PRIMARY KEY,
  category text NOT NULL,
  severity text NOT NULL DEFAULT 'high' CHECK (severity IN ('low','medium','high','zero_tolerance')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.banned_terms TO authenticated;
GRANT ALL ON public.banned_terms TO service_role;
ALTER TABLE public.banned_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bt_select_all" ON public.banned_terms
  FOR SELECT TO authenticated USING (true);

INSERT INTO public.banned_terms (term, category, severity) VALUES
  ('kill yourself','harassment','zero_tolerance'),
  ('kys','harassment','zero_tolerance'),
  ('go die','harassment','zero_tolerance'),
  ('lynch','threat','zero_tolerance'),
  ('genocide','hate','zero_tolerance'),
  ('subhuman','hate','zero_tolerance')
ON CONFLICT DO NOTHING;

-- 5) CODE OF CONDUCT + BANS
CREATE TABLE IF NOT EXISTS public.community_code_of_conduct (
  community_id uuid PRIMARY KEY REFERENCES public.communities(id) ON DELETE CASCADE,
  content_md text NOT NULL,
  version int NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.community_code_of_conduct TO authenticated;
GRANT ALL ON public.community_code_of_conduct TO service_role;
ALTER TABLE public.community_code_of_conduct ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coc_select_all" ON public.community_code_of_conduct
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "coc_write_mod" ON public.community_code_of_conduct
  FOR ALL TO authenticated
  USING (public.is_community_moderator(community_id, auth.uid()))
  WITH CHECK (public.is_community_moderator(community_id, auth.uid()));

INSERT INTO public.community_code_of_conduct (community_id, content_md, version)
SELECT id,
$$# Community Code of Conduct

By joining this community you agree to:

1. **Be respectful.** No harassment, bullying, or personal attacks.
2. **No hate speech.** Slurs, dehumanizing language, or incitement of violence based on race, religion, gender, caste, sexuality, disability, or nationality result in a **permanent ban**.
3. **No spam, scams, or illegal content.**
4. **Keep it on-topic** for what this community is about.
5. **Moderators have the final say.** Repeated violations result in removal.

Zero-tolerance: a single instance of hate speech or credible threats = permanent ban with no appeal.$$,
  1
FROM public.communities
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.community_coc_acceptances (
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  version int NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.community_coc_acceptances TO authenticated;
GRANT ALL ON public.community_coc_acceptances TO service_role;
ALTER TABLE public.community_coc_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coca_select_self_or_mod" ON public.community_coc_acceptances
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id OR public.is_community_moderator(community_id, auth.uid())
  );
CREATE POLICY "coca_insert_self" ON public.community_coc_acceptances
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coca_update_self" ON public.community_coc_acceptances
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.community_coc_acceptances (community_id, user_id, version)
SELECT cm.community_id, cm.user_id, 1
FROM public.community_members cm
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scope text NOT NULL CHECK (scope IN ('global','community')),
  community_id uuid REFERENCES public.communities(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT '',
  evidence_ref text,
  banned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  permanent boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_bans_user_idx ON public.user_bans (user_id);
GRANT SELECT ON public.user_bans TO authenticated;
GRANT ALL ON public.user_bans TO service_role;
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bans_select_self_or_mod" ON public.user_bans
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id
    OR (community_id IS NOT NULL AND public.is_community_moderator(community_id, auth.uid()))
  );

CREATE OR REPLACE FUNCTION public.has_active_ban(_uid uuid, _cid uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_bans
    WHERE user_id = _uid
      AND (permanent OR expires_at IS NULL OR expires_at > now())
      AND (scope = 'global' OR (_cid IS NOT NULL AND community_id = _cid))
  )
$$;

DROP POLICY IF EXISTS "posts_insert_self" ON public.posts;
CREATE POLICY "posts_insert_self" ON public.posts
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = author_id AND NOT public.has_active_ban(auth.uid(), NULL)
  );

DROP POLICY IF EXISTS "cm_insert_self" ON public.community_members;
CREATE POLICY "cm_insert_self" ON public.community_members
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND NOT public.has_active_ban(auth.uid(), community_id)
    AND EXISTS (
      SELECT 1 FROM public.community_coc_acceptances a
      JOIN public.community_code_of_conduct c ON c.community_id = a.community_id
      WHERE a.community_id = community_members.community_id
        AND a.user_id = auth.uid()
        AND a.version >= c.version
    )
  );

DROP POLICY IF EXISTS "cmsg_insert_members" ON public.community_messages;
CREATE POLICY "cmsg_insert_members" ON public.community_messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id
    AND public.is_community_member(community_id, auth.uid())
    AND NOT public.has_active_ban(auth.uid(), community_id)
    AND (
      public.is_community_moderator(community_id, auth.uid())
      OR NOT EXISTS (
        SELECT 1 FROM public.communities
        WHERE id = community_messages.community_id AND admins_only = true
      )
    )
  );
