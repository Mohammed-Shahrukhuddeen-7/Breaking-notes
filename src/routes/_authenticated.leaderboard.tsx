import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Flame, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({ meta: [
    { title: "Study Leaderboard — Breaking Notes" },
    { name: "description", content: "Compare study points and daily streaks with the Breaking Notes community." },
    { property: "og:title", content: "Study Leaderboard — Breaking Notes" },
    { property: "og:description", content: "Compare study points and daily streaks with the Breaking Notes community." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: LeaderboardPage,
});

type Sort = "points" | "streak";

function LeaderboardPage() {
  const { user } = Route.useRouteContext();
  const [sort, setSort] = useState<Sort>("points");

  const { data: rows, refetch } = useQuery({
    queryKey: ["leaderboard", sort],
    queryFn: async () => {
      const col = sort === "points" ? "total_points" : "current_streak";
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, total_points, current_streak, best_streak")
        .order(col, { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel("leaderboard")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg gradient-primary glow">
          <Trophy className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Leaderboard</h1>
        </div>
      </div>

      <Tabs value={sort} onValueChange={(v) => setSort(v as Sort)} className="mb-6">
        <TabsList>
          <TabsTrigger value="points"><Sparkles className="mr-1 h-3.5 w-3.5" /> By points</TabsTrigger>
          <TabsTrigger value="streak"><Flame className="mr-1 h-3.5 w-3.5" /> By streak</TabsTrigger>
        </TabsList>
      </Tabs>

      <ul className="space-y-2">
        {rows?.map((r, i) => {
          const me = r.id === user.id;
          return (
            <li key={r.id} className={cn(
              "flex items-center gap-4 rounded-xl border bg-card/60 px-4 py-3",
              me ? "border-primary glow" : "border-border",
            )}>
              <div className={cn(
                "grid h-9 w-9 place-items-center rounded-full text-sm font-bold",
                i === 0 ? "gradient-primary text-primary-foreground" :
                i === 1 ? "bg-accent text-accent-foreground" :
                i === 2 ? "bg-secondary text-secondary-foreground" :
                "bg-muted text-muted-foreground"
              )}>
                {i + 1}
              </div>
              <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-accent text-sm font-semibold">
                {(r.username ?? "?").slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-medium">{r.username}{me && <span className="ml-2 text-xs text-primary-glow">(you)</span>}</div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-primary-glow" /> {r.total_points}</span>
                  <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-warning" /> {r.current_streak}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold tabular-nums">
                  {sort === "points" ? r.total_points : r.current_streak}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {sort === "points" ? "points" : "day streak"}
                </div>
              </div>
            </li>
          );
        })}
        {rows && rows.length === 0 && (
          <li className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No one on the board yet.</li>
        )}
      </ul>
    </div>
  );
}
