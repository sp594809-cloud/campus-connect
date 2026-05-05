
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category public.company_category NOT NULL,
  emoji text NOT NULL DEFAULT '🏢',
  aliases text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_companies_name ON public.companies(name);
CREATE INDEX idx_companies_cat ON public.companies(category);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY companies_select_auth ON public.companies FOR SELECT TO authenticated USING (true);

ALTER TABLE public.profiles
  ADD COLUMN mentor_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN weekly_capacity int NOT NULL DEFAULT 3,
  ADD COLUMN mentor_bio text DEFAULT '',
  ADD COLUMN mentor_topics text[] NOT NULL DEFAULT '{}';

CREATE INDEX idx_profiles_mentor_mode ON public.profiles(mentor_mode) WHERE mentor_mode = true;

INSERT INTO public.companies (name, category, emoji) VALUES
  ('Google','product','🔵'),('Microsoft','product','🟦'),('Amazon','product','📦'),
  ('Meta','product','🟦'),('Atlassian','product','🟦'),('Adobe','product','🅰️'),
  ('Flipkart','product','🛒'),('Swiggy','product','🍔'),('Zomato','product','🍽️'),
  ('Myntra','product','👗'),('Uber','product','🚗'),('Ola','product','🚕'),
  ('TCS','service','🔷'),('Infosys','service','🟦'),('Wipro','service','🟢'),
  ('Cognizant','service','🔵'),('Accenture','service','🟪'),('Capgemini','service','🟦'),
  ('HCL','service','🟦'),('Tech Mahindra','service','🔴'),('LTIMindtree','service','🟦'),
  ('Razorpay','fintech','💸'),('CRED','fintech','💳'),('Zerodha','fintech','📈'),
  ('Groww','fintech','🌱'),('PhonePe','fintech','📱'),('Paytm','fintech','💰'),
  ('Goldman Sachs','gcc','🏦'),('Morgan Stanley','gcc','🏛️'),('JP Morgan','gcc','💼'),
  ('Deloitte','gcc','🟢'),('PwC','gcc','🟧'),('EY','gcc','🟨'),
  ('Walmart Global Tech','gcc','🌐'),('Target','gcc','🎯'),('SAP Labs','gcc','🟦'),
  ('Postman','startup','📮'),('Hasura','startup','⚡'),('Razorpay','startup','💸'),
  ('Zoho','product','🟥'),('Freshworks','product','🟢')
ON CONFLICT (name) DO NOTHING;
