import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Brain, Timer, BookOpen, Trophy, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/timer" });
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg gradient-primary glow">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Breaking Notes</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
          <Link to="/auth"><Button className="gradient-primary text-primary-foreground hover:opacity-90">Get started</Button></Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-16 pb-24 text-center md:pt-24">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <Flame className="h-3.5 w-3.5 text-warning" />
          Built for students who actually want to focus
        </div>
        <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl">
          Study smarter with <span className="text-gradient">Breaking Notes</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Pomodoro timer, shared notes vault, deadline tracker, leaderboard, daily streaks, and an AI study assistant — in one dark, focused workspace.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/auth">
            <Button size="lg" className="gradient-primary text-primary-foreground hover:opacity-90 glow">
              Start studying free
            </Button>
          </Link>
        </div>

        <div className="mt-24 grid gap-4 md:grid-cols-4">
          {[
            { icon: Timer, title: "Pomodoro Timer", desc: "25 & 50 min sessions, points & streaks." },
            { icon: BookOpen, title: "Notes Vault", desc: "Shared PDFs by semester & subject." },
            { icon: Brain, title: "AI Assistant", desc: "Summaries & quizzes from your notes." },
            { icon: Trophy, title: "Leaderboard", desc: "Compete live with your peers." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card/60 p-5 text-left backdrop-blur">
              <f.icon className="h-5 w-5 text-primary-glow" />
              <h3 className="mt-3 text-base font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
