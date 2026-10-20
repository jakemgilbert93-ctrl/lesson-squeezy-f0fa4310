import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { ArrowRight, FileText, Plus } from "lucide-react";
import { APP_CONFIG, gradeLabel } from "@/config/app-config";
import { getUsage, listLessonPlans } from "@/lib/lesson-plan.functions";
import { lessonsLine, priceLabel, regensLine } from "@/lib/plan-copy";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMyProfile } from "@/hooks/use-my-profile";
import { welcomeGreeting } from "@/lib/display-name";

export function HomeWorkspace({ userId }: { userId: string }) {
  const profile = useMyProfile(userId);
  const fetchLessons = useServerFn(listLessonPlans);
  const fetchUsage = useServerFn(getUsage);
  const lessons = useQuery({ queryKey: ["home-lessons", userId], queryFn: () => fetchLessons() });
  const usage = useQuery({ queryKey: ["home-usage", userId], queryFn: () => fetchUsage() });
  const current = usage.data;
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <h1 className="min-w-0 break-words text-3xl font-bold text-foreground sm:text-4xl [overflow-wrap:anywhere]">{welcomeGreeting(profile.data?.displayName)}</h1>
        <Button asChild size="lg"><Link to="/app"><Plus />Create a new lesson</Link></Button>
      </div>
      <section className="mt-12">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-foreground">My Lessons</h2>
          <Button asChild variant="link"><Link to="/plans">View all<ArrowRight /></Link></Button>
        </div>
        {lessons.isPending ? <p className="mt-6 text-muted-foreground" role="status">Loading lessons…</p>
          : lessons.isError ? <div className="mt-6"><p role="alert">Could not load your lessons.</p><Button variant="outline" className="mt-3" onClick={() => void lessons.refetch()}>Try again</Button></div>
          : lessons.data.length === 0 ? <div className="py-10 text-center"><FileText className="mx-auto h-10 w-10 text-primary" /><p className="mt-4 text-muted-foreground">No saved lessons yet.</p><Button asChild className="mt-5"><Link to="/app"><Plus />Create your first lesson</Link></Button></div>
          : <div className="mt-5 grid gap-6 md:grid-cols-3">{lessons.data.slice(0, APP_CONFIG.homepage.recentLessons).map((lesson) => (
            <Link key={lesson.id} to="/plans/$id" params={{ id: lesson.id }} className="min-w-0 rounded-xl border border-border bg-card p-6 shadow-sm transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <h3 className="whitespace-normal text-lg font-bold text-foreground [overflow-wrap:anywhere]">{lesson.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{gradeLabel(lesson.grade ?? "")} · {lesson.subject}</p>
              <p className="mt-2 text-xs text-muted-foreground">{new Date(lesson.updated_at).toLocaleDateString(undefined, { dateStyle: "medium" })}</p>
            </Link>
          ))}</div>}
      </section>
      <section className="mt-12 border-t border-border py-8">
        <h2 className="text-2xl font-bold text-foreground">Your Plan</h2>
        {usage.isPending ? <p className="mt-4 text-muted-foreground" role="status">Loading plan…</p>
          : usage.isError ? <div className="mt-4"><p role="alert">Could not load your plan.</p><Button variant="outline" className="mt-3" onClick={() => void usage.refetch()}>Try again</Button></div>
          : current && <div className="mt-4 flex flex-wrap items-center justify-between gap-6">
            <div className="w-full max-w-md">
              <p className="font-semibold text-foreground">{APP_CONFIG.plans[current.plan].name}</p>
              <p className="mt-2 text-sm text-muted-foreground">{current.monthlyLimit === null ? `${current.lessonsUsed} lessons used this month · No monthly lesson limit` : `${current.lessonsUsed} of ${current.monthlyLimit} lessons used this month`}</p>
              {current.monthlyLimit !== null && <progress aria-label="Monthly lesson usage" className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted accent-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary" max={Math.max(1, current.monthlyLimit)} value={current.lessonsUsed} />}
            </div>
            {current.plan === "free" && <Dialog><DialogTrigger asChild><Button variant="outline">Upgrade</Button></DialogTrigger>
              <DialogContent className="max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto">
                <DialogHeader><DialogTitle>Free and Pro</DialogTitle><DialogDescription>{APP_CONFIG.beta ? "Lesson Squeezy is in beta. Nothing can be purchased yet." : "Your lesson planning options."}</DialogDescription></DialogHeader>
                <div className="grid gap-6 sm:grid-cols-2">{(["free", "pro"] as const).map((tier) => <div key={tier} className="min-w-0">
                  <h3 className="text-lg font-bold">{APP_CONFIG.plans[tier].name}</h3><p className="mt-2 text-2xl font-bold">{priceLabel(tier)}</p>
                  {tier === "pro" && APP_CONFIG.beta && <p className="mt-1 text-sm text-muted-foreground">Planned price during beta.</p>}
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm"><li>{lessonsLine(tier)}</li><li>{regensLine(tier)}</li><li>.docx download, saved lessons on your account, and copy to clipboard</li></ul>
                  {tier === "pro" && APP_CONFIG.beta && <><Button disabled className="mt-6 w-full">Coming after beta</Button><a className="mt-3 block text-sm font-semibold text-primary hover:underline" href={`mailto:${APP_CONFIG.feedbackEmail}?subject=${encodeURIComponent("Email me when Pro opens")}`}>Email me when Pro opens</a></>}
                </div>)}</div>
              </DialogContent>
            </Dialog>}
          </div>}
      </section>
    </main>
  );
}