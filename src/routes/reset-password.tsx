import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { EmailOtpType } from "@supabase/supabase-js";
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
  const [checkingSession, setCheckingSession] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Checking your reset link…");

  useEffect(() => {
    let mounted = true;
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setCanReset(true);
        setCheckingSession(false);
        setStatusMessage("Enter your new password below.");
      }
    });

    async function prepareRecoverySession() {
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
      const code = url.searchParams.get("code");
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const tokenHash =
        url.searchParams.get("token_hash") ?? hashParams.get("token_hash");
      const type = url.searchParams.get("type") ?? hashParams.get("type");
      const linkError = url.searchParams.get("error_description") ?? hashParams.get("error_description");

      if (linkError) toast.error(linkError);

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) toast.error(error.message);
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) toast.error(error.message);
      } else if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as EmailOtpType,
        });
        if (error) toast.error(error.message);
      }

      if (code || accessToken || tokenHash) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setCanReset(Boolean(data.session));
      setStatusMessage(
        data.session
          ? "Enter your new password below."
          : "Open the latest reset link from your email to continue.",
      );
      setCheckingSession(false);
    }

    prepareRecoverySession();
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const pw = String(fd.get("password") || "");
    if (pw.length < 6) return toast.error("Password must be at least 6 characters");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setCanReset(false);
      setStatusMessage(
        "This reset link was not activated. Please request a new link and open it in this same browser.",
      );
      return toast.error("Open the newest reset link from your email first.");
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated. Please sign in with your new password.");
    await supabase.auth.signOut();
    nav({ to: "/auth" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-border bg-card/80 p-6 backdrop-blur"
      >
        <h1 className="mb-2 text-xl font-semibold">Set a new password</h1>
        <p className="mb-6 text-sm text-muted-foreground">{statusMessage}</p>
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="pl-9"
              disabled={checkingSession || loading}
            />
          </div>
        </div>
        <Button
          disabled={loading || checkingSession}
          className="mt-6 w-full gradient-primary text-primary-foreground"
        >
          {(loading || checkingSession) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update password
        </Button>
      </form>
    </div>
  );
}
