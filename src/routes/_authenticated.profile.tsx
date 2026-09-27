import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Camera, Flame, Sparkles, Trophy, Timer as TimerIcon, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [
    { title: "Study Profile — Breaking Notes" },
    { name: "description", content: "Review your study points, focus sessions, completed tasks, and streaks." },
    { property: "og:title", content: "Study Profile — Breaking Notes" },
    { property: "og:description", content: "Review your study points, focus sessions, completed tasks, and streaks." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: profile, refetch } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["profile-stats", user.id],
    queryFn: async () => {
      const [sessions, tasks] = await Promise.all([
        supabase.from("pomodoro_sessions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "completed"),
      ]);
      return { sessions: sessions.count ?? 0, tasks: tasks.count ?? 0 };
    },
  });

  const { data: avatarUrl } = useQuery({
    queryKey: ["avatar", profile?.avatar_url],
    enabled: Boolean(profile?.avatar_url),
    queryFn: async () => {
      if (!profile?.avatar_url) return null;
      if (profile.avatar_url.startsWith("http")) return profile.avatar_url;
      const { data } = await supabase.storage.from("profile-photos").createSignedUrl(profile.avatar_url, 3600);
      return data?.signedUrl ?? null;
    },
  });

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${user.id}/avatar-${Date.now()}.${file.name.split(".").pop()}`;
    const { error: upErr } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: true });
    if (upErr) { setUploading(false); return toast.error(upErr.message); }
    const { error: pErr } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
    setUploading(false);
    if (pErr) return toast.error(pErr.message);
    toast.success("Photo updated");
    refetch();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-8 text-2xl font-bold">Profile</h1>

      <div className="rounded-3xl border border-border bg-card/60 p-8 backdrop-blur">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div className="relative">
            <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-full gradient-primary text-4xl font-bold text-primary-foreground glow">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                (profile?.username ?? "?").slice(0, 1).toUpperCase()
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full border-2 border-background bg-card hover:bg-accent"
              disabled={uploading}
              title="Change photo"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold">{profile?.username}</h2>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Sparkles} label="Total points" value={profile?.total_points ?? 0} color="text-primary-glow" />
          <Stat icon={Flame} label="Current streak" value={profile?.current_streak ?? 0} color="text-warning" />
          <Stat icon={Trophy} label="Best streak" value={profile?.best_streak ?? 0} color="text-warning" />
          <Stat icon={TimerIcon} label="Sessions" value={stats?.sessions ?? 0} color="text-primary-glow" />
        </div>
        <div className="mt-3 grid sm:grid-cols-1">
          <Stat icon={CheckCircle2} label="Tasks completed" value={stats?.tasks ?? 0} color="text-success" />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className={`h-3.5 w-3.5 ${color}`} /> {label}
      </div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </div>
  );
}
