import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Breaking Notes" }] }),
  beforeLoad: async ({ context }) => {
    const { user } = context as { user: { id: string } };
    const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (data !== true) throw redirect({ to: "/timer" });
  },
  component: AdminPage,
});

function AdminPage() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [u, n, s, sj] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("notes").select("*", { count: "exact", head: true }),
        supabase.from("semesters").select("*", { count: "exact", head: true }),
        supabase.from("subjects").select("*", { count: "exact", head: true }),
      ]);
      return { users: u.count ?? 0, notes: n.count ?? 0, semesters: s.count ?? 0, subjects: sj.count ?? 0 };
    },
  });

  const { data: semesters, refetch: refetchSems } = useQuery({
    queryKey: ["admin-semesters"],
    queryFn: async () => {
      const { data } = await supabase.from("semesters").select("*").order("position");
      return data ?? [];
    },
  });

  async function deleteSemester(id: string) {
    if (!confirm("Delete this semester and all its subjects/notes references?")) return;
    const { error } = await supabase.from("semesters").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refetchSems();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg gradient-primary glow">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage semesters, subjects, and notes.</p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats && [
          { label: "Users", value: stats.users },
          { label: "Semesters", value: stats.semesters },
          { label: "Subjects", value: stats.subjects },
          { label: "Notes", value: stats.notes },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card/60 p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-3xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Semesters</h2>
        <ul className="space-y-2">
          {semesters?.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-lg border border-border bg-background/40 p-3">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground">Position {s.position}{s.archived ? " · archived" : ""}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => deleteSemester(s.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
          {!semesters?.length && <div className="text-sm text-muted-foreground">No semesters. Create them from the Notes Vault.</div>}
        </ul>
      </div>
    </div>
  );
}
