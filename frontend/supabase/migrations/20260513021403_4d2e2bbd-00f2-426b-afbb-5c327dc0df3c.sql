
-- 1) Drop unused table (aggressive cleanup)
DROP TABLE IF EXISTS public.verified_students;

-- 2) Recreate employability_score_view as SECURITY INVOKER
DROP VIEW IF EXISTS public.employability_score_view;
CREATE VIEW public.employability_score_view
WITH (security_invoker = true) AS
SELECT p.id, p.name, p.username, p.avatar_url, p.branch, p.year,
       p.college_name, p.graduation_year, p.placement_status, p.company,
       p.verified, p.skills, p.karma_total,
       COALESCE(ds.current_streak, 0) AS current_streak,
       COALESCE(ds.longest_streak, 0) AS longest_streak,
       COALESCE(ds.total_completed, 0) AS total_completed,
       COALESCE(ie.cnt, 0) AS interview_posts_count,
       COALESCE(po.cnt, 0) AS posts_count,
       (LEAST(100::numeric, round(
         LEAST(40::numeric, p.karma_total::numeric / 25::numeric) +
         LEAST(25::numeric, COALESCE(ds.current_streak,0)::numeric * 0.8) +
         LEAST(20::numeric, COALESCE(ds.total_completed,0)::numeric * 0.4) +
         LEAST(15::numeric, COALESCE(ie.cnt,0)::numeric * 3::numeric)
       )))::integer AS employability_score
  FROM profiles p
  LEFT JOIN dsa_streaks ds ON ds.user_id = p.id
  LEFT JOIN (SELECT author_id, count(*)::int AS cnt FROM interview_experiences GROUP BY author_id) ie ON ie.author_id = p.id
  LEFT JOIN (SELECT author_id, count(*)::int AS cnt FROM posts GROUP BY author_id) po ON po.author_id = p.id
 WHERE p.onboarded = true;

-- 3) Restrict the materialized view from PostgREST
REVOKE ALL ON public.top_selling_materials FROM anon, authenticated;

-- 4) Lock down SECURITY DEFINER helpers — revoke from public/anon, grant only what the app calls
REVOKE EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bump_conversation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_or_create_conversation(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_community_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_community_admin(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.sync_karma_total() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_interview_post() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_post_like() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_top_selling_materials() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_unlocked_material(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.search_my_library(vector, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bump_dsa_streak() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.purchase_material(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.are_connected(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- App-callable helpers: grant to authenticated only
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_unlocked_material(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_my_library(vector, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_material(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.are_connected(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_community_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_community_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated;

-- 5) Tighten the overly-permissive insert policy on registered_phones
DROP POLICY IF EXISTS registered_phones_self_insert ON public.registered_phones;
CREATE POLICY registered_phones_self_insert
  ON public.registered_phones
  FOR INSERT TO authenticated
  WITH CHECK (
    -- enforce 1 row per phone via existing unique key; require non-empty fields
    length(coalesce(phone_number,'')) > 0
    AND length(coalesce(enrollment_id,'')) > 0
  );
