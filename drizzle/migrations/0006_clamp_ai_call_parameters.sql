CREATE OR REPLACE FUNCTION public.reserve_ai_call(p_max integer, p_window_seconds integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_recent integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  p_max := LEAST(p_max, 10);
  p_window_seconds := GREATEST(p_window_seconds, 60);
  PERFORM pg_advisory_xact_lock(hashtext(v_uid::text));
  DELETE FROM public.ai_call_log WHERE user_id = v_uid AND created_at < now() - interval '1 hour';
  SELECT count(*) INTO v_recent FROM public.ai_call_log
    WHERE user_id = v_uid AND created_at > now() - make_interval(secs => p_window_seconds);
  IF v_recent >= p_max THEN RETURN false; END IF;
  INSERT INTO public.ai_call_log (user_id) VALUES (v_uid);
  RETURN true;
END;
$function$;