-- Teacher's Pet: plan tier, usage counters, regeneration counters, DB-backed rate limiting.

-- 1. Plan tier on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'pro'));

-- 2. Regeneration counter on lesson_plans
ALTER TABLE public.lesson_plans ADD COLUMN IF NOT EXISTS regeneration_count integer NOT NULL DEFAULT 0;

-- 3. Column guards: signed-in users (role authenticated/anon) cannot set these columns.
--    Trusted SECURITY DEFINER functions run as the owner role and are allowed.
CREATE OR REPLACE FUNCTION public.protect_profile_plan()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.plan := 'free';
    ELSIF NEW.plan IS DISTINCT FROM OLD.plan THEN
      RAISE EXCEPTION 'The plan field can only be changed by the server' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_plan ON public.profiles;
CREATE TRIGGER profiles_protect_plan
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_plan();

CREATE OR REPLACE FUNCTION public.protect_lesson_regen_count()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.regeneration_count := 0;
    ELSIF NEW.regeneration_count IS DISTINCT FROM OLD.regeneration_count THEN
      RAISE EXCEPTION 'The regeneration counter can only be changed by the server' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lesson_plans_protect_regen ON public.lesson_plans;
CREATE TRIGGER lesson_plans_protect_regen
  BEFORE INSERT OR UPDATE ON public.lesson_plans
  FOR EACH ROW EXECUTE FUNCTION public.protect_lesson_regen_count();

-- 4. Monthly usage (one row per user per UTC month, e.g. '2026-10')
CREATE TABLE IF NOT EXISTS public.usage_monthly (
  user_id uuid NOT NULL,
  period text NOT NULL,
  lesson_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, period)
);
ALTER TABLE public.usage_monthly ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.usage_monthly FROM anon, authenticated;
GRANT SELECT ON public.usage_monthly TO authenticated;
DROP POLICY IF EXISTS "Usage: owner read" ON public.usage_monthly;
CREATE POLICY "Usage: owner read" ON public.usage_monthly
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 5. AI call log for rate limiting (no direct client access at all)
CREATE TABLE IF NOT EXISTS public.ai_call_log (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_call_log_user_time_idx ON public.ai_call_log (user_id, created_at);
ALTER TABLE public.ai_call_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_call_log FROM anon, authenticated;

-- 6. Functions
CREATE OR REPLACE FUNCTION public.get_my_usage()
RETURNS TABLE (plan text, lessons_used integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    COALESCE((SELECT p.plan FROM public.profiles p WHERE p.user_id = auth.uid()), 'free'),
    COALESCE((SELECT u.lesson_count FROM public.usage_monthly u
              WHERE u.user_id = auth.uid()
                AND u.period = to_char(now() AT TIME ZONE 'utc', 'YYYY-MM')), 0);
$$;

CREATE OR REPLACE FUNCTION public.reserve_ai_call(p_max integer, p_window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_recent integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  -- serialize per user so parallel calls can't both slip through
  PERFORM pg_advisory_xact_lock(hashtext(v_uid::text));
  DELETE FROM public.ai_call_log WHERE user_id = v_uid AND created_at < now() - interval '1 hour';
  SELECT count(*) INTO v_recent FROM public.ai_call_log
    WHERE user_id = v_uid AND created_at > now() - make_interval(secs => p_window_seconds);
  IF v_recent >= p_max THEN RETURN false; END IF;
  INSERT INTO public.ai_call_log (user_id) VALUES (v_uid);
  RETURN true;
END;
$$;

-- Returns the new count, or NULL when the cap was already reached. p_limit NULL = unlimited.
CREATE OR REPLACE FUNCTION public.increment_monthly_usage(p_limit integer)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_period text := to_char(now() AT TIME ZONE 'utc', 'YYYY-MM');
  v_count integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.usage_monthly AS u (user_id, period, lesson_count)
  VALUES (v_uid, v_period, 1)
  ON CONFLICT (user_id, period) DO UPDATE
    SET lesson_count = u.lesson_count + 1, updated_at = now()
    WHERE p_limit IS NULL OR u.lesson_count < p_limit
  RETURNING lesson_count INTO v_count;
  RETURN v_count;
END;
$$;

-- Returns the new count, or NULL when the cap was reached / lesson not owned.
CREATE OR REPLACE FUNCTION public.increment_lesson_regeneration(p_lesson_id uuid, p_limit integer)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.lesson_plans
    SET regeneration_count = regeneration_count + 1
    WHERE id = p_lesson_id AND user_id = auth.uid() AND regeneration_count < p_limit
    RETURNING regeneration_count INTO v_count;
  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_usage() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reserve_ai_call(integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_monthly_usage(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_lesson_regeneration(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_call(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_monthly_usage(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_lesson_regeneration(uuid, integer) TO authenticated;
