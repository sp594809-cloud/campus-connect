-- Create student1 roster table for phone-number-based verification
CREATE TABLE public.student1 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  enrollment_id text NOT NULL UNIQUE,
  phone_number text NOT NULL UNIQUE,
  branch text,
  current_year integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student1 ENABLE ROW LEVEL SECURITY;

-- Public lookup so the registration form can verify by phone number
CREATE POLICY "student1_public_lookup"
ON public.student1
FOR SELECT
USING (true);

CREATE INDEX idx_student1_phone ON public.student1(phone_number);