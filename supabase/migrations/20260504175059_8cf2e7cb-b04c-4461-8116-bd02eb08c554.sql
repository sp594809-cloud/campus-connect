
-- ============ connection_requests ============
CREATE TYPE public.connection_status AS ENUM ('pending','accepted','declined');

CREATE TABLE public.connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  status public.connection_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (requester_id <> recipient_id)
);

CREATE UNIQUE INDEX connection_requests_unique_pair
  ON public.connection_requests (LEAST(requester_id, recipient_id), GREATEST(requester_id, recipient_id));

CREATE INDEX connection_requests_recipient_idx ON public.connection_requests (recipient_id, status);
CREATE INDEX connection_requests_requester_idx ON public.connection_requests (requester_id, status);

ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cr_select_involved" ON public.connection_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "cr_insert_requester" ON public.connection_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "cr_update_recipient" ON public.connection_requests
  FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id);

CREATE POLICY "cr_delete_involved" ON public.connection_requests
  FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE TRIGGER connection_requests_updated_at
  BEFORE UPDATE ON public.connection_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ are_connected helper ============
CREATE OR REPLACE FUNCTION public.are_connected(a UUID, b UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connection_requests
    WHERE status = 'accepted'
      AND ((requester_id = a AND recipient_id = b) OR (requester_id = b AND recipient_id = a))
  );
$$;

-- Gate direct messages to accepted connections only
DROP POLICY IF EXISTS "msg_insert_participant_sender" ON public.messages;
CREATE POLICY "msg_insert_participant_sender" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_conversation_participant(conversation_id, auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND public.are_connected(c.user_a, c.user_b)
    )
  );

-- ============ post_comments ============
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX post_comments_post_idx ON public.post_comments (post_id, created_at);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_all" ON public.post_comments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert_self" ON public.post_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comments_update_self" ON public.post_comments
  FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "comments_delete_self" ON public.post_comments
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- ============ avatars storage bucket ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars','avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_user_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars_user_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars_user_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============ realtime ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.connection_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
ALTER TABLE public.connection_requests REPLICA IDENTITY FULL;
ALTER TABLE public.post_comments REPLICA IDENTITY FULL;
