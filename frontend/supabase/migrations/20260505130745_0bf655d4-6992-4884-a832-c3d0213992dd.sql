-- Marketplace listings
CREATE TABLE public.marketplace_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'other',
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listings_select_all" ON public.marketplace_listings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "listings_insert_self" ON public.marketplace_listings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "listings_update_self" ON public.marketplace_listings
  FOR UPDATE TO authenticated USING (auth.uid() = seller_id);
CREATE POLICY "listings_delete_self" ON public.marketplace_listings
  FOR DELETE TO authenticated USING (auth.uid() = seller_id);

CREATE TRIGGER set_listings_updated_at BEFORE UPDATE ON public.marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_listings_seller ON public.marketplace_listings(seller_id);
CREATE INDEX idx_listings_created ON public.marketplace_listings(created_at DESC);