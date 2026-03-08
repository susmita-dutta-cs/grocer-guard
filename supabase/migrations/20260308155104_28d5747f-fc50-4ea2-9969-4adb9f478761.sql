CREATE TABLE public.user_promotion_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  promotion_id uuid NOT NULL REFERENCES public.weekly_promotions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, promotion_id)
);

ALTER TABLE public.user_promotion_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own promotion favorites"
  ON public.user_promotion_favorites FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own promotion favorites"
  ON public.user_promotion_favorites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own promotion favorites"
  ON public.user_promotion_favorites FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());