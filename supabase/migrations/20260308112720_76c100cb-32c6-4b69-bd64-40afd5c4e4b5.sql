ALTER TABLE public.weekly_promotions ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE public.weekly_promotions ADD COLUMN IF NOT EXISTS quantity text;