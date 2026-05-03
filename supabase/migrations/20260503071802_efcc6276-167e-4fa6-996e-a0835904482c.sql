
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.branch_type AS ENUM ('CSE','ECE','ME','EE','CE','IT','Other');
CREATE TYPE public.year_type AS ENUM ('1st','2nd','3rd','4th');
CREATE TYPE public.placement_status AS ENUM ('Placed','Looking','Interning','N/A');
CREATE TYPE public.post_type AS ENUM ('update','question','achievement','resource');
CREATE TYPE public.mentorship_status AS ENUM ('pending','accepted','declined');

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  branch public.branch_type,
  year public.year_type,
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  github TEXT,
  linkedin TEXT,
  interests TEXT[] NOT NULL DEFAULT '{}',
  skills TEXT[] NOT NULL DEFAULT '{}',
  open_to_mentor BOOLEAN NOT NULL DEFAULT false,
  looking_for_mentor_in TEXT[] NOT NULL DEFAULT '{}',
  placement_status public.placement_status NOT NULL DEFAULT 'N/A',
  company TEXT,
  college_email_verified BOOLEAN NOT NULL DEFAULT false,
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_self" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email TEXT := NEW.email;
  v_is_college BOOLEAN := false;
BEGIN
  -- Heuristic: any .edu, .ac.in, .edu.* domain counts as a college email
  IF v_email ~* '@.+\.(edu|ac\.[a-z]+|edu\.[a-z]+)$' THEN
    v_is_college := true;
  END IF;

  INSERT INTO public.profiles (id, name, avatar_url, college_email_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(v_email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    v_is_college
  );
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- COMMUNITIES
-- =========================================================
CREATE TABLE public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  interest TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '✨',
  color TEXT NOT NULL DEFAULT 'from-violet-500 to-fuchsia-500',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "communities_select_all" ON public.communities
  FOR SELECT TO authenticated USING (true);

CREATE TABLE public.community_members (
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cm_select_all" ON public.community_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "cm_insert_self" ON public.community_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cm_delete_self" ON public.community_members
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Seed communities
INSERT INTO public.communities (name, description, interest, emoji, color) VALUES
  ('AI/ML Enthusiasts','Papers, projects & study groups for ML learners.','AI/ML','🤖','from-violet-500 to-fuchsia-500'),
  ('Competitive Programming','Daily problems, contest discussions, ICPC prep.','Coding','⚡','from-amber-500 to-orange-500'),
  ('Web Dev Hub','Frontend, backend, fullstack — all things web.','Web Dev','🌐','from-sky-500 to-cyan-500'),
  ('Robotics Club','Build, break, learn. Hardware hackers welcome.','Robotics','🦾','from-rose-500 to-red-500'),
  ('Placement Prep 2026','Interview experiences, OA discussions, referrals.','Coding','🎯','from-emerald-500 to-teal-500'),
  ('Founders Circle','Student entrepreneurs sharing wins & intros.','Entrepreneurship','🚀','from-indigo-500 to-purple-500'),
  ('Photography Society','Campus shoots, gear talk, monthly themes.','Photography','📸','from-pink-500 to-rose-500'),
  ('Cybersec & CTF','Capture the flag, write-ups, security news.','Cybersecurity','🛡️','from-slate-700 to-slate-900');

-- =========================================================
-- POSTS
-- =========================================================
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.post_type NOT NULL DEFAULT 'update',
  content TEXT NOT NULL,
  tag TEXT,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_select_all" ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "posts_insert_self" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update_self" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "posts_delete_self" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE TABLE public.post_likes (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes_select_all" ON public.post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "likes_insert_self" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_self" ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =========================================================
-- CONVERSATIONS + MESSAGES
-- =========================================================
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (user_a < user_b),
  UNIQUE (user_a, user_b)
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv_participants_select" ON public.conversations
  FOR SELECT TO authenticated USING (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY "conv_participants_insert" ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY "conv_participants_update" ON public.conversations
  FOR UPDATE TO authenticated USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Helper: get-or-create conversation between two users
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(other_user UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me UUID := auth.uid();
  a UUID; b UUID; conv_id UUID;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF me = other_user THEN RAISE EXCEPTION 'Cannot chat with yourself'; END IF;
  IF me < other_user THEN a := me; b := other_user; ELSE a := other_user; b := me; END IF;

  SELECT id INTO conv_id FROM public.conversations WHERE user_a = a AND user_b = b;
  IF conv_id IS NULL THEN
    INSERT INTO public.conversations (user_a, user_b) VALUES (a, b) RETURNING id INTO conv_id;
  END IF;
  RETURN conv_id;
END $$;

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(conv_id UUID, uid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conv_id AND (user_a = uid OR user_b = uid)
  )
$$;

CREATE POLICY "msg_select_participants" ON public.messages
  FOR SELECT TO authenticated USING (public.is_conversation_participant(conversation_id, auth.uid()));
CREATE POLICY "msg_insert_participant_sender" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id AND public.is_conversation_participant(conversation_id, auth.uid())
  );
CREATE POLICY "msg_update_participants" ON public.messages
  FOR UPDATE TO authenticated USING (public.is_conversation_participant(conversation_id, auth.uid()));

-- Bump conversation last_message_at on new message
CREATE OR REPLACE FUNCTION public.bump_conversation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END $$;
CREATE TRIGGER bump_conv_after_message AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_conversation();

-- Realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- =========================================================
-- MENTORSHIP REQUESTS
-- =========================================================
CREATE TABLE public.mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  status public.mentorship_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mr_select_involved" ON public.mentorship_requests
  FOR SELECT TO authenticated USING (auth.uid() = requester_id OR auth.uid() = mentor_id);
CREATE POLICY "mr_insert_requester" ON public.mentorship_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "mr_update_mentor" ON public.mentorship_requests
  FOR UPDATE TO authenticated USING (auth.uid() = mentor_id);

-- =========================================================
-- EVENTS + RSVPS
-- =========================================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  starts_at TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  organizer TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '🎉',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_select_all" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "events_insert_auth" ON public.events FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "events_update_creator" ON public.events FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE TABLE public.event_rsvps (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rsvp_select_all" ON public.event_rsvps FOR SELECT TO authenticated USING (true);
CREATE POLICY "rsvp_insert_self" ON public.event_rsvps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rsvp_delete_self" ON public.event_rsvps FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Seed sample events
INSERT INTO public.events (title, description, starts_at, location, organizer, emoji) VALUES
  ('Campus Hackathon 2026','48-hour build sprint. ₹1L prize pool. Form your team in Discover.', now() + interval '7 days','Innovation Centre','Coding Club','💻'),
  ('Robotics Demo Day','Autonomous rover unveiling + open lab tours.', now() + interval '3 days','Mech Lab 2','Robotics Club','🦾'),
  ('Resume Review with Seniors','Bring your resume. Placed seniors will review live.', now() + interval '5 days','Seminar Hall A','Placement Cell','📄'),
  ('CTF 101 Workshop','Beginner-friendly capture the flag intro.', now() + interval '10 days','Lab 4','Cybersec Society','🛡️'),
  ('Photography Walk','Sunset shoot around the south block.', now() + interval '2 days','South Block','Photography Society','📸');
