"use client";

import { createContext, useContext, useState } from "react";
import { Locale, translations } from "@/lib/translations";

type T = typeof translations.en;

interface LocaleContextValue {
  locale: Locale;
  t: T;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const t = translations[locale] as T;

  function toggleLocale() {
    setLocale((prev) => (prev === "en" ? "ko" : "en"));
  }

  return (
    <LocaleContext.Provider value={{ locale, t, toggleLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}
