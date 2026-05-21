ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS created_by uuid;

DROP POLICY IF EXISTS communities_insert_auth ON public.communities;
CREATE POLICY communities_insert_auth ON public.communities
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY communities_update_creator ON public.communities
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY communities_delete_creator ON public.communities
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by);