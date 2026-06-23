import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import Logo from "./Logo";

export default function Footer() {
  const { t } = useTranslation();

  const columns = [
    {
      title: t("footer.colCompany"),
      links: [
        t("footer.about"),
        t("footer.howItWorks"),
        t("footer.careers"),
        t("footer.sustainability"),
      ],
    },
    {
      title: t("footer.colDiscover"),
      links: [
        t("common.browseCatalogue"),
        t("footer.todaysFinds"),
        t("footer.recentlySold"),
        t("nav.categories"),
      ],
    },
    {
      title: t("footer.colHelp"),
      links: [
        t("footer.helpCentre"),
        t("footer.sellingGuide"),
        t("footer.buyerProtection"),
        t("footer.contactUs"),
      ],
    },
  ];

  return (
    <footer className="mt-8 border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Logo asStatic />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-bold">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link
                      to="/"
                      className="text-sm text-muted-foreground transition-colors hover:text-coral"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
          <div className="flex gap-6">
            <Link to="/" className="transition-colors hover:text-foreground">
              {t("footer.terms")}
            </Link>
            <Link to="/" className="transition-colors hover:text-foreground">
              {t("footer.privacy")}
            </Link>
            <Link to="/" className="transition-colors hover:text-foreground">
              {t("footer.cookies")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
