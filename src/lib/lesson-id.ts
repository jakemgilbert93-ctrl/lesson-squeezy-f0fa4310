import { z } from "zod";

export const LessonIdInput = z.object({ id: z.string().uuid() });