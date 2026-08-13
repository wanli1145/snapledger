import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "snapledger-locale";
const LocaleContext = createContext(null);

function initialLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "zh" || saved === "en") return saved;
  } catch {
    // Storage can be unavailable in privacy-restricted browsers.
  }
  return navigator.language?.toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en" : "zh-CN";
    document.title = locale === "en"
      ? "SnapLedger — Receipt Memory Agent"
      : "小票管家 SnapLedger — 应用";
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // The language still works for this session.
    }
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, isEnglish: locale === "en" }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside LocaleProvider");
  return value;
}
