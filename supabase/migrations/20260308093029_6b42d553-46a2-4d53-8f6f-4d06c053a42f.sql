
-- Create tables for storing scraped grocery prices

CREATE TABLE public.stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.product_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  on_sale BOOLEAN DEFAULT false,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source_url TEXT,
  UNIQUE(product_id, store_id)
);

CREATE TABLE public.scrape_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id TEXT REFERENCES public.stores(id),
  status TEXT NOT NULL DEFAULT 'pending',
  products_found INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_logs ENABLE ROW LEVEL SECURITY;

-- Public read access (prices are public data)
CREATE POLICY "Anyone can read stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Anyone can read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Anyone can read prices" ON public.product_prices FOR SELECT USING (true);
CREATE POLICY "Anyone can read scrape logs" ON public.scrape_logs FOR SELECT USING (true);

-- Only service role can write (edge functions use service role)
CREATE POLICY "Service role can insert stores" ON public.stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update stores" ON public.stores FOR UPDATE USING (true);
CREATE POLICY "Service role can insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Service role can insert prices" ON public.product_prices FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update prices" ON public.product_prices FOR UPDATE USING (true);
CREATE POLICY "Service role can insert scrape logs" ON public.scrape_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update scrape logs" ON public.scrape_logs FOR UPDATE USING (true);

-- Indexes
CREATE INDEX idx_product_prices_product ON public.product_prices(product_id);
CREATE INDEX idx_product_prices_store ON public.product_prices(store_id);
CREATE INDEX idx_products_category ON public.products(category);

-- Seed stores
INSERT INTO public.stores (id, name, website_url) VALUES
  ('walmart', 'Walmart', 'https://www.walmart.com/browse/food/'),
  ('kroger', 'Kroger', 'https://www.kroger.com/'),
  ('target', 'Target', 'https://www.target.com/c/grocery/'),
  ('aldi', 'Aldi', 'https://www.aldi.us/products/');
