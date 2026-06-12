import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Play, Pause, RotateCcw, Sparkles, Timer as TimerIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTimer } from "@/hooks/use-timer";

export const Route = createFileRoute("/_authenticated/timer")({
  head: () => ({ meta: [{ title: "Timer — Breaking Notes" }] }),
  component: TimerPage,
});

const PRESETS = [25, 50] as const;

function TimerPage() {
  const { user } = Route.useRouteContext();
  const { duration, remaining, running, setDuration, start, pause, reset } = useTimer();

  const { data: sessions } = useQuery({
    queryKey: ["sessions", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pomodoro_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const minutes = Math.floor(remaining / 60).toString().padStart(2, "0");
  const seconds = (remaining % 60).toString().padStart(2, "0");
  const progress = 1 - remaining / (duration * 60);
  const circumference = 2 * Math.PI * 130;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg gradient-primary glow">
          <TimerIcon className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Pomodoro Timer</h1>
          <p className="text-sm text-muted-foreground">Keeps running even when you navigate away.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card/60 p-8 backdrop-blur">
        <div className="mb-6 flex justify-center gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p}
              variant={duration === p ? "default" : "outline"}
              onClick={() => setDuration(p)}
              disabled={running}
              className={cn(duration === p && "gradient-primary text-primary-foreground")}
            >
              {p} min · {p === 25 ? "10" : "20"} pts
            </Button>
          ))}
        </div>

        <div className="relative mx-auto mb-8 grid h-72 w-72 place-items-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 300 300">
            <circle cx="150" cy="150" r="130" stroke="oklch(0.28 0.03 280)" strokeWidth="10" fill="none" />
            <circle
              cx="150"
              cy="150"
              r="130"
              stroke="url(#g)"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="oklch(0.66 0.20 285)" />
                <stop offset="1" stopColor="oklch(0.78 0.18 300)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="text-center">
            <div className="font-display text-6xl font-bold tabular-nums">{minutes}:{seconds}</div>
            <div className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
              {running ? "Focusing" : remaining === duration * 60 ? "Ready" : "Paused"}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          {!running ? (
            <Button size="lg" onClick={start} className="gradient-primary text-primary-foreground hover:opacity-90 glow">
              <Play className="mr-2 h-4 w-4" /> {remaining === duration * 60 ? "Start" : "Resume"}
            </Button>
          ) : (
            <Button size="lg" variant="outline" onClick={pause}>
              <Pause className="mr-2 h-4 w-4" /> Pause
            </Button>
          )}
          <Button size="lg" variant="ghost" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent sessions</h2>
        {sessions && sessions.length > 0 ? (
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg border border-border bg-card/40 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-md bg-accent/40">
                    <TimerIcon className="h-4 w-4 text-primary-glow" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{s.duration_minutes}-minute session</div>
                    <div className="text-xs text-muted-foreground">{new Date(s.completed_at).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-primary-glow">
                  <Sparkles className="h-3.5 w-3.5" /> +{s.points_awarded}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No sessions yet. Start your first focus block above.
          </div>
        )}
      </div>
    </div>
  );
}
