
CREATE TABLE public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX otp_codes_phone_idx ON public.otp_codes (phone_number, created_at DESC);
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
-- No policies = no client access. Edge functions use service role.

CREATE TABLE public.registered_phones (
  phone_number TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  enrollment_id TEXT NOT NULL,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.registered_phones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "registered_phones_public_check" ON public.registered_phones
  FOR SELECT TO anon, authenticated USING (true);
-- Inserts only via service role (edge function).
