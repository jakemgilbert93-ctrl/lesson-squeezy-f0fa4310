CREATE TABLE public.lesson_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lesson_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  grade TEXT,
  subject TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.lesson_ratings TO authenticated;
GRANT ALL ON public.lesson_ratings TO service_role;
ALTER TABLE public.lesson_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ratings: owner read" ON public.lesson_ratings FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Ratings: owner insert" ON public.lesson_ratings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Ratings: owner update" ON public.lesson_ratings FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER lesson_ratings_updated_at BEFORE UPDATE ON public.lesson_ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at();