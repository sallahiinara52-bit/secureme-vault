import { ReactNode, useCallback, useEffect, useMemo, useState, createContext, useContext } from "react";
import { I18nContext, Lang, dictionaries } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

type AppState = {
  session: Session | null;
  loading: boolean;
  passphrase: string | null;
  setPassphrase: (p: string | null) => void;
  signOut: () => Promise<void>;
};

const AppContext = createContext<AppState | null>(null);
export const useApp = () => {
  const v = useContext(AppContext);
  if (!v) throw new Error("AppProvider missing");
  return v;
};

const LS = { lang: "svp.lang" };

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [passphrase, setPassphrase] = useState<string | null>(null);

  useEffect(() => {
    const storedLang = (localStorage.getItem(LS.lang) as Lang) || "en";
    setLangState(storedLang);

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) setPassphrase(null);
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
  }, []);

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  const signOut = useCallback(async () => {
    setPassphrase(null);
    await supabase.auth.signOut();
  }, []);

  const t = useCallback(
    (k: string) => (dictionaries[lang] && dictionaries[lang][k]) || dictionaries.en[k] || k,
    [lang],
  );

  const i18n = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  const value: AppState = { session, loading, passphrase, setPassphrase, signOut };

  return (
    <I18nContext.Provider value={i18n}>
      <AppContext.Provider value={value}>{children}</AppContext.Provider>
    </I18nContext.Provider>
  );
}
