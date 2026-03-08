
ALTER TABLE public.profiles ADD COLUMN phone text UNIQUE;

CREATE INDEX idx_profiles_phone ON public.profiles(phone) WHERE phone IS NOT NULL;

CREATE OR REPLACE FUNCTION public.get_email_by_phone(_phone text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.email
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE p.phone = _phone
  LIMIT 1;
$$;
