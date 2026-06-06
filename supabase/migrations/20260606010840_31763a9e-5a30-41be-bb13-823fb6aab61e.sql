
REVOKE EXECUTE ON FUNCTION public.delete_community_message(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.remove_community_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.transfer_community_moderator(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_community_rules(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_community_message(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_community_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_community_moderator(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_community_rules(uuid, text) TO authenticated;
