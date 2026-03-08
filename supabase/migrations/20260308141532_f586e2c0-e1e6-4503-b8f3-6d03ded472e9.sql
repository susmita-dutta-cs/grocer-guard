
CREATE TABLE public.store_scrape_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id text NOT NULL UNIQUE,
  folder_url text NOT NULL,
  scrape_method text NOT NULL DEFAULT 'scrape',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.store_scrape_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read scrape configs"
  ON public.store_scrape_configs FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert scrape configs"
  ON public.store_scrape_configs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update scrape configs"
  ON public.store_scrape_configs FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete scrape configs"
  ON public.store_scrape_configs FOR DELETE
  USING (has_role(auth.uid(), 'admin'));
