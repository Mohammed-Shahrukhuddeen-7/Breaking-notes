import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Brain, Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Breaking Notes" }] }),
  component: AuthPage,
});

const signUpSchema = z.object({
  username: z.string().trim().min(2, "Username must be at least 2 characters").max(40),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

function AuthPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/timer" });
    });
  }, [nav]);

  async function handleSignUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signUpSchema.safeParse({
      username: fd.get("username"),
      email: fd.get("email"),
      password: fd.get("password"),
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/timer`,
        data: { username: parsed.data.username },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — welcome!");
    nav({ to: "/timer" });
  }

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = signInSchema.safeParse({
      email: fd.get("email"),
      password: fd.get("password"),
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) return toast.error(error.message);
    nav({ to: "/timer" });
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/timer",
    });
    if (result.error) {
      setLoading(false);
      toast.error(result.error.message || "Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    nav({ to: "/timer" });
  }

  async function handleForgot(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    if (!email) return toast.error("Enter your email");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Check your email for the reset link.");
    setForgot(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg gradient-primary glow">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">Breaking Notes</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur shadow-2xl">
          {forgot ? (
            <form onSubmit={handleForgot} className="space-y-4">
              <h2 className="text-xl font-semibold">Reset password</h2>
              <p className="text-sm text-muted-foreground">We'll email you a reset link.</p>
              <div className="space-y-2">
                <Label htmlFor="fe">Email</Label>
                <Input id="fe" name="email" type="email" required />
              </div>
              <Button disabled={loading} className="w-full gradient-primary text-primary-foreground">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send reset link
              </Button>
              <button type="button" onClick={() => setForgot(false)} className="block w-full text-center text-sm text-muted-foreground hover:text-foreground">
                Back to sign in
              </button>
            </form>
          ) : (
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="mt-4 space-y-4">
                  <Field icon={Mail} label="Email" name="email" type="email" required />
                  <Field icon={Lock} label="Password" name="password" type="password" required />
                  <button type="button" onClick={() => setForgot(true)} className="block text-right text-xs text-muted-foreground hover:text-foreground">
                    Forgot password?
                  </button>
                  <Button disabled={loading} className="w-full gradient-primary text-primary-foreground hover:opacity-90">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign in
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="mt-4 space-y-4">
                  <Field icon={UserIcon} label="Username" name="username" required />
                  <Field icon={Mail} label="Email" name="email" type="email" required />
                  <Field icon={Lock} label="Password" name="password" type="password" required />
                  <Button disabled={loading} className="w-full gradient-primary text-primary-foreground hover:opacity-90">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}

          {!forgot && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                or continue with
                <div className="h-px flex-1 bg-border" />
              </div>
              <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading}>
                <GoogleIcon /> <span className="ml-2">Continue with Google</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, name, type = "text", required }: { icon: React.ComponentType<{ className?: string }>; label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input id={name} name={name} type={type} required={required} className="pl-9" autoComplete={type === "password" ? "current-password" : undefined} />
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#EA4335" d="M12 10.2v3.8h5.3c-.2 1.3-1.6 3.9-5.3 3.9-3.2 0-5.8-2.6-5.8-5.9s2.6-5.9 5.8-5.9c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.5 3.5 14.5 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}
