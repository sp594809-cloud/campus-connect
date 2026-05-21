
-- Type for digital material kind
DO $$ BEGIN
  CREATE TYPE public.study_material_type AS ENUM ('PDF_Notes', 'Live_Masterclass');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Public metadata about a digital material (safe to read)
CREATE TABLE public.study_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL,
  type public.study_material_type NOT NULL,
  preview_text text NOT NULL DEFAULT '',
  has_pdf boolean NOT NULL DEFAULT false,
  has_meeting boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_study_materials_listing ON public.study_materials(listing_id);
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY sm_select_all ON public.study_materials
  FOR SELECT TO authenticated USING (true);
CREATE POLICY sm_insert_seller ON public.study_materials
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);
CREATE POLICY sm_update_seller ON public.study_materials
  FOR UPDATE TO authenticated USING (auth.uid() = seller_id);
CREATE POLICY sm_delete_seller ON public.study_materials
  FOR DELETE TO authenticated USING (auth.uid() = seller_id);

-- Sensitive fields: pdf storage path + meeting link
CREATE TABLE public.study_material_secrets (
  material_id uuid PRIMARY KEY REFERENCES public.study_materials(id) ON DELETE CASCADE,
  pdf_path text,
  meeting_link text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.study_material_secrets ENABLE ROW LEVEL SECURITY;

-- Purchases / unlocks
CREATE TABLE public.material_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  material_id uuid NOT NULL REFERENCES public.study_materials(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (buyer_id, material_id)
);
CREATE INDEX idx_material_purchases_buyer ON public.material_purchases(buyer_id);
ALTER TABLE public.material_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY mp_select_buyer_or_seller ON public.material_purchases
  FOR SELECT TO authenticated USING (
    auth.uid() = buyer_id
    OR EXISTS (SELECT 1 FROM public.study_materials s WHERE s.id = material_purchases.material_id AND s.seller_id = auth.uid())
  );
CREATE POLICY mp_insert_self ON public.material_purchases
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);

-- Helper to gate secrets
CREATE OR REPLACE FUNCTION public.has_unlocked_material(_mid uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.study_materials s WHERE s.id = _mid AND s.seller_id = _uid
  ) OR EXISTS (
    SELECT 1 FROM public.material_purchases p WHERE p.material_id = _mid AND p.buyer_id = _uid
  );
$$;

CREATE POLICY sms_select_unlocked ON public.study_material_secrets
  FOR SELECT TO authenticated USING (public.has_unlocked_material(material_id, auth.uid()));
CREATE POLICY sms_insert_seller ON public.study_material_secrets
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.study_materials s WHERE s.id = material_id AND s.seller_id = auth.uid())
  );
CREATE POLICY sms_update_seller ON public.study_material_secrets
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.study_materials s WHERE s.id = material_id AND s.seller_id = auth.uid())
  );

-- Private storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('study-materials', 'study-materials', false)
ON CONFLICT (id) DO NOTHING;

-- Sellers can upload/manage their own folder; reads happen via signed URLs from an edge function
CREATE POLICY "study_mat_seller_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "study_mat_seller_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "study_mat_seller_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'study-materials' AND auth.uid()::text = (storage.foldername(name))[1]);
