
-- 1. hidden_at columns
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS hidden_at timestamptz, ADD COLUMN IF NOT EXISTS hidden_reason text;
ALTER TABLE public.community_messages ADD COLUMN IF NOT EXISTS hidden_at timestamptz, ADD COLUMN IF NOT EXISTS hidden_reason text;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS hidden_at timestamptz, ADD COLUMN IF NOT EXISTS hidden_reason text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS hidden_at timestamptz, ADD COLUMN IF NOT EXISTS hidden_reason text;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS resolution_note text;

-- 2. Auto-hide trigger
CREATE OR REPLACE FUNCTION public.auto_hide_on_reports()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count int;
BEGIN
  SELECT COUNT(DISTINCT reporter_id) INTO v_count
    FROM public.reports
    WHERE content_type = NEW.content_type AND content_id = NEW.content_id;
  IF v_count >= 3 THEN
    IF NEW.content_type = 'post' THEN
      UPDATE public.posts SET hidden_at = COALESCE(hidden_at, now()), hidden_reason = 'Auto-hidden after multiple reports'
        WHERE id = NEW.content_id AND hidden_at IS NULL;
    ELSIF NEW.content_type = 'community_message' THEN
      UPDATE public.community_messages SET hidden_at = COALESCE(hidden_at, now()), hidden_reason = 'Auto-hidden after multiple reports'
        WHERE id = NEW.content_id AND hidden_at IS NULL;
    ELSIF NEW.content_type = 'listing' THEN
      UPDATE public.marketplace_listings SET hidden_at = COALESCE(hidden_at, now()), hidden_reason = 'Auto-hidden after multiple reports'
        WHERE id = NEW.content_id AND hidden_at IS NULL;
    ELSIF NEW.content_type = 'message' THEN
      UPDATE public.messages SET hidden_at = COALESCE(hidden_at, now()), hidden_reason = 'Auto-hidden after multiple reports'
        WHERE id = NEW.content_id AND hidden_at IS NULL;
    END IF;
    INSERT INTO public.moderation_events (actor_id, target_user_id, target_table, target_id, action, reason, metadata)
    VALUES (NULL, NEW.reported_user_id, NEW.content_type, NEW.content_id, 'auto_hide', 'threshold_reports', jsonb_build_object('distinct_reporters', v_count));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_auto_hide_on_reports ON public.reports;
CREATE TRIGGER trg_auto_hide_on_reports AFTER INSERT ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.auto_hide_on_reports();

-- 3. Ban checks on remaining insertable tables
DROP POLICY IF EXISTS listings_insert_self ON public.marketplace_listings;
CREATE POLICY listings_insert_self ON public.marketplace_listings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = seller_id AND NOT public.has_active_ban(auth.uid(), NULL));

DROP POLICY IF EXISTS comments_insert_self ON public.post_comments;
CREATE POLICY comments_insert_self ON public.post_comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND NOT public.has_active_ban(auth.uid(), NULL));

-- 4. Filter hidden content + admin overrides
DROP POLICY IF EXISTS posts_select_visible ON public.posts;
CREATE POLICY posts_select_visible ON public.posts
  FOR SELECT TO authenticated
  USING (
    (hidden_at IS NULL AND (moderation_status = 'approved'::moderation_status OR auth.uid() = author_id))
    OR auth.uid() = author_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

DROP POLICY IF EXISTS cmsg_select_visible ON public.community_messages;
CREATE POLICY cmsg_select_visible ON public.community_messages
  FOR SELECT TO authenticated
  USING (
    is_community_member(community_id, auth.uid())
    AND (
      (hidden_at IS NULL AND (moderation_status = 'approved'::moderation_status OR auth.uid() = sender_id))
      OR auth.uid() = sender_id
      OR is_community_moderator(community_id, auth.uid())
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );

DROP POLICY IF EXISTS listings_select_all ON public.marketplace_listings;
CREATE POLICY listings_select_all ON public.marketplace_listings
  FOR SELECT TO authenticated
  USING (
    hidden_at IS NULL
    OR auth.uid() = seller_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

-- 5. Admin/moderator UPDATE on reports + content; admin SELECT on reports
DROP POLICY IF EXISTS reports_update_admin ON public.reports;
CREATE POLICY reports_update_admin ON public.reports
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY IF EXISTS reports_select_admin ON public.reports;
CREATE POLICY reports_select_admin ON public.reports
  FOR SELECT TO authenticated
  USING (
    auth.uid() = reporter_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

DROP POLICY IF EXISTS posts_update_admin ON public.posts;
CREATE POLICY posts_update_admin ON public.posts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY IF EXISTS listings_update_admin ON public.marketplace_listings;
CREATE POLICY listings_update_admin ON public.marketplace_listings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY IF EXISTS cmsg_update_admin ON public.community_messages;
CREATE POLICY cmsg_update_admin ON public.community_messages
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY IF EXISTS bans_admin_all ON public.user_bans;
CREATE POLICY bans_admin_all ON public.user_bans
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role) OR auth.uid() = user_id)
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role));

DROP POLICY IF EXISTS roles_admin_all ON public.user_roles;
CREATE POLICY roles_admin_all ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id)
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 6. Drop are_connected-dependent policies, then drop tables/functions
DROP POLICY IF EXISTS profiles_select_connections ON public.profiles;
DROP POLICY IF EXISTS msg_insert_participant_sender ON public.messages;
CREATE POLICY msg_insert_participant_sender ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND is_conversation_participant(conversation_id, auth.uid())
    AND NOT public.has_active_ban(auth.uid(), NULL)
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND NOT public.is_blocked_pair(c.user_a, c.user_b)
    )
  );

DROP TABLE IF EXISTS public.connection_requests CASCADE;
DROP FUNCTION IF EXISTS public.are_connected(uuid, uuid) CASCADE;

DROP TABLE IF EXISTS public.recruiter_notes CASCADE;
DROP TABLE IF EXISTS public.recruiter_saved_candidates CASCADE;
