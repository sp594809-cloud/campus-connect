
DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
DROP POLICY IF EXISTS post_media_public_read ON storage.objects;
DROP POLICY IF EXISTS chat_media_public_read ON storage.objects;

CREATE POLICY avatars_owner_list ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY post_media_owner_list ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'post-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY chat_media_owner_list ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]);
