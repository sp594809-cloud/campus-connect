
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.study_material_secrets
  ADD COLUMN IF NOT EXISTS content_text text,
  ADD COLUMN IF NOT EXISTS embedding   vector(1536);

CREATE INDEX IF NOT EXISTS idx_sms_embedding_hnsw
  ON public.study_material_secrets
  USING hnsw (embedding vector_cosine_ops);

-- Semantic library search, scoped to materials the caller has unlocked
CREATE OR REPLACE FUNCTION public.search_my_library(
  query_embedding vector(1536),
  match_count     int DEFAULT 10
)
RETURNS TABLE (
  material_id uuid,
  listing_id  uuid,
  similarity  float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.material_id,
    sm.listing_id,
    1 - (s.embedding <=> query_embedding) AS similarity
  FROM public.study_material_secrets s
  JOIN public.study_materials sm ON sm.id = s.material_id
  WHERE s.embedding IS NOT NULL
    AND public.has_unlocked_material(s.material_id, auth.uid())
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.search_my_library(vector, int) TO authenticated;
