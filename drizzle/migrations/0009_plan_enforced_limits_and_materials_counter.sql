-- Limits mirror src/config/app-config.ts; change both together.
DROP FUNCTION IF EXISTS public.increment_monthly_usage(integer);
DROP FUNCTION IF EXISTS public.increment_lesson_regeneration(uuid, integer);
DROP FUNCTION IF EXISTS public.get_my_usage();

ALTER TABLE public.usage_monthly ADD COLUMN materials_count integer NOT NULL DEFAULT 0;

CREATE FUNCTION public.current_plan_tier(p_user uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT CASE WHEN (SELECT plan FROM public.profiles WHERE user_id = p_user) = 'pro' THEN 'pro' ELSE 'free' END;
$$;
REVOKE EXECUTE ON FUNCTION public.current_plan_tier(uuid) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.increment_monthly_usage() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_period text := to_char(now() AT TIME ZONE 'utc', 'YYYY-MM');
  v_limit integer; v_count integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  v_limit := CASE public.current_plan_tier(v_uid) WHEN 'pro' THEN 60 ELSE 5 END;
  INSERT INTO public.usage_monthly AS u (user_id, period, lesson_count)
  VALUES (v_uid, v_period, 1)
  ON CONFLICT (user_id, period) DO UPDATE
    SET lesson_count = u.lesson_count + 1, updated_at = now()
    WHERE u.lesson_count < v_limit
  RETURNING lesson_count INTO v_count;
  RETURN v_count;
END; $$;

CREATE FUNCTION public.increment_lesson_regeneration(p_lesson_id uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_uid uuid := auth.uid(); v_limit integer; v_count integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  v_limit := CASE public.current_plan_tier(v_uid) WHEN 'pro' THEN 15 ELSE 5 END;
  UPDATE public.lesson_plans SET regeneration_count = regeneration_count + 1
    WHERE id = p_lesson_id AND user_id = v_uid AND regeneration_count < v_limit
    RETURNING regeneration_count INTO v_count;
  RETURN v_count;
END; $$;

CREATE FUNCTION public.increment_monthly_materials() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_period text := to_char(now() AT TIME ZONE 'utc', 'YYYY-MM');
  v_limit integer; v_count integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  v_limit := CASE public.current_plan_tier(v_uid) WHEN 'pro' THEN 30 ELSE 1 END;
  INSERT INTO public.usage_monthly AS u (user_id, period, lesson_count, materials_count)
  VALUES (v_uid, v_period, 0, 1)
  ON CONFLICT (user_id, period) DO UPDATE
    SET materials_count = u.materials_count + 1, updated_at = now()
    WHERE u.materials_count < v_limit
  RETURNING materials_count INTO v_count;
  RETURN v_count;
END; $$;

CREATE FUNCTION public.get_my_usage()
RETURNS TABLE(plan text, lessons_used integer, materials_used integer, materials_limit integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT t.tier,
    COALESCE(u.lesson_count, 0),
    COALESCE(u.materials_count, 0),
    CASE t.tier WHEN 'pro' THEN 30 ELSE 1 END
  FROM (SELECT public.current_plan_tier(auth.uid()) AS tier) t
  LEFT JOIN public.usage_monthly u
    ON u.user_id = auth.uid() AND u.period = to_char(now() AT TIME ZONE 'utc', 'YYYY-MM');
$$;

CREATE FUNCTION public.refund_monthly_materials(p_user_id uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  UPDATE public.usage_monthly SET materials_count = GREATEST(materials_count - 1, 0), updated_at = now()
  WHERE user_id = p_user_id AND period = to_char(now() AT TIME ZONE 'utc', 'YYYY-MM');
$$;

CREATE FUNCTION public.refund_material_regeneration(p_item_id uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  UPDATE public.lesson_materials_items SET regeneration_count = GREATEST(regeneration_count - 1, 0)
  WHERE id = p_item_id;
$$;

CREATE FUNCTION public.refund_lesson_regeneration(p_lesson_id uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  UPDATE public.lesson_plans SET regeneration_count = GREATEST(regeneration_count - 1, 0)
  WHERE id = p_lesson_id;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_monthly_usage() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_lesson_regeneration(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_monthly_materials() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_usage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_monthly_usage() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_lesson_regeneration(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_monthly_materials() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_usage() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.refund_monthly_materials(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refund_material_regeneration(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refund_lesson_regeneration(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_monthly_materials(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_material_regeneration(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_lesson_regeneration(uuid) TO service_role;