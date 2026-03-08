
-- Drop overly permissive write policies
DROP POLICY "Service role can insert stores" ON public.stores;
DROP POLICY "Service role can update stores" ON public.stores;
DROP POLICY "Service role can insert products" ON public.products;
DROP POLICY "Service role can update products" ON public.products;
DROP POLICY "Service role can insert prices" ON public.product_prices;
DROP POLICY "Service role can update prices" ON public.product_prices;
DROP POLICY "Service role can insert scrape logs" ON public.scrape_logs;
DROP POLICY "Service role can update scrape logs" ON public.scrape_logs;

-- No write policies needed - edge functions use service_role key which bypasses RLS
