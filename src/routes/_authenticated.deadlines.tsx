import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, Plus, Trash2, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { completeTask } from "@/lib/rewards.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/deadlines")({
  head: () => ({ meta: [
    { title: "Deadlines — Breaking Notes" },
    { name: "description", content: "Organize upcoming assignments and keep track of due dates." },
    { property: "og:title", content: "Deadlines — Breaking Notes" },
    { property: "og:description", content: "Organize upcoming assignments and keep track of due dates." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: DeadlinesPage,
});

const taskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional(),
  subject: z.string().max(100).optional(),
  due_date: z.coerce.date({ invalid_type_error: "Please enter a valid due date" }),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

const DIFF_POINTS = { easy: 10, medium: 20, hard: 50 } as const;

function DeadlinesPage() {
  const { user } = Route.useRouteContext();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const completeFn = useServerFn(completeTask);

  const { data: tasks } = useQuery({
    queryKey: ["tasks", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks").select("*").eq("user_id", user.id).order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // Normalize: some browsers submit date-only ("YYYY-MM-DD") from datetime-local
    const rawDate = String(fd.get("due_date") ?? "").trim();
    const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? `${rawDate}T00:00` : rawDate;
    const parsed = taskSchema.safeParse({
      title: fd.get("title"),
      description: fd.get("description") || undefined,
      subject: fd.get("subject") || undefined,
      due_date: normalizedDate,
      difficulty: fd.get("difficulty"),
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSaving(true);
    const { error } = await supabase.from("tasks").insert({
      ...parsed.data,
      due_date: parsed.data.due_date.toISOString(),
      user_id: user.id,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Task added");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["tasks", user.id] });
  }

  async function onDelete(id: string) {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["tasks", user.id] });
  }

  async function onComplete(id: string) {
    try {
      const res = await completeFn({ data: { taskId: id } });
      if ("alreadyComplete" in res) return;
      toast.success(`+${res.points} points!`);
      qc.invalidateQueries({ queryKey: ["tasks", user.id] });
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to complete");
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg gradient-primary glow">
            <CalendarClock className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Deadline Tracker</h1>
            <p className="text-sm text-muted-foreground">Earn points for finishing what's due.</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground"><Plus className="mr-1 h-4 w-4" /> New task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New task</DialogTitle></DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Title</Label><Input name="title" required maxLength={200} /></div>
              <div className="space-y-2"><Label>Subject (optional)</Label><Input name="subject" maxLength={100} /></div>
              <div className="space-y-2"><Label>Description (optional)</Label><Textarea name="description" maxLength={2000} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Due date</Label><Input name="due_date" type="datetime-local" required /></div>
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select name="difficulty" defaultValue="medium">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy · 10 pts</SelectItem>
                      <SelectItem value="medium">Medium · 20 pts</SelectItem>
                      <SelectItem value="hard">Hard · 50 pts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button disabled={saving} type="submit" className="w-full gradient-primary text-primary-foreground">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add task
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tasks && tasks.length > 0 ? (
        <ul className="space-y-3">
          {tasks.map((t) => {
            const overdue = t.status === "pending" && new Date(t.due_date) < new Date();
            return (
              <li key={t.id} className={cn(
                "flex items-start gap-3 rounded-xl border border-border bg-card/60 p-4",
                t.status === "completed" && "opacity-60",
                overdue && "border-destructive/60",
              )}>
                <button
                  onClick={() => onComplete(t.id)}
                  disabled={t.status === "completed"}
                  className={cn(
                    "mt-0.5 grid h-6 w-6 place-items-center rounded-full border-2 transition-colors",
                    t.status === "completed" ? "border-success bg-success text-success-foreground" : "border-border hover:border-primary",
                  )}
                >
                  {t.status === "completed" && <CheckCircle2 className="h-4 w-4" />}
                </button>
                <div className="flex-1">
                  <div className={cn("font-medium", t.status === "completed" && "line-through")}>{t.title}</div>
                  {t.description && <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {t.subject && <span className="rounded-full bg-accent/40 px-2 py-0.5">{t.subject}</span>}
                    <span className={cn(
                      "rounded-full px-2 py-0.5",
                      t.difficulty === "easy" && "bg-success/20 text-success",
                      t.difficulty === "medium" && "bg-warning/20 text-warning",
                      t.difficulty === "hard" && "bg-destructive/20 text-destructive",
                    )}>{t.difficulty} · {DIFF_POINTS[t.difficulty]} pts</span>
                    <span className={cn("flex items-center gap-1 text-muted-foreground", overdue && "text-destructive")}>
                      <CalendarClock className="h-3 w-3" /> {new Date(t.due_date).toLocaleString()}
                    </span>
                    {t.status === "completed" && (
                      <span className="flex items-center gap-1 text-primary-glow"><Sparkles className="h-3 w-3" /> +{t.points_awarded}</span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onDelete(t.id)}><Trash2 className="h-4 w-4" /></Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No tasks yet. Add your first deadline above.
        </div>
      )}
    </div>
  );
}
