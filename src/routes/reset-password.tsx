import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Breaking Notes" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const pw = String(fd.get("password") || "");
    if (pw.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    nav({ to: "/timer" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl border border-border bg-card/80 p-6 backdrop-blur">
        <h1 className="mb-2 text-xl font-semibold">Set a new password</h1>
        <p className="mb-6 text-sm text-muted-foreground">Enter your new password below.</p>
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="password" name="password" type="password" required className="pl-9" />
          </div>
        </div>
        <Button disabled={loading} className="mt-6 w-full gradient-primary text-primary-foreground">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update password
        </Button>
      </form>
    </div>
  );
}
