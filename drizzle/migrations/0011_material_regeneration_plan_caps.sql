CREATE OR REPLACE FUNCTION public.increment_material_regeneration(p_item_id uuid, p_limit integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_count integer; v_plan_limit integer;
BEGIN
  IF p_limit IS NULL OR p_limit < 1 THEN RAISE EXCEPTION 'A positive regeneration limit is required'; END IF;
  -- Both these plan caps and app-config limits.regensPerMaterial must match.
  SELECT CASE public.current_plan_tier(i.user_id) WHEN 'pro' THEN 5 ELSE 2 END
    INTO v_plan_limit FROM public.lesson_materials_items i WHERE i.id = p_item_id;
  IF v_plan_limit IS NULL THEN RETURN NULL; END IF;
  UPDATE public.lesson_materials_items
    SET regeneration_count = regeneration_count + 1
    WHERE id = p_item_id AND regeneration_count < LEAST(p_limit, v_plan_limit)
    RETURNING regeneration_count INTO v_count;
  RETURN v_count;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.increment_material_regeneration(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_material_regeneration(uuid, integer) TO service_role;
COMMENT ON FUNCTION public.increment_material_regeneration(uuid, integer) IS 'Server-only: authenticated handler verifies item and lesson ownership, reads protected plan, and supplies the configured cap. The database independently enforces the owner plan cap. Both places must match app-config limits.regensPerMaterial. Clients cannot override the cap.';