"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { dict, DEFAULT_LANG, type Lang, type DictKey } from "@/lib/i18n";

type I18nContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: DictKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "mcs-lang";

export default function I18nProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  // อ่านภาษาที่เคยเลือกไว้ (client เท่านั้น)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "bg") setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback((key: DictKey) => dict[lang][key] ?? dict.en[key] ?? key, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
