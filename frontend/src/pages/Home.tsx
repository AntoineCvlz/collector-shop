import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PackageOpen, ShieldCheck, Sparkles, Tag } from "lucide-react";

import ArticleCard from "../components/ArticleCard";
import Header from "../components/Header";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { getToken, getUser, isAuthenticated, isBuyer } from "../lib/auth";
import { listArticles } from "../services/article.service";
import { listCategories } from "../services/category.service";
import { getRecommendations } from "../services/favorite.service";

const Footer = lazy(() => import("../components/Footer"));

const ANIMATION_DELAY_CLASSES = [
  "[animation-delay:0s]",
  "[animation-delay:0.04s]",
  "[animation-delay:0.08s]",
  "[animation-delay:0.12s]",
  "[animation-delay:0.16s]",
  "[animation-delay:0.2s]",
  "[animation-delay:0.24s]",
  "[animation-delay:0.28s]",
  "[animation-delay:0.32s]",
  "[animation-delay:0.36s]",
  "[animation-delay:0.4s]",
];

export default function Home() {
  const { t } = useTranslation();
  const authed = isAuthenticated();
  const token = getToken();
  const buyer = isBuyer(getUser());
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const { data: page, isLoading } = useQuery({
    queryKey: ["articles", activeCategory],
    queryFn: () => listArticles({ categoryId: activeCategory }),
  });

  const { data: recommended = [] } = useQuery({
    queryKey: ["recommendations"],
    queryFn: () => getRecommendations(token as string),
    enabled: Boolean(token) && buyer,
  });

  const articles = page?.data ?? [];

  return (
    <div className="min-h-svh">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        {/* ── Promo banner ── */}
        <section className="animate-pop mt-6 overflow-hidden rounded-3xl bg-coral/10 p-8 sm:p-12">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-coral px-3 py-1 text-xs font-bold text-coral-foreground">
              <Sparkles className="size-3.5" /> {t("home.badge")}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
              {t("home.heroTitle")}
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              {t("home.heroSubtitle")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full font-semibold">
                <Link to={authed ? "/sell" : "/register"}>
                  {authed ? t("home.sellAnItem") : t("home.startCollecting")}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Recommended for you (buyers) ── */}
        {buyer && recommended.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-coral" />
              <h2 className="text-lg font-bold">{t("home.recommended")}</h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {recommended.slice(0, 5).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {/* ── Category chips ── */}
        <nav
          aria-label="Categories"
          className="mt-8 flex gap-2 overflow-x-auto pb-2"
        >
          <CategoryChip
            label={t("home.all")}
            active={activeCategory === null}
            onClick={() => setActiveCategory(null)}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat.id}
              label={cat.name}
              active={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
            />
          ))}
        </nav>

        {/* ── Article grid ── */}
        <section className="mt-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold">{t("home.freshFinds")}</h2>
            {page && (
              <span className="text-sm text-muted-foreground">
                {t("common.items", { count: page.total })}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse rounded-2xl bg-secondary"
                />
              ))}
            </div>
          ) : articles.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {articles.map((article, i) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  className={`animate-pop ${ANIMATION_DELAY_CLASSES[Math.min(i, ANIMATION_DELAY_CLASSES.length - 1)]}`}
                />
              ))}
            </div>
          ) : (
            <div className="mt-10 flex flex-col items-center gap-3 py-16 text-center">
              <PackageOpen className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t("home.empty")}</p>
            </div>
          )}
        </section>

        {/* ── Reassurance strip ── */}
        <section className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: t("home.trust.protectionTitle"),
              body: t("home.trust.protectionBody"),
            },
            {
              icon: Tag,
              title: t("home.trust.feeTitle"),
              body: t("home.trust.feeBody"),
            },
            {
              icon: Sparkles,
              title: t("home.trust.qualityTitle"),
              body: t("home.trust.qualityBody"),
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <span className="grid size-10 place-items-center rounded-full bg-coral/10 text-coral">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-3 font-bold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
              </div>
            );
          })}
        </section>
      </main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}

interface CategoryChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function CategoryChip({ label, active, onClick }: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
        active
          ? "border-coral bg-coral text-coral-foreground"
          : "border-border bg-background text-foreground hover:bg-secondary",
      )}
    >
      {label}
    </button>
  );
}
