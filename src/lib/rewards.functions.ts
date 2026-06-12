import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const PointsInput = z.object({
  durationMinutes: z.union([z.literal(25), z.literal(50)]),
});

/** Records a pomodoro session + awards points + updates streak via service role. */
export const completePomodoro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PointsInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const points = data.durationMinutes === 25 ? 10 : 20;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error: sessErr } = await supabaseAdmin.from("pomodoro_sessions").insert({
      user_id: userId,
      duration_minutes: data.durationMinutes,
      points_awarded: points,
    });
    if (sessErr) throw new Error(sessErr.message);

    const { data: prof, error: rpcErr } = await supabaseAdmin.rpc("award_points_and_streak", {
      _user_id: userId,
      _points: points,
    });
    if (rpcErr) throw new Error(rpcErr.message);

    return { points, profile: prof };
  });

const TaskCompleteInput = z.object({ taskId: z.string().uuid() });

/** Marks a task complete and awards points based on difficulty. */
export const completeTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TaskCompleteInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: task, error: tErr } = await supabaseAdmin
      .from("tasks")
      .select("id, user_id, difficulty, status")
      .eq("id", data.taskId)
      .maybeSingle();
    if (tErr) throw new Error(tErr.message);
    if (!task || task.user_id !== userId) throw new Error("Task not found");
    if (task.status === "completed") return { alreadyComplete: true };

    const points = task.difficulty === "easy" ? 10 : task.difficulty === "medium" ? 20 : 50;

    const { error: uErr } = await supabaseAdmin
      .from("tasks")
      .update({ status: "completed", completed_at: new Date().toISOString(), points_awarded: points })
      .eq("id", task.id);
    if (uErr) throw new Error(uErr.message);

    const { data: prof, error: rpcErr } = await supabaseAdmin.rpc("award_points_and_streak", {
      _user_id: userId,
      _points: points,
    });
    if (rpcErr) throw new Error(rpcErr.message);

    return { points, profile: prof };
  });
