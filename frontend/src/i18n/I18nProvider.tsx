import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  type Language,
  translate,
  translateApiErrorCode,
  translateConverterIssueCode,
  type TranslationKey,
} from "./translations";
import type {
  ApiErrorCode,
  ConverterIssueCode,
} from "../api/calendarConverter";

export const LANGUAGE_STORAGE_KEY = "firefighter-tools-language";

type I18nContextValue = {
  language: Language;
  selectLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
  translateApiError: (code: ApiErrorCode) => string;
  translateConverterIssue: (code: ConverterIssueCode) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function isLanguage(value: string | null): value is Language {
  return value === "de" || value === "it";
}

function readStoredLanguage(): Language {
  try {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(storedLanguage) ? storedLanguage : "de";
  } catch {
    return "de";
  }
}

type I18nProviderProps = {
  children: ReactNode;
};

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguage] = useState<Language>(readStoredLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const selectLanguage = useCallback((selectedLanguage: Language) => {
    setLanguage(selectedLanguage);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, selectedLanguage);
    } catch {
      // Language selection still works when browser storage is unavailable.
    }
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      selectLanguage,
      t: (key) => translate(language, key),
      translateApiError: (code) => translateApiErrorCode(language, code),
      translateConverterIssue: (code) => translateConverterIssueCode(language, code),
    }),
    [language, selectLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (context === null) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}
