-- Pro monthly materials limit mirrors src/config/app-config.ts; change both together.

ALTER TABLE public.lesson_materials_items
  DROP CONSTRAINT IF EXISTS lesson_materials_items_item_type_check;
ALTER TABLE public.lesson_materials_items
  ADD CONSTRAINT lesson_materials_items_item_type_check
  CHECK (item_type IN ('exit_ticket', 'quiz', 'worksheet', 'vocab_cards', 'game'));

ALTER TABLE public.ai_usage_log ADD COLUMN item_type text;
COMMENT ON COLUMN public.ai_usage_log.item_type IS 'Material item type for material_generate/material_regen rows; NULL for lesson calls.';

CREATE OR REPLACE FUNCTION public.increment_monthly_materials() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_period text := to_char(now() AT TIME ZONE 'utc', 'YYYY-MM');
  v_limit integer; v_count integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  v_limit := CASE public.current_plan_tier(v_uid) WHEN 'pro' THEN 60 ELSE 1 END;
  INSERT INTO public.usage_monthly AS u (user_id, period, lesson_count, materials_count)
  VALUES (v_uid, v_period, 0, 1)
  ON CONFLICT (user_id, period) DO UPDATE
    SET materials_count = u.materials_count + 1, updated_at = now()
    WHERE u.materials_count < v_limit
  RETURNING materials_count INTO v_count;
  RETURN v_count;
END; $$;

CREATE OR REPLACE FUNCTION public.get_my_usage()
RETURNS TABLE(plan text, lessons_used integer, materials_used integer, materials_limit integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT t.tier,
    COALESCE(u.lesson_count, 0),
    COALESCE(u.materials_count, 0),
    CASE t.tier WHEN 'pro' THEN 60 ELSE 1 END
  FROM (SELECT public.current_plan_tier(auth.uid()) AS tier) t
  LEFT JOIN public.usage_monthly u
    ON u.user_id = auth.uid() AND u.period = to_char(now() AT TIME ZONE 'utc', 'YYYY-MM');
$$;