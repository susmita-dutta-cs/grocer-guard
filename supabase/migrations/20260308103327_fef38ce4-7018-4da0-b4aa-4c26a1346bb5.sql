
-- Table to store weekly folder/flyer promotions scraped from store websites
CREATE TABLE public.weekly_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id text NOT NULL,
  product_name text NOT NULL,
  discount_type text, -- e.g. '1+1 gratis', '25% korting', '2e halve prijs'
  promo_price numeric,
  original_price numeric,
  valid_from date,
  valid_until date,
  category text,
  matched_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  source_url text,
  scraped_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.weekly_promotions ENABLE ROW LEVEL SECURITY;

-- Anyone can read promotions
CREATE POLICY "Anyone can read weekly promotions"
  ON public.weekly_promotions FOR SELECT
  USING (true);

-- Only admins/service role can insert/update/delete
CREATE POLICY "Service role can manage promotions"
  ON public.weekly_promotions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for quick lookups
CREATE INDEX idx_weekly_promotions_store ON public.weekly_promotions(store_id);
CREATE INDEX idx_weekly_promotions_valid ON public.weekly_promotions(valid_from, valid_until);
CREATE INDEX idx_weekly_promotions_matched ON public.weekly_promotions(matched_product_id);
