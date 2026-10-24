CREATE TABLE public.ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  feature text NOT NULL,
  model text NOT NULL,
  prompt_tokens integer,
  completion_tokens integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ai_usage_log TO service_role;
REVOKE ALL ON public.ai_usage_log FROM anon, authenticated;
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX ai_usage_log_user_time_idx ON public.ai_usage_log (user_id, created_at);
COMMENT ON COLUMN public.ai_usage_log.prompt_tokens IS 'NULL when an attempted AI call does not return usage; never infer zero consumption.';
COMMENT ON COLUMN public.ai_usage_log.completion_tokens IS 'NULL when an attempted AI call does not return usage; never infer zero consumption.';

CREATE TABLE public.lesson_materials_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lesson_plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('exit_ticket', 'quiz')),
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  answer_key text,
  regeneration_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, item_type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_materials_items TO authenticated;
GRANT ALL ON public.lesson_materials_items TO service_role;
ALTER TABLE public.lesson_materials_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Materials: owner full access" ON public.lesson_materials_items
  FOR ALL TO authenticated
  USING (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.lesson_plans l WHERE l.id = lesson_id AND l.user_id = auth.uid()
  ))
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.lesson_plans l WHERE l.id = lesson_id AND l.user_id = auth.uid()
  ));
CREATE INDEX lesson_materials_items_user_idx ON public.lesson_materials_items (user_id);

CREATE FUNCTION public.protect_material_regen_count()
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
CREATE TRIGGER materials_protect_regen BEFORE INSERT OR UPDATE ON public.lesson_materials_items
  FOR EACH ROW EXECUTE FUNCTION public.protect_material_regen_count();
CREATE TRIGGER materials_updated_at BEFORE UPDATE ON public.lesson_materials_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE FUNCTION public.increment_material_regeneration(p_item_id uuid, p_limit integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer;
BEGIN
  IF p_limit IS NULL OR p_limit < 1 THEN RAISE EXCEPTION 'A positive regeneration limit is required'; END IF;
  UPDATE public.lesson_materials_items
    SET regeneration_count = regeneration_count + 1
    WHERE id = p_item_id AND regeneration_count < p_limit
    RETURNING regeneration_count INTO v_count;
  RETURN v_count;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.increment_material_regeneration(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_material_regeneration(uuid, integer) TO service_role;
COMMENT ON FUNCTION public.increment_material_regeneration(uuid, integer) IS 'Server-only: authenticated handler verifies item and lesson ownership, reads protected plan, and supplies the configured cap. Clients cannot override the cap.';