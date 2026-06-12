import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notes")({
  head: () => ({ meta: [{ title: "Notes Vault — Breaking Notes" }] }),
  component: NotesPage,
});

function NotesPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg gradient-primary glow">
          <BookOpen className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Notes Vault</h1>
          <p className="text-sm text-muted-foreground">Shared semester / subject notes with AI assistant.</p>
        </div>
      </div>
      <ComingSoon
        title="Notes Vault is coming in the next build"
        body="Database, storage buckets, RLS, and admin role are already provisioned. The UI for browsing semesters & subjects, uploading PDFs/images, viewing, downloading, AI summary and AI quiz will land in the next turn."
      />
    </div>
  );
}

export function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
      <Sparkles className="mx-auto mb-3 h-6 w-6 text-primary-glow" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
