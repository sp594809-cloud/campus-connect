-- Restrict admin/maintenance SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_otp_codes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_top_selling_materials() FROM PUBLIC, anon, authenticated;
-- service_role retains EXECUTE by default ownership; explicit grant for clarity:
GRANT EXECUTE ON FUNCTION public.cleanup_expired_otp_codes() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_top_selling_materials() TO service_role;