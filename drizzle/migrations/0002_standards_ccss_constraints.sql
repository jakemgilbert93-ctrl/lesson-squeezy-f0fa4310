ALTER TABLE public.standards ALTER COLUMN ccss_id SET NOT NULL;
ALTER TABLE public.standards ALTER COLUMN standard_text SET NOT NULL;
ALTER TABLE public.standards ADD CONSTRAINT standards_ccss_id_key UNIQUE (ccss_id);
ALTER TABLE public.standards ADD CONSTRAINT standards_subject_chk CHECK (subject IN ('Math','ELA'));
ALTER TABLE public.standards ADD CONSTRAINT standards_grade_chk CHECK (grade IN ('K','1','2','3','4','5'));