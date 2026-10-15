import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — StageSync" },
      { name: "description", content: "Sign in to your StageSync production workspace." },
      { property: "og:title", content: "Sign in — StageSync" },
      { property: "og:description", content: "Sign in to your StageSync production workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
      else navigate({ to: "/" });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { name } },
      });
      if (error) setMsg(error.message);
      else if (data.session) navigate({ to: "/" });
      else setMsg("Check your email to confirm your account, then sign in.");
    }
    setBusy(false);
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-background">
      <form onSubmit={submit} className="flex w-[300px] flex-col gap-3 rounded-sm border border-border bg-panel p-5">
        <div className="flex items-center gap-2">
          <div className="grid h-5 w-5 place-items-center rounded-sm bg-primary font-mono text-[10px] font-semibold text-primary-foreground">S</div>
          <span className="text-[13px] font-semibold">StageSync</span>
        </div>
        <h1 className="text-xs text-muted-foreground">{mode === "in" ? "Sign in to your workspace" : "Create your account"}</h1>
        {mode === "up" && (
          <label className="flex flex-col gap-1"><span className="panel-label">Name</span>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} required /></label>
        )}
        <label className="flex flex-col gap-1"><span className="panel-label">Email</span>
          <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label className="flex flex-col gap-1"><span className="panel-label">Password</span>
          <input className="field" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
        <button className="btn btn-primary" disabled={busy}>{mode === "in" ? "Sign in" : "Sign up"}</button>
        <button type="button" className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }}>
          {mode === "in" ? "No account? Sign up" : "Have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
