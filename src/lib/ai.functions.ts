import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const DAILY_LIMIT = 25;

const SummaryInput = z.object({
  text: z.string().min(20).max(40000),
  context: z.string().max(500).optional(),
});

const QuizInput = z.object({
  text: z.string().min(20).max(40000),
  numQuestions: z.number().int().min(3).max(15).default(5),
});

async function checkAndIncrementUsage(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const today = new Date().toISOString().slice(0, 10);
  const { data: row } = await supabaseAdmin
    .from("ai_usage")
    .select("requests_used")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .maybeSingle();
  const used = row?.requests_used ?? 0;
  if (used >= DAILY_LIMIT) throw new Error(`Daily AI limit reached (${DAILY_LIMIT}/day). Try again tomorrow.`);
  await supabaseAdmin.from("ai_usage").upsert(
    { user_id: userId, usage_date: today, requests_used: used + 1 },
    { onConflict: "user_id,usage_date" },
  );
}

async function callGemini(messages: Array<{ role: string; content: string }>) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: "google/gemini-2.5-flash", messages }),
  });
  if (res.status === 429) throw new Error("Rate limited. Please try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted. Please contact the admin.");
  if (!res.ok) throw new Error(`AI error: ${res.status}`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? "";
}

export const generateSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SummaryInput.parse(i))
  .handler(async ({ data, context }) => {
    await checkAndIncrementUsage(context.userId);
    const ctx = data.context ? `Subject context: ${data.context}\n\n` : "";
    const prompt = `${ctx}Create a concise study summary of the following notes. Use markdown with these sections:\n\n## Summary\n## Key Concepts\n## Formulas / Definitions\n## Revision Points (bullet list)\n\nNotes:\n"""\n${data.text}\n"""`;
    const out = await callGemini([
      { role: "system", content: "You are an expert study assistant. Produce clear, well-structured summaries for exam preparation." },
      { role: "user", content: prompt },
    ]);
    return { summary: out };
  });

export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => QuizInput.parse(i))
  .handler(async ({ data, context }) => {
    await checkAndIncrementUsage(context.userId);
    const prompt = `Generate exactly ${data.numQuestions} multiple-choice quiz questions from the following notes.\nReturn ONLY valid JSON in this exact shape, no prose, no markdown fences:\n{ "questions": [ { "q": "...", "options": ["A","B","C","D"], "answer_index": 0, "explanation": "..." } ] }\n\nNotes:\n"""\n${data.text}\n"""`;
    const out = await callGemini([
      { role: "system", content: "You are a quiz generator. Respond ONLY with valid JSON, no markdown, no prose." },
      { role: "user", content: prompt },
    ]);
    const cleaned = out.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
    let parsed: { questions: Array<{ q: string; options: string[]; answer_index: number; explanation?: string }> };
    try { parsed = JSON.parse(cleaned); } catch { throw new Error("AI returned invalid quiz format. Try again."); }
    return parsed;
  });

const AskInput = z.object({ question: z.string().min(3).max(2000), context: z.string().max(40000).optional() });
export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AskInput.parse(i))
  .handler(async ({ data, context }) => {
    await checkAndIncrementUsage(context.userId);
    const messages = [
      { role: "system", content: "You are Breaking Notes' AI study assistant. Be concise, accurate, and exam-focused. Use markdown." },
      ...(data.context ? [{ role: "user" as const, content: `Reference notes:\n"""\n${data.context}\n"""` }] : []),
      { role: "user" as const, content: data.question },
    ];
    const out = await callGemini(messages);
    return { answer: out };
  });

export const getAiUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabaseAdmin
      .from("ai_usage")
      .select("requests_used")
      .eq("user_id", context.userId)
      .eq("usage_date", today)
      .maybeSingle();
    return { used: data?.requests_used ?? 0, limit: DAILY_LIMIT };
  });
