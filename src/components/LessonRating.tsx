import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getLessonRating, rateLesson } from "@/lib/rating.functions";

type Props = {
  lessonId: string;
  grade: string;
  subject: string;
};

/** Quiet 1–5 star rating shown below a saved lesson. Ratings can be changed. */
export function LessonRating({ lessonId, grade, subject }: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [hover, setHover] = useState(0);
  const [saving, setSaving] = useState(false);
  const [thanked, setThanked] = useState(false);

  const getFn = useServerFn(getLessonRating);
  const rateFn = useServerFn(rateLesson);

  useEffect(() => {
    let live = true;
    getFn({ data: { lessonId } })
      .then((res) => {
        if (!live) return;
        setRating(res.rating);
        setLoaded(true);
      })
      .catch(() => live && setLoaded(true));
    return () => {
      live = false;
    };
  }, [lessonId, getFn]);

  async function pick(stars: number) {
    if (saving) return;
    setSaving(true);
    try {
      await rateFn({ data: { lessonId, rating: stars, grade, subject } });
      setRating(stars);
      setThanked(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your rating.");
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return null;

  const shown = hover || rating || 0;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <span className="text-sm font-medium text-muted-foreground">Rate this lesson</span>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rate this lesson from 1 to 5 stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            disabled={saving}
            onClick={() => pick(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="rounded p-0.5 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
          >
            <Star
              className={`h-5 w-5 ${n <= shown ? "fill-cheer text-cheer" : "text-border"}`}
              aria-hidden="true"
            />
          </button>
        ))}
        {saving && <Loader2 className="ml-1 h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />}
      </div>
      {thanked && (
        <span role="status" className="text-sm text-muted-foreground">
          Thanks for the feedback!
        </span>
      )}
    </div>
  );
}
