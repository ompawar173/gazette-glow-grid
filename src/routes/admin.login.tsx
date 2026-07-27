import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  ssr: false,
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin/dashboard" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else navigate({ to: "/admin/dashboard" });
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/admin/dashboard` },
      });
      if (error) toast.error(error.message);
      else {
        toast.success("Account created. You can sign in.");
        setMode("signin");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy p-4">
      <div className="w-full max-w-md bg-background border border-border p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="text-2xl font-black text-navy" style={{ fontFamily: "Georgia, serif" }}>CIO TIMES</div>
          <div className="tag-chip">Admin Console</div>
        </div>
        <h1 className="text-xl font-bold mb-4">{mode === "signin" ? "Sign in" : "Create admin account"}</h1>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email" required placeholder="Email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-border text-sm"
          />
          <input
            type="password" required minLength={6} placeholder="Password (min 6 chars)"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-border text-sm"
          />
          <button type="submit" disabled={loading} className="w-full bg-navy text-navy-foreground py-2 font-bold uppercase text-sm tracking-wider disabled:opacity-50">
            {loading ? "..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <div className="mt-4 text-sm text-center text-muted-foreground">
          {mode === "signin" ? (
            <>No account yet? <button onClick={() => setMode("signup")} className="text-brand font-semibold">Create one</button></>
          ) : (
            <>Have an account? <button onClick={() => setMode("signin")} className="text-brand font-semibold">Sign in</button></>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">The first account created becomes the admin automatically.</p>
      </div>
    </div>
  );
}
