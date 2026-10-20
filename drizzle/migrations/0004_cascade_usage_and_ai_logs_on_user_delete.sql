ALTER TABLE public.usage_monthly
ADD CONSTRAINT usage_monthly_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.ai_call_log
ADD CONSTRAINT ai_call_log_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;