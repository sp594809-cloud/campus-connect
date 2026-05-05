-- DSA Streak tracking
CREATE TABLE IF NOT EXISTS public.dsa_streaks (
  user_id uuid PRIMARY KEY,
  current_streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  last_completed_date date,
  total_completed int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dsa_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dsa_select_all" ON public.dsa_streaks FOR SELECT TO authenticated USING (true);
CREATE POLICY "dsa_insert_self" ON public.dsa_streaks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dsa_update_self" ON public.dsa_streaks FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Daily completions log (one per user per day)
CREATE TABLE IF NOT EXISTS public.dsa_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  completed_on date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  note text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, completed_on)
);

ALTER TABLE public.dsa_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dsac_select_all" ON public.dsa_completions FOR SELECT TO authenticated USING (true);
CREATE POLICY "dsac_insert_self" ON public.dsa_completions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Trigger: maintain streak on completion insert
CREATE OR REPLACE FUNCTION public.bump_dsa_streak()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_last date;
  v_cur int;
  v_long int;
BEGIN
  SELECT last_completed_date, current_streak, longest_streak
    INTO v_last, v_cur, v_long
    FROM public.dsa_streaks WHERE user_id = NEW.user_id;

  IF NOT FOUND THEN
    INSERT INTO public.dsa_streaks (user_id, current_streak, longest_streak, last_completed_date, total_completed)
    VALUES (NEW.user_id, 1, 1, NEW.completed_on, 1);
    RETURN NEW;
  END IF;

  IF v_last = NEW.completed_on THEN
    -- already counted
    RETURN NEW;
  ELSIF v_last = NEW.completed_on - INTERVAL '1 day' THEN
    v_cur := v_cur + 1;
  ELSE
    v_cur := 1;
  END IF;

  IF v_cur > v_long THEN v_long := v_cur; END IF;

  UPDATE public.dsa_streaks SET
    current_streak = v_cur,
    longest_streak = v_long,
    last_completed_date = NEW.completed_on,
    total_completed = total_completed + 1,
    updated_at = now()
  WHERE user_id = NEW.user_id;

  -- award karma
  INSERT INTO public.karma_events (user_id, action, points, ref_id, note)
  VALUES (NEW.user_id, 'aspire_engage', 5, NEW.id, 'DSA daily completed');

  RETURN NEW;
END $$;

CREATE TRIGGER trg_bump_dsa_streak
AFTER INSERT ON public.dsa_completions
FOR EACH ROW EXECUTE FUNCTION public.bump_dsa_streak();

-- Add 'aspire_engage' to karma_action enum if not already there
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'karma_action' AND e.enumlabel = 'aspire_engage') THEN
    ALTER TYPE public.karma_action ADD VALUE 'aspire_engage';
  END IF;
END $$;