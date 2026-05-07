import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n, LANGS, Lang } from "@/lib/i18n";
import { initializeVault, unlockVault, logIntruder } from "@/lib/vault-db";
import { useApp } from "./AppProvider";
import { toast } from "sonner";
import { Shield, Lock, Eye, EyeOff } from "lucide-react";

export function LockScreen() {
  const { t, lang, setLang } = useI18n();
  const { hasVault, setHasVault, setUnlockKey } = useApp();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    setPassword("");
    setConfirm("");
  }, [hasVault]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (password.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    setBusy(true);
    try {
      if (!hasVault) {
        if (password !== confirm) {
          toast.error("Passwords do not match");
          return;
        }
        await initializeVault(password);
        const key = await unlockVault(password);
        if (key) {
          setHasVault(true);
          setUnlockKey(key);
          toast.success("Vault created");
        }
      } else {
        const key = await unlockVault(password);
        if (key) {
          setUnlockKey(key);
          setAttempts(0);
        } else {
          await logIntruder();
          setAttempts((a) => a + 1);
          toast.error(t("wrongCode"));
        }
      }
    } finally {
      setBusy(false);
      setPassword("");
      setConfirm("");
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
              <Label htmlFor="password">{hasVault ? t("password") : t("realCode")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  required
                  className="pl-9 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  autoComplete={hasVault ? "current-password" : "new-password"}
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

            {!hasVault && (
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm</Label>
                <Input
                  id="confirm"
                  type={show ? "text" : "password"}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
            )}

            <Button type="submit" className="w-full btn-grad h-11 text-base" disabled={busy}>
              {busy ? "…" : hasVault ? t("signIn") : t("create")}
            </Button>
          </form>

          {hasVault && attempts >= 1 && (
            <p className="text-[11px] text-destructive text-center mt-3">
              {attempts} failed attempt{attempts > 1 ? "s" : ""} logged
            </p>
          )}

          <div className="mt-6 pt-5 border-t border-border/40 text-center">
            <p className="text-[11px] text-muted-foreground">
              🔒 100% offline · AES-256 encryption · No email required
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground/70 mt-4">
          © {new Date().getFullYear()} DS Interactive
        </p>
      </div>
    </div>
  );
}
