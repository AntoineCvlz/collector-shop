import { useTranslation } from "react-i18next";

import { cn } from "../lib/utils";
import { SUPPORTED_LANGUAGES, type Language } from "../i18n";

export default function LanguageSwitcher({
  className,
}: {
  className?: string;
}) {
  const { i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? "en") as Language;

  const change = (lang: Language) => {
    void i18n.changeLanguage(lang);
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-background p-0.5 text-xs font-semibold",
        className,
      )}
      role="group"
      aria-label="Language"
    >
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => change(lang)}
          aria-pressed={current === lang}
          className={cn(
            "rounded-full px-2.5 py-1 uppercase transition-colors",
            current === lang
              ? "bg-coral text-coral-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
