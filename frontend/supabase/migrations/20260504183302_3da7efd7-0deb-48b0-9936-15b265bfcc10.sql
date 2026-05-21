-- One row per enrollment id (phone_number is already the primary key)
ALTER TABLE public.registered_phones
  ADD CONSTRAINT registered_phones_enrollment_unique UNIQUE (enrollment_id);

-- Allow authenticated users to insert their own registration (uniqueness enforced by PK + unique constraint)
CREATE POLICY "registered_phones_self_insert"
  ON public.registered_phones
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
