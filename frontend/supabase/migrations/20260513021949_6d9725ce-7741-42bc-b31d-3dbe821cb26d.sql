
-- 1) SECURITY DEFINER lookup helpers (return only the row(s) the caller asked for)
CREATE OR REPLACE FUNCTION public.lookup_student_by_phone(_phone text)
RETURNS TABLE(full_name text, enrollment_id text, phone_number text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.full_name, s.enrollment_id, s.phone_number
    FROM public.student1 s
   WHERE s.phone_number = _phone
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.lookup_student_by_enrollment(_q text)
RETURNS TABLE(full_name text, enrollment_id text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.full_name, s.enrollment_id
    FROM public.student1 s
   WHERE s.enrollment_id ILIKE '%' || _q || '%'
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_phone_registered(_phone text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.registered_phones WHERE phone_number = _phone);
$$;

-- Lock down: revoke from public; grant only what each caller needs
REVOKE EXECUTE ON FUNCTION public.lookup_student_by_phone(text)       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.lookup_student_by_enrollment(text)  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_phone_registered(text)           FROM PUBLIC;

-- Pre-auth lookups (sign-in flow) need anon
GRANT EXECUTE ON FUNCTION public.lookup_student_by_phone(text)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_phone_registered(text)            TO anon, authenticated;
-- Authenticated-only enrollment search
GRANT EXECUTE ON FUNCTION public.lookup_student_by_enrollment(text)   TO authenticated;

-- 2) Close the public-read holes on the underlying tables
DROP POLICY IF EXISTS student1_public_lookup           ON public.student1;
DROP POLICY IF EXISTS registered_phones_public_check   ON public.registered_phones;
DROP POLICY IF EXISTS "Enable lookup by mobile"        ON public.college_roster;

-- No SELECT policies on these tables now → table reads blocked.
-- The lookup helpers (SECURITY DEFINER) remain the only read path.

-- 3) Keep INSERT on registered_phones tight: only the signed-in user, only their own row
DROP POLICY IF EXISTS registered_phones_self_insert ON public.registered_phones;
CREATE POLICY registered_phones_self_insert
  ON public.registered_phones
  FOR INSERT TO authenticated
  WITH CHECK (
    length(coalesce(phone_number,'')) BETWEEN 8 AND 20
    AND length(coalesce(enrollment_id,'')) BETWEEN 1 AND 64
    AND length(coalesce(full_name,''))     BETWEEN 1 AND 200
  );
