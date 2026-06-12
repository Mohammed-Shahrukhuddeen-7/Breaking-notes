import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef } from "react";
import { BookOpen, ChevronRight, Upload, Sparkles, Download, FileText, FileImage, Brain, X, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { generateSummary, generateQuiz, askAssistant, getAiUsage } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/notes")({
  head: () => ({ meta: [{ title: "Notes Vault — Breaking Notes" }] }),
  component: NotesPage,
});

function NotesPage() {
  const { user } = Route.useRouteContext();
  const qc2 = useQueryClient(); void qc2;
  const qc = useQueryClient();
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      return data === true;
    },
  });

  const { data: semesters } = useQuery({
    queryKey: ["semesters"],
    queryFn: async () => {
      const { data, error } = await supabase.from("semesters").select("*").eq("archived", false).order("position");
      if (error) throw error;
      return data;
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects", selectedSemester],
    queryFn: async () => {
      if (!selectedSemester) return [];
      const { data, error } = await supabase.from("subjects").select("*").eq("semester_id", selectedSemester).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedSemester,
  });

  const { data: notes } = useQuery({
    queryKey: ["notes", selectedSubject],
    queryFn: async () => {
      if (!selectedSubject) return [];
      const { data, error } = await supabase.from("notes").select("*").eq("subject_id", selectedSubject).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedSubject,
  });

  async function addSemester() {
    const name = prompt("Semester name (e.g. Semester 1)");
    if (!name) return;
    const pos = (semesters?.length ?? 0) + 1;
    const { error } = await supabase.from("semesters").insert({ name, position: pos });
    if (error) return toast.error(error.message);
    toast.success("Semester added");
    qc.invalidateQueries({ queryKey: ["semesters"] });
  }

  async function addSubject() {
    if (!selectedSemester) return;
    const name = prompt("Subject name");
    if (!name) return;
    const { error } = await supabase.from("subjects").insert({ name, semester_id: selectedSemester });
    if (error) return toast.error(error.message);
    toast.success("Subject added");
    qc.invalidateQueries({ queryKey: ["subjects", selectedSemester] });
  }

  async function deleteNote(id: string, path: string) {
    if (!confirm("Delete this note?")) return;
    await supabase.storage.from("notes").remove([path]);
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["notes", selectedSubject] });
  }

  async function openFile(path: string) {
    const { data, error } = await supabase.storage.from("notes").createSignedUrl(path, 3600);
    if (error || !data) return toast.error(error?.message ?? "Failed to open");
    window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg gradient-primary glow">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Notes Vault</h1>
            <p className="text-sm text-muted-foreground">Browse semester & subject notes — powered by AI.</p>
          </div>
        </div>
        <Button onClick={() => setAiOpen(true)} className="gradient-primary text-primary-foreground glow">
          <Brain className="mr-2 h-4 w-4" /> AI Assistant
        </Button>
      </div>

      {/* Breadcrumbs */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => { setSelectedSemester(null); setSelectedSubject(null); }} className="hover:text-foreground">Semesters</button>
        {selectedSemester && (
          <>
            <ChevronRight className="h-3 w-3" />
            <button onClick={() => setSelectedSubject(null)} className="hover:text-foreground">
              {semesters?.find((s) => s.id === selectedSemester)?.name}
            </button>
          </>
        )}
        {selectedSubject && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{subjects?.find((s) => s.id === selectedSubject)?.name}</span>
          </>
        )}
      </div>

      {/* Semesters view */}
      {!selectedSemester && (
        <div>
          <div className="mb-4 flex justify-end">
            {isAdmin && (
              <Button variant="outline" onClick={addSemester}><Plus className="mr-2 h-4 w-4" /> Add semester</Button>
            )}
          </div>
          {semesters && semesters.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {semesters.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSemester(s.id)}
                  className="group rounded-2xl border border-border bg-card/60 p-5 text-left transition hover:border-primary/40 hover:bg-card"
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
                    <BookOpen className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Tap to view subjects</div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState text={isAdmin ? "No semesters yet. Add one above." : "No semesters yet. An admin needs to create them."} />
          )}
        </div>
      )}

      {/* Subjects view */}
      {selectedSemester && !selectedSubject && (
        <div>
          <div className="mb-4 flex justify-end">
            {isAdmin && <Button variant="outline" onClick={addSubject}><Plus className="mr-2 h-4 w-4" /> Add subject</Button>}
          </div>
          {subjects && subjects.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubject(s.id)}
                  className="group rounded-2xl border border-border bg-card/60 p-5 text-left transition hover:border-primary/40 hover:bg-card"
                >
                  <div className="font-semibold">{s.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">View notes</div>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState text={isAdmin ? "No subjects yet. Add one above." : "No subjects yet."} />
          )}
        </div>
      )}

      {/* Notes view */}
      {selectedSubject && (
        <div>
          <div className="mb-4 flex justify-end">
            {isAdmin && (
              <Button onClick={() => setUploadOpen(true)} className="gradient-primary text-primary-foreground">
                <Upload className="mr-2 h-4 w-4" /> Upload note
              </Button>
            )}
          </div>
          {notes && notes.length > 0 ? (
            <ul className="space-y-2">
              {notes.map((n) => (
                <li key={n.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/60 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent/40">
                      {n.mime_type?.startsWith("image/") ? <FileImage className="h-5 w-5 text-primary-glow" /> : <FileText className="h-5 w-5 text-primary-glow" />}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{n.file_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {n.tag} · {((n.file_size ?? 0) / 1024).toFixed(0)} KB · {new Date(n.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => openFile(n.storage_path)}>
                      <Download className="mr-2 h-3.5 w-3.5" /> Open
                    </Button>
                    {isAdmin && (
                      <Button size="sm" variant="ghost" onClick={() => deleteNote(n.id, n.storage_path)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState text={isAdmin ? "No notes uploaded yet. Upload one above." : "No notes yet."} />
          )}
        </div>
      )}

      {uploadOpen && selectedSubject && selectedSemester && (
        <UploadDialog
          semesterId={selectedSemester}
          subjectId={selectedSubject}
          userId={user.id}
          onClose={() => setUploadOpen(false)}
          onUploaded={() => qc.invalidateQueries({ queryKey: ["notes", selectedSubject] })}
        />
      )}

      {aiOpen && <AiAssistantDialog onClose={() => setAiOpen(false)} />}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
      <Sparkles className="mx-auto mb-2 h-5 w-5 text-primary-glow" /> {text}
    </div>
  );
}

function UploadDialog({ semesterId, subjectId, userId, onClose, onUploaded }: { semesterId: string; subjectId: string; userId: string; onClose: () => void; onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [tag, setTag] = useState<"notes" | "pyq" | "important" | "formula_sheet" | "lab_manual">("notes");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit() {
    if (!file) return toast.error("Pick a file first");
    if (file.size > 25 * 1024 * 1024) return toast.error("Max 25 MB");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${semesterId}/${subjectId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("notes").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("notes").insert({
        semester_id: semesterId,
        subject_id: subjectId,
        file_name: file.name,
        storage_path: path,
        mime_type: file.type,
        file_size: file.size,
        tag,
        uploaded_by: userId,
      });
      if (dbErr) throw dbErr;
      toast.success("Uploaded");
      onUploaded();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card">
        <DialogHeader><DialogTitle>Upload note</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">File (PDF / image, max 25 MB)</label>
            <Input ref={inputRef} type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Tag</label>
            <div className="flex flex-wrap gap-2">
              {(["notes", "pyq", "important", "formula_sheet", "lab_manual"] as const).map((t) => (
                <button key={t} onClick={() => setTag(t)} className={`rounded-full border px-3 py-1 text-xs ${tag === t ? "border-primary bg-primary/20 text-primary-glow" : "border-border text-muted-foreground"}`}>{t.replace("_", " ")}</button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={uploading} className="gradient-primary text-primary-foreground">
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type QuizQ = { q: string; options: string[]; answer_index: number; explanation?: string };

function AiAssistantDialog({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"summary" | "quiz" | "ask">("summary");
  const [text, setText] = useState("");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizQ[] | null>(null);
  const summaryFn = useServerFn(generateSummary);
  const quizFn = useServerFn(generateQuiz);
  const askFn = useServerFn(askAssistant);
  const usageFn = useServerFn(getAiUsage);
  const { data: usage } = useQuery({ queryKey: ["ai-usage"], queryFn: () => usageFn({}) });

  async function run() {
    setLoading(true); setSummary(null); setAnswer(null); setQuiz(null);
    try {
      if (tab === "summary") {
        const r = await summaryFn({ data: { text } });
        setSummary(r.summary);
      } else if (tab === "quiz") {
        const r = await quizFn({ data: { text, numQuestions: 5 } });
        setQuiz(r.questions);
      } else {
        const r = await askFn({ data: { question, context: text || undefined } });
        setAnswer(r.answer);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-card sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary-glow" /> AI Study Assistant</DialogTitle>
        </DialogHeader>
        <div className="mb-3 flex gap-2">
          {(["summary", "quiz", "ask"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-full px-3 py-1 text-xs capitalize ${tab === t ? "gradient-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}>{t === "ask" ? "Ask" : t}</button>
          ))}
        </div>
        {usage && <div className="mb-2 text-xs text-muted-foreground">Daily AI usage: {usage.used} / {usage.limit}</div>}
        <div className="space-y-3">
          {tab === "ask" && (
            <Input placeholder="Ask anything (e.g. Explain Newton's third law)" value={question} onChange={(e) => setQuestion(e.target.value)} />
          )}
          <Textarea
            rows={6}
            placeholder={tab === "ask" ? "(Optional) Paste reference notes for context" : "Paste your notes / textbook text here…"}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button onClick={run} disabled={loading || (tab === "ask" ? !question : text.length < 20)} className="w-full gradient-primary text-primary-foreground">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Thinking…</> : <><Sparkles className="mr-2 h-4 w-4" /> {tab === "summary" ? "Summarize" : tab === "quiz" ? "Generate quiz" : "Ask"}</>}
          </Button>
          {summary && <div className="prose prose-invert max-w-none whitespace-pre-wrap rounded-lg border border-border bg-background/40 p-4 text-sm">{summary}</div>}
          {answer && <div className="prose prose-invert max-w-none whitespace-pre-wrap rounded-lg border border-border bg-background/40 p-4 text-sm">{answer}</div>}
          {quiz && <Quiz questions={quiz} />}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}><X className="mr-2 h-4 w-4" /> Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Quiz({ questions }: { questions: QuizQ[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const score = Object.entries(answers).filter(([i, v]) => questions[Number(i)].answer_index === v).length;
  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={i} className="rounded-lg border border-border bg-background/40 p-4">
          <div className="mb-2 text-sm font-medium">{i + 1}. {q.q}</div>
          <div className="space-y-1.5">
            {q.options.map((opt, j) => {
              const picked = answers[i] === j;
              const correct = submitted && q.answer_index === j;
              const wrong = submitted && picked && q.answer_index !== j;
              return (
                <button
                  key={j}
                  onClick={() => !submitted && setAnswers((a) => ({ ...a, [i]: j }))}
                  className={`block w-full rounded-md border px-3 py-1.5 text-left text-sm transition ${
                    correct ? "border-success bg-success/10" :
                    wrong ? "border-destructive bg-destructive/10" :
                    picked ? "border-primary bg-primary/10" : "border-border"
                  }`}
                >{opt}</button>
              );
            })}
          </div>
          {submitted && q.explanation && <div className="mt-2 text-xs text-muted-foreground">💡 {q.explanation}</div>}
        </div>
      ))}
      {!submitted ? (
        <Button onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length !== questions.length} className="w-full gradient-primary text-primary-foreground">Submit</Button>
      ) : (
        <div className="rounded-lg border border-primary/40 bg-primary/10 p-3 text-center text-sm font-semibold">Score: {score} / {questions.length}</div>
      )}
    </div>
  );
}
