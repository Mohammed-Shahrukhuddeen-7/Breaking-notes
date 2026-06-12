import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Timer as TimerIcon,
  BookOpen,
  CalendarClock,
  Trophy,
  User as UserIcon,
  LogOut,
  Flame,
  Sparkles,
  Brain,
  Menu,
  X,
  Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { TimerProvider, useTimer } from "@/hooks/use-timer";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppShell,
});

function AppShell() {
  const { user } = Route.useRouteContext();
  return (
    <TimerProvider userId={user.id}>
      <Shell />
    </TimerProvider>
  );
}

function Shell() {
  const { user } = Route.useRouteContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => setMobileOpen(false), [pathname]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url, total_points, current_streak, best_streak")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    refetchOnWindowFocus: false,
  });

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      return data === true;
    },
  });

  const nav_items = [
    { to: "/timer", label: "Timer", icon: TimerIcon },
    { to: "/notes", label: "Notes Vault", icon: BookOpen },
    { to: "/deadlines", label: "Deadlines", icon: CalendarClock },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { to: "/profile", label: "Profile", icon: UserIcon },
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield } as const] : []),
  ] as const;

  async function signOut() {
    await supabase.auth.signOut();
    nav({ to: "/auth" });
  }

  return (
    <div className="flex min-h-screen">
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-sidebar-border bg-sidebar/95 px-4 py-3 backdrop-blur md:hidden">
        <Link to="/timer" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md gradient-primary">
            <Brain className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">Breaking Notes</span>
        </Link>
        <div className="flex items-center gap-2">
          <MiniTimer />
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link to="/timer" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg gradient-primary glow">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-none">Breaking Notes</div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Study OS</div>
            </div>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {nav_items.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "gradient-primary text-primary-foreground glow"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <Flame className="h-3 w-3 text-warning" /> Streak
              </div>
              <div className="mt-1 text-xl font-bold">{profile?.current_streak ?? 0}</div>
            </div>
            <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary-glow" /> Points
              </div>
              <div className="mt-1 text-xl font-bold">{profile?.total_points ?? 0}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/30 px-2 py-2">
            <div className="grid h-8 w-8 place-items-center rounded-full gradient-primary text-xs font-semibold text-primary-foreground">
              {(profile?.username ?? user.email ?? "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="truncate text-sm font-medium">{profile?.username ?? "Student"}</div>
              <div className="truncate text-xs text-muted-foreground">{user.email}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <main className="flex-1 md:ml-64">
        <div className="px-4 pb-10 pt-20 md:px-8 md:pt-8">
          <Outlet />
        </div>
      </main>

      {/* Floating timer indicator (when running and not on timer page) */}
      <FloatingTimer hidden={pathname.startsWith("/timer")} />
    </div>
  );
}

function MiniTimer() {
  const { running, remaining } = useTimer();
  if (!running) return null;
  const m = Math.floor(remaining / 60).toString().padStart(2, "0");
  const s = (remaining % 60).toString().padStart(2, "0");
  return (
    <Link to="/timer" className="flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1 text-xs font-semibold text-primary-glow">
      <TimerIcon className="h-3 w-3" />{m}:{s}
    </Link>
  );
}

function FloatingTimer({ hidden }: { hidden: boolean }) {
  const { running, remaining, pause, start } = useTimer();
  if (hidden || (!running && remaining === 25 * 60)) return null;
  const m = Math.floor(remaining / 60).toString().padStart(2, "0");
  const s = (remaining % 60).toString().padStart(2, "0");
  return (
    <Link
      to="/timer"
      className="fixed bottom-4 right-4 z-30 hidden items-center gap-3 rounded-full border border-border bg-card/90 px-4 py-2.5 shadow-lg backdrop-blur md:flex"
    >
      <div className={cn("grid h-7 w-7 place-items-center rounded-full", running ? "gradient-primary" : "bg-muted")}>
        <TimerIcon className="h-3.5 w-3.5 text-primary-foreground" />
      </div>
      <span className="font-display text-lg font-semibold tabular-nums">{m}:{s}</span>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); running ? pause() : start(); }}
        className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary-glow"
      >
        {running ? "Pause" : "Resume"}
      </button>
    </Link>
  );
}
