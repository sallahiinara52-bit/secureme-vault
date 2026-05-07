import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { I18nContext, Lang, dictionaries } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

type Mode = "locked" | "real" | "decoy";

type AppState = {
  session: Session | null;
  loading: boolean;
  mode: Mode;
  setMode: (m: Mode) => void;
  realCode: string | null;
  decoyCode: string | null;
  passphrase: string | null;
  setPassphrase: (p: string | null) => void;
  saveCodes: (real: string, decoy: string) => void;
  signOut: () => Promise<void>;
};

import { createContext, useContext } from "react";
const AppContext = createContext<AppState | null>(null);
export const useApp = () => {
  const v = useContext(AppContext);
  if (!v) throw new Error("AppProvider missing");
  return v;
};

const LS = {
  lang: "svp.lang",
  realCode: "svp.realCode",
  decoyCode: "svp.decoyCode",
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("locked");
  const [realCode, setRealCode] = useState<string | null>(null);
  const [decoyCode, setDecoyCode] = useState<string | null>(null);
  const [passphrase, setPassphrase] = useState<string | null>(null);

  useEffect(() => {
    const storedLang = (localStorage.getItem(LS.lang) as Lang) || "en";
    setLangState(storedLang);
    setRealCode(localStorage.getItem(LS.realCode));
    setDecoyCode(localStorage.getItem(LS.decoyCode));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(LS.lang, l);
    if (l === "ar") document.documentElement.dir = "rtl";
    else document.documentElement.dir = "ltr";
  }, []);

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  const saveCodes = useCallback((real: string, decoy: string) => {
    setRealCode(real);
    setDecoyCode(decoy || null);
    localStorage.setItem(LS.realCode, real);
    if (decoy) localStorage.setItem(LS.decoyCode, decoy);
    else localStorage.removeItem(LS.decoyCode);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setMode("locked");
    setPassphrase(null);
  }, []);

  const t = useCallback(
    (k: string) => (dictionaries[lang] && dictionaries[lang][k]) || dictionaries.en[k] || k,
    [lang],
  );

  const i18n = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  const appValue: AppState = {
    session,
    loading,
    mode,
    setMode,
    realCode,
    decoyCode,
    passphrase,
    setPassphrase,
    saveCodes,
    signOut,
  };

  return (
    <I18nContext.Provider value={i18n}>
      <AppContext.Provider value={appValue}>{children}</AppContext.Provider>
    </I18nContext.Provider>
  );
}
