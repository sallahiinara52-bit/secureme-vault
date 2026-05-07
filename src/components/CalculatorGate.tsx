import { useEffect, useState } from "react";
import { useApp } from "./AppProvider";
import { useI18n, LANGS, Lang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings, Delete } from "lucide-react";
import { AuthDialog } from "./AuthDialog";
import { SetupDialog } from "./SetupDialog";

const KEYS = [
  ["C", "±", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ".", "⌫", "="],
];

export function CalculatorGate() {
  const { session, realCode, decoyCode, setMode, setPassphrase } = useApp();
  const { t, lang, setLang } = useI18n();
  const [display, setDisplay] = useState("0");
  const [authOpen, setAuthOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);

  // If no codes set yet — open setup
  useEffect(() => {
    if (!session) return;
    if (!realCode) setSetupOpen(true);
  }, [session, realCode]);

  function tap(v: string) {
    if (v === "C") return setDisplay("0");
    if (v === "⌫") return setDisplay((d) => (d.length <= 1 ? "0" : d.slice(0, -1)));
    if (v === "=") return tryUnlock();
    setDisplay((d) => {
      // simple append; cap length
      if (d === "0" && /[0-9.]/.test(v)) return v;
      if (d.length >= 18) return d;
      return d + v;
    });
  }

  async function tryUnlock() {
    if (!session) {
      setAuthOpen(true);
      return;
    }
    if (!realCode) {
      setSetupOpen(true);
      return;
    }
    const code = display.replace(/[^0-9.]/g, "");
    if (code === realCode) {
      setPendingCode(code);
      setMode("real");
      setPassphrase(`${session.user.id}:${code}`);
      setDisplay("0");
      return;
    }
    if (decoyCode && code === decoyCode) {
      setPendingCode(code);
      setMode("decoy");
      setPassphrase(`${session.user.id}:decoy:${code}`);
      setDisplay("0");
      return;
    }
    // wrong
    if (code && code !== "0") {
      try {
        await supabase.from("intruder_logs").insert({ user_id: session.user.id });
      } catch {}
      toast.error(t("wrongCode"), { description: t("attempts") });
    }
    // perform a fake calculation so it looks legit
    try {
      const expr = display.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
      // eslint-disable-next-line no-new-func
      const r = Function(`"use strict"; return (${expr})`)();
      if (typeof r === "number" && isFinite(r)) setDisplay(String(r));
    } catch {
      /* keep display */
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
          <span className="font-medium">Calculator</span>
          <select
            aria-label="Language"
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="bg-transparent border border-border/60 rounded-md px-2 py-1 text-xs"
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code} className="bg-card text-foreground">
                {l.flag} {l.label}
              </option>
            ))}
          </select>
        </div>

        <div className="glass-card rounded-3xl p-5">
          <div
            className="h-28 rounded-2xl bg-background/40 mb-4 flex items-end justify-end px-5 py-3 text-5xl font-light tracking-tight overflow-hidden"
            aria-live="polite"
          >
            <span className="truncate">{display}</span>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {KEYS.flat().map((k, i) => {
              const isOp = ["÷", "×", "−", "+", "="].includes(k);
              const isFn = ["C", "±", "%", "⌫"].includes(k);
              const isEq = k === "=";
              return (
                <button
                  key={i}
                  onClick={() => tap(k)}
                  className={[
                    "h-14 rounded-xl text-xl font-medium transition active:scale-95",
                    isEq ? "btn-grad shadow-[var(--shadow-glow)]" : "",
                    isOp && !isEq ? "bg-accent text-accent-foreground" : "",
                    isFn ? "bg-secondary text-secondary-foreground" : "",
                    !isOp && !isFn ? "bg-card text-card-foreground" : "",
                  ].join(" ")}
                >
                  {k === "⌫" ? <Delete className="mx-auto h-5 w-5" /> : k}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-muted-foreground/70">
          {t("setupHint")}
        </div>

        {/* Hidden setup dot */}
        <button
          aria-label="Setup"
          onClick={() => (session ? setSetupOpen(true) : setAuthOpen(true))}
          className="fixed bottom-3 right-3 h-6 w-6 rounded-full opacity-30 hover:opacity-100 transition flex items-center justify-center bg-card/60 border border-border/40"
        >
          <Settings className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      <SetupDialog open={setupOpen} onOpenChange={setSetupOpen} />
      {pendingCode && null}
    </div>
  );
}
