
-- =========================================================
-- B-Tree indexes (equality / range lookups)
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_listings_status_created
  ON public.marketplace_listings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_category
  ON public.marketplace_listings (category);
CREATE INDEX IF NOT EXISTS idx_listings_seller
  ON public.marketplace_listings (seller_id);

CREATE INDEX IF NOT EXISTS idx_study_materials_listing
  ON public.study_materials (listing_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_seller
  ON public.study_materials (seller_id);
CREATE INDEX IF NOT EXISTS idx_study_materials_type
  ON public.study_materials (type);

CREATE INDEX IF NOT EXISTS idx_material_purchases_buyer
  ON public.material_purchases (buyer_id);
CREATE INDEX IF NOT EXISTS idx_material_purchases_material
  ON public.material_purchases (material_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_material_purchase_buyer
  ON public.material_purchases (material_id, buyer_id);

CREATE INDEX IF NOT EXISTS idx_posts_author_created
  ON public.posts (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post
  ON public.post_likes (post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post
  ON public.post_comments (post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conv_created
  ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cmsg_community_created
  ON public.community_messages (community_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ie_company_year
  ON public.interview_experiences (company_name, interview_year DESC);

-- =========================================================
-- GIN: full-text search + array columns
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_posts_content_fts
  ON public.posts USING GIN (to_tsvector('english', coalesce(content, '')));

CREATE INDEX IF NOT EXISTS idx_listings_search_fts
  ON public.marketplace_listings
  USING GIN (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));

CREATE INDEX IF NOT EXISTS idx_profiles_interests_gin
  ON public.profiles USING GIN (interests);
CREATE INDEX IF NOT EXISTS idx_profiles_skills_gin
  ON public.profiles USING GIN (skills);
CREATE INDEX IF NOT EXISTS idx_profiles_mentor_topics_gin
  ON public.profiles USING GIN (mentor_topics);

-- =========================================================
-- BRIN: append-only time-series tables (tiny + fast)
-- =========================================================
CREATE INDEX IF NOT EXISTS brin_karma_events_created
  ON public.karma_events USING BRIN (created_at);
CREATE INDEX IF NOT EXISTS brin_messages_created
  ON public.messages USING BRIN (created_at);
CREATE INDEX IF NOT EXISTS brin_cmsg_created
  ON public.community_messages USING BRIN (created_at);
CREATE INDEX IF NOT EXISTS brin_material_purchases_created
  ON public.material_purchases USING BRIN (created_at);

-- =========================================================
-- Materialized view: Top-selling study materials leaderboard
-- =========================================================
DROP MATERIALIZED VIEW IF EXISTS public.top_selling_materials;
CREATE MATERIALIZED VIEW public.top_selling_materials AS
SELECT
  sm.id              AS material_id,
  sm.seller_id,
  sm.type,
  sm.listing_id,
  COUNT(mp.id)::int  AS sales_count,
  MAX(mp.created_at) AS last_sale_at
FROM public.study_materials sm
LEFT JOIN public.material_purchases mp ON mp.material_id = sm.id
GROUP BY sm.id, sm.seller_id, sm.type, sm.listing_id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_top_selling_materials
  ON public.top_selling_materials (material_id);
CREATE INDEX IF NOT EXISTS idx_top_selling_sales
  ON public.top_selling_materials (sales_count DESC);

-- Refresh helper (call from a scheduled job during off-peak hours)
CREATE OR REPLACE FUNCTION public.refresh_top_selling_materials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.top_selling_materials;
END $$;

REVOKE ALL ON FUNCTION public.refresh_top_selling_materials() FROM public;
GRANT SELECT ON public.top_selling_materials TO authenticated;

-- =========================================================
-- Optimistic-locking buy flow for marketplace
-- Atomically: flip listing -> 'sold' (only if available) and
-- insert the purchase row. Returns the purchase id, or NULL if
-- the item was already taken.
-- =========================================================
CREATE OR REPLACE FUNCTION public.purchase_material(_material_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_listing   uuid;
  v_seller    uuid;
  v_updated   int;
  v_purchase  uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT listing_id, seller_id
    INTO v_listing, v_seller
    FROM public.study_materials
   WHERE id = _material_id;

  IF v_listing IS NULL THEN
    RAISE EXCEPTION 'Material not found';
  END IF;
  IF v_seller = v_uid THEN
    RAISE EXCEPTION 'Cannot buy your own item';
  END IF;

  -- Optimistic lock: only succeeds if status is still 'available'.
  UPDATE public.marketplace_listings
     SET status = 'sold', updated_at = now()
   WHERE id = v_listing
     AND status = 'available';
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    -- Someone else got it first OR it's a multi-buy digital item.
    -- For digital items we still record the purchase even if
    -- the listing is no longer 'available'.
    NULL;
  END IF;

  INSERT INTO public.material_purchases (material_id, listing_id, buyer_id)
  VALUES (_material_id, v_listing, v_uid)
  ON CONFLICT (material_id, buyer_id) DO NOTHING
  RETURNING id INTO v_purchase;

  IF v_purchase IS NULL THEN
    SELECT id INTO v_purchase
      FROM public.material_purchases
     WHERE material_id = _material_id AND buyer_id = v_uid;
  END IF;

  RETURN v_purchase;
END $$;

GRANT EXECUTE ON FUNCTION public.purchase_material(uuid) TO authenticated;
