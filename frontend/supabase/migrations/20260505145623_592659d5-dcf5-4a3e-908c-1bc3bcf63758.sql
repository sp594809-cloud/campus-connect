
ALTER TABLE public.profiles ADD COLUMN karma_total int NOT NULL DEFAULT 0;
CREATE INDEX idx_profiles_karma ON public.profiles(karma_total DESC);

CREATE TYPE public.karma_action AS ENUM (
  'interview_post','mentorship_completed','advice_upvoted','daily_streak','resume_review','mock_interview'
);

CREATE TABLE public.karma_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action public.karma_action NOT NULL,
  points int NOT NULL,
  ref_id uuid,
  note text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ke_user ON public.karma_events(user_id, created_at DESC);
ALTER TABLE public.karma_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY ke_select_auth ON public.karma_events FOR SELECT TO authenticated USING (true);

-- Sync trigger
CREATE OR REPLACE FUNCTION public.sync_karma_total()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET karma_total = karma_total + NEW.points WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET karma_total = karma_total - OLD.points WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER trg_karma_sync
AFTER INSERT OR DELETE ON public.karma_events
FOR EACH ROW EXECUTE FUNCTION public.sync_karma_total();

-- Auto-award: interview post
CREATE OR REPLACE FUNCTION public.award_interview_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.karma_events (user_id, action, points, ref_id, note)
  VALUES (NEW.author_id, 'interview_post', 50, NEW.id, NEW.company_name);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_award_interview_post
AFTER INSERT ON public.interview_experiences
FOR EACH ROW EXECUTE FUNCTION public.award_interview_post();

-- Auto-award: comment upvoted (+10 to comment author when liked)
-- We piggy-back on post_likes table; advice = comments. We award when a comment author's comment receives an upvote via reactions on it. Simpler: award when their POST gets liked.
CREATE OR REPLACE FUNCTION public.award_post_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_author uuid;
BEGIN
  SELECT author_id INTO v_author FROM public.posts WHERE id = NEW.post_id;
  IF v_author IS NOT NULL AND v_author <> NEW.user_id THEN
    INSERT INTO public.karma_events (user_id, action, points, ref_id, note)
    VALUES (v_author, 'advice_upvoted', 10, NEW.post_id, 'Post upvoted');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_award_post_like
AFTER INSERT ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.award_post_like();
