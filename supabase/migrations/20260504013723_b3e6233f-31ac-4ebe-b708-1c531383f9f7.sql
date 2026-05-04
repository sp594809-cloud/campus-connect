
-- 1. Communities: admin-only toggle
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS admins_only BOOLEAN NOT NULL DEFAULT false;

-- 2. Attachments on direct messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_type TEXT; -- 'image' | 'pdf'
-- Allow empty content when attachment present
ALTER TABLE public.messages ALTER COLUMN content DROP NOT NULL;

-- 3. Attachments on posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- 4. Community messages (group chat)
CREATE TABLE IF NOT EXISTS public.community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT,
  attachment_url TEXT,
  attachment_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_messages_community ON public.community_messages(community_id, created_at);

ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- Helper: is community member
CREATE OR REPLACE FUNCTION public.is_community_member(_cid UUID, _uid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS(SELECT 1 FROM public.community_members WHERE community_id = _cid AND user_id = _uid) $$;

CREATE OR REPLACE FUNCTION public.is_community_admin(_cid UUID, _uid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS(SELECT 1 FROM public.communities WHERE id = _cid AND created_by = _uid) $$;

-- Members can read messages in communities they belong to
CREATE POLICY cmsg_select_members ON public.community_messages
  FOR SELECT TO authenticated
  USING (public.is_community_member(community_id, auth.uid()));

-- Members can send unless admins_only is on (then only admin)
CREATE POLICY cmsg_insert_members ON public.community_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_community_member(community_id, auth.uid())
    AND (
      public.is_community_admin(community_id, auth.uid())
      OR NOT EXISTS (SELECT 1 FROM public.communities WHERE id = community_id AND admins_only = true)
    )
  );

-- Admin can delete any community message; sender can delete their own
CREATE POLICY cmsg_delete_admin_or_self ON public.community_messages
  FOR DELETE TO authenticated
  USING (auth.uid() = sender_id OR public.is_community_admin(community_id, auth.uid()));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;

-- 5. Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true)
  ON CONFLICT (id) DO NOTHING;

-- Public read for both
CREATE POLICY "chat_media_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'chat-media');
CREATE POLICY "post_media_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'post-media');

-- Authenticated users can upload to their own folder (uid prefix)
CREATE POLICY "chat_media_user_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "chat_media_user_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "post_media_user_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "post_media_user_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);
