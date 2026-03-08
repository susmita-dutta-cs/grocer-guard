
-- Add unique constraint on product name for upsert support
ALTER TABLE public.products ADD CONSTRAINT products_name_key UNIQUE (name);
