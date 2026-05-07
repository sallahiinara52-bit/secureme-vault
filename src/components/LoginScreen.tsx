import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n, LANGS, Lang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Lock, Mail, Eye, EyeOff, Globe } from "lucide-react";

export function LoginScreen() {
  const { t, lang, setLang } = useI18n();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Account created");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-3">
          <select
            aria-label="Language"
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="bg-card/60 border border-border/60 rounded-md px-2 py-1 text-xs"
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code} className="bg-card text-foreground">
                {l.flag} {l.label}
              </option>
            ))}
          </select>
        </div>

        <div className="glass-card rounded-3xl p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-16 w-16 rounded-2xl btn-grad flex items-center justify-center shadow-[var(--shadow-glow)] mb-4">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{t("appName")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("tagline")}</p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  required
                  minLength={6}
                  className="pl-9 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle password visibility"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full btn-grad h-11 text-base" disabled={busy}>
              {busy ? "…" : mode === "signup" ? t("create") : t("signIn")}
            </Button>

            <button
              type="button"
              className="text-xs text-muted-foreground w-full text-center hover:text-foreground pt-1"
              onClick={() => setMode((m) => (m === "signup" ? "signin" : "signup"))}
            >
              {mode === "signup" ? t("alreadyHave") : t("noAccount")}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border/40 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <Globe className="h-3 w-3" />
            <span>End-to-end AES-256 encryption</span>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground/70 mt-4">
          © {new Date().getFullYear()} DS Interactive
        </p>
      </div>
    </div>
  );
}
