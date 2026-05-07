import { ReactNode, useCallback, useEffect, useMemo, useState, createContext, useContext } from "react";
import { I18nContext, Lang, dictionaries } from "@/lib/i18n";
import { getSetting, isInitialized, setSetting } from "@/lib/vault-db";

type AppState = {
  ready: boolean;
  hasVault: boolean;
  setHasVault: (v: boolean) => void;
  unlockKey: CryptoKey | null;
  setUnlockKey: (k: CryptoKey | null) => void;
  autoLockMinutes: number;
  setAutoLockMinutes: (m: number) => Promise<void>;
  lock: () => void;
};

const AppContext = createContext<AppState | null>(null);
export const useApp = () => {
  const v = useContext(AppContext);
  if (!v) throw new Error("AppProvider missing");
  return v;
};

const LS_LANG = "svp.lang";

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [ready, setReady] = useState(false);
  const [hasVault, setHasVault] = useState(false);
  const [unlockKey, setUnlockKey] = useState<CryptoKey | null>(null);
  const [autoLockMinutes, setAutoLockMinutesState] = useState<number>(2);

  // Init: load language, vault state, settings
  useEffect(() => {
    (async () => {
      const storedLang = (localStorage.getItem(LS_LANG) as Lang) || "en";
      setLangState(storedLang);
      const init = await isInitialized();
      setHasVault(init);
      const mins = await getSetting<number>("autoLockMinutes", 2);
      setAutoLockMinutesState(mins);
      setReady(true);
    })();
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(LS_LANG, l);
  }, []);

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  const lock = useCallback(() => setUnlockKey(null), []);

  const setAutoLockMinutes = useCallback(async (m: number) => {
    const clamped = Math.min(10, Math.max(1, Math.round(m)));
    setAutoLockMinutesState(clamped);
    await setSetting("autoLockMinutes", clamped);
  }, []);

  // Auto-lock when tab is hidden for the configured time
  useEffect(() => {
    if (!unlockKey) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const ms = autoLockMinutes * 60 * 1000;
    function clear() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }
    function onVis() {
      if (document.hidden) {
        clear();
        timer = setTimeout(() => {
          if (document.hidden) lock();
        }, ms);
      } else {
        clear();
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      clear();
    };
  }, [unlockKey, autoLockMinutes, lock]);

  // Inactivity timer (no input/click) also locks after the same window
  useEffect(() => {
    if (!unlockKey) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const ms = autoLockMinutes * 60 * 1000;
    function reset() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => lock(), ms);
    }
    const events = ["mousemove", "keydown", "touchstart", "click"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (timer) clearTimeout(timer);
    };
  }, [unlockKey, autoLockMinutes, lock]);

  const t = useCallback(
    (k: string) => (dictionaries[lang] && dictionaries[lang][k]) || dictionaries.en[k] || k,
    [lang],
  );

  const i18n = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  const value: AppState = {
    ready,
    hasVault,
    setHasVault,
    unlockKey,
    setUnlockKey,
    autoLockMinutes,
    setAutoLockMinutes,
    lock,
  };

  return (
    <I18nContext.Provider value={i18n}>
      <AppContext.Provider value={value}>{children}</AppContext.Provider>
    </I18nContext.Provider>
  );
}
