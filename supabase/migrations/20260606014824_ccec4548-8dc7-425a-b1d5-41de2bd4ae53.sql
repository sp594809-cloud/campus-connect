
-- 1) user_blocks table
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
GRANT ALL ON public.user_blocks TO service_role;

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocks_select_self" ON public.user_blocks
  FOR SELECT TO authenticated
  USING (auth.uid() = blocker_id);

CREATE POLICY "blocks_insert_self" ON public.user_blocks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "blocks_delete_self" ON public.user_blocks
  FOR DELETE TO authenticated
  USING (auth.uid() = blocker_id);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);

-- 2) helper: either direction
CREATE OR REPLACE FUNCTION public.is_blocked_pair(a uuid, b uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = a AND blocked_id = b)
       OR (blocker_id = b AND blocked_id = a)
  )
$$;

-- 3) allow sender to delete own 1-1 chat messages
DROP POLICY IF EXISTS "msg_delete_sender" ON public.messages;
CREATE POLICY "msg_delete_sender" ON public.messages
  FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);

-- 4) block blocked-pair from new 1-1 messages
DROP POLICY IF EXISTS "msg_insert_participant_sender" ON public.messages;
CREATE POLICY "msg_insert_participant_sender" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_conversation_participant(conversation_id, auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND public.are_connected(c.user_a, c.user_b)
        AND NOT public.is_blocked_pair(c.user_a, c.user_b)
    )
  );

-- 5) block-aware get_or_create_conversation
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(other_user uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  a uuid; b uuid; conv_id uuid;
BEGIN
  IF me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF me = other_user THEN RAISE EXCEPTION 'Cannot chat with yourself'; END IF;
  IF public.is_blocked_pair(me, other_user) THEN
    RAISE EXCEPTION 'You cannot message this user';
  END IF;
  IF me < other_user THEN a := me; b := other_user; ELSE a := other_user; b := me; END IF;
  SELECT id INTO conv_id FROM public.conversations WHERE user_a = a AND user_b = b;
  IF conv_id IS NULL THEN
    INSERT INTO public.conversations (user_a, user_b) VALUES (a, b) RETURNING id INTO conv_id;
  END IF;
  RETURN conv_id;
END $$;
