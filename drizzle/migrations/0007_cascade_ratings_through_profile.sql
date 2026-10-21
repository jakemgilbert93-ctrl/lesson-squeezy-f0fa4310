ALTER TABLE public.lesson_ratings
ADD CONSTRAINT lesson_ratings_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;