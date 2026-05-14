
-- =========================
-- Foreign keys (NOT VALID, then VALIDATE) — non-destructive
-- =========================

DO $$
DECLARE r RECORD;
BEGIN
  -- profiles.id -> auth.users
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID';
  END IF;

  -- karma_events
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'karma_events_user_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.karma_events ADD CONSTRAINT karma_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;

  -- dsa_streaks
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dsa_streaks_user_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.dsa_streaks ADD CONSTRAINT dsa_streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;

  -- dsa_completions
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dsa_completions_user_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.dsa_completions ADD CONSTRAINT dsa_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;

  -- posts
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_author_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.posts ADD CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;

  -- post_likes
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_likes_post_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.post_likes ADD CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_likes_user_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.post_likes ADD CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;

  -- post_comments
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_comments_post_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.post_comments ADD CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_comments_author_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.post_comments ADD CONSTRAINT post_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;

  -- connection_requests
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'connection_requests_requester_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.connection_requests ADD CONSTRAINT connection_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'connection_requests_recipient_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.connection_requests ADD CONSTRAINT connection_requests_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;

  -- conversations
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversations_user_a_fkey') THEN
    EXECUTE 'ALTER TABLE public.conversations ADD CONSTRAINT conversations_user_a_fkey FOREIGN KEY (user_a) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversations_user_b_fkey') THEN
    EXECUTE 'ALTER TABLE public.conversations ADD CONSTRAINT conversations_user_b_fkey FOREIGN KEY (user_b) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;

  -- messages
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_conversation_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.messages ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_sender_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;

  -- communities
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'communities_created_by_fkey') THEN
    EXECUTE 'ALTER TABLE public.communities ADD CONSTRAINT communities_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'community_members_community_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.community_members ADD CONSTRAINT community_members_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'community_members_user_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.community_members ADD CONSTRAINT community_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'community_messages_community_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.community_messages ADD CONSTRAINT community_messages_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'community_messages_sender_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.community_messages ADD CONSTRAINT community_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;

  -- marketplace + study materials
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marketplace_listings_seller_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.marketplace_listings ADD CONSTRAINT marketplace_listings_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'study_materials_listing_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.study_materials ADD CONSTRAINT study_materials_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.marketplace_listings(id) ON DELETE CASCADE NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'study_materials_seller_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.study_materials ADD CONSTRAINT study_materials_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'study_material_secrets_material_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.study_material_secrets ADD CONSTRAINT study_material_secrets_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.study_materials(id) ON DELETE CASCADE NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'material_purchases_material_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.material_purchases ADD CONSTRAINT material_purchases_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.study_materials(id) ON DELETE CASCADE NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'material_purchases_listing_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.material_purchases ADD CONSTRAINT material_purchases_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.marketplace_listings(id) ON DELETE CASCADE NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'material_purchases_buyer_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.material_purchases ADD CONSTRAINT material_purchases_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;

  -- interview
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'interview_experiences_author_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.interview_experiences ADD CONSTRAINT interview_experiences_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'interview_rounds_experience_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.interview_rounds ADD CONSTRAINT interview_rounds_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES public.interview_experiences(id) ON DELETE CASCADE NOT VALID';
  END IF;

  -- events
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_created_by_fkey') THEN
    EXECUTE 'ALTER TABLE public.events ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_rsvps_event_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.event_rsvps ADD CONSTRAINT event_rsvps_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_rsvps_user_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.event_rsvps ADD CONSTRAINT event_rsvps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;

  -- mentorship
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mentorship_requests_mentor_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.mentorship_requests ADD CONSTRAINT mentorship_requests_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mentorship_requests_requester_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.mentorship_requests ADD CONSTRAINT mentorship_requests_requester_id_fkey FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;

  -- recruiter
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruiter_notes_recruiter_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.recruiter_notes ADD CONSTRAINT recruiter_notes_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruiter_notes_student_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.recruiter_notes ADD CONSTRAINT recruiter_notes_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruiter_saved_candidates_recruiter_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.recruiter_saved_candidates ADD CONSTRAINT recruiter_saved_candidates_recruiter_id_fkey FOREIGN KEY (recruiter_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recruiter_saved_candidates_student_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.recruiter_saved_candidates ADD CONSTRAINT recruiter_saved_candidates_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;

  -- user_roles
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_fkey') THEN
    EXECUTE 'ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE NOT VALID';
  END IF;

  -- Validate all newly added FKs (skip rows already failing — they'll error and we'll see)
  FOR r IN SELECT conname, conrelid::regclass AS rel FROM pg_constraint
           WHERE NOT convalidated AND contype = 'f'
             AND connamespace = 'public'::regnamespace
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %s VALIDATE CONSTRAINT %I', r.rel, r.conname);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not validate %: %', r.conname, SQLERRM;
    END;
  END LOOP;
END $$;

-- =========================
-- Indexes for common access patterns
-- =========================
CREATE INDEX IF NOT EXISTS idx_karma_events_user_created ON public.karma_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created     ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender           ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_conn_req_recipient_status ON public.connection_requests (recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_conn_req_requester_status ON public.connection_requests (requester_id, status);
CREATE INDEX IF NOT EXISTS idx_post_likes_post           ON public.post_likes (post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post        ON public.post_comments (post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_created      ON public.posts (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_material_purchases_buyer  ON public.material_purchases (buyer_id);
CREATE INDEX IF NOT EXISTS idx_material_purchases_mat    ON public.material_purchases (material_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_seller    ON public.study_materials (seller_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_listing   ON public.study_materials (listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_status_created ON public.marketplace_listings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dsa_completions_user_date ON public.dsa_completions (user_id, completed_on DESC);
CREATE INDEX IF NOT EXISTS idx_community_messages_comm_created ON public.community_messages (community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_members_user    ON public.community_members (user_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event         ON public.event_rsvps (event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user          ON public.event_rsvps (user_id);
CREATE INDEX IF NOT EXISTS idx_interview_exp_author      ON public.interview_experiences (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interview_exp_company     ON public.interview_experiences (company_name);
CREATE INDEX IF NOT EXISTS idx_user_roles_user           ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role      ON public.user_roles (user_id, role);
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_expires   ON public.otp_codes (phone_number, expires_at);

-- =========================
-- Tighten karma_events SELECT to own rows only
-- =========================
DROP POLICY IF EXISTS ke_select_auth ON public.karma_events;
CREATE POLICY ke_select_own
  ON public.karma_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =========================
-- Length limits on chat / community message content
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_content_len_chk') THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_content_len_chk
      CHECK (content IS NULL OR length(content) <= 4000) NOT VALID;
    BEGIN
      ALTER TABLE public.messages VALIDATE CONSTRAINT messages_content_len_chk;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not validate messages_content_len_chk: %', SQLERRM;
    END;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'community_messages_content_len_chk') THEN
    ALTER TABLE public.community_messages
      ADD CONSTRAINT community_messages_content_len_chk
      CHECK (content IS NULL OR length(content) <= 4000) NOT VALID;
    BEGIN
      ALTER TABLE public.community_messages VALIDATE CONSTRAINT community_messages_content_len_chk;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not validate community_messages_content_len_chk: %', SQLERRM;
    END;
  END IF;
END $$;

-- =========================
-- OTP cleanup helper (for cron/manual)
-- =========================
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_codes()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE deleted_count integer;
BEGIN
  DELETE FROM public.otp_codes
  WHERE expires_at < now() - interval '1 day'
     OR (consumed = true AND created_at < now() - interval '1 day');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END $$;

REVOKE EXECUTE ON FUNCTION public.cleanup_expired_otp_codes() FROM PUBLIC, anon, authenticated;
