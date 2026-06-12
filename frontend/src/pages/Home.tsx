import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PackageOpen, ShieldCheck, Sparkles, Tag } from "lucide-react";

import ArticleCard from "../components/ArticleCard";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { getToken, getUser, isAuthenticated, isBuyer } from "../lib/auth";
import { listArticles } from "../services/article.service";
import { listCategories } from "../services/category.service";
import { getRecommendations } from "../services/favorite.service";

export default function Home() {
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
              <Sparkles className="size-3.5" /> Collector.shop
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
              Find the piece you've been hunting for.
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              Rare and vintage collectibles, listed by people who love them as
              much as you do.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full font-semibold">
                <Link to={authed ? "/sell" : "/register"}>
                  {authed ? "Sell an item" : "Start collecting"}
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
              <h2 className="text-lg font-bold">Recommended for you</h2>
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
            label="All"
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
            <h2 className="text-lg font-bold">Fresh finds</h2>
            {page && (
              <span className="text-sm text-muted-foreground">
                {page.total} items
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
                  className="animate-pop"
                  style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}
                />
              ))}
            </div>
          ) : (
            <div className="mt-10 flex flex-col items-center gap-3 py-16 text-center">
              <PackageOpen className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No items in this category yet.
              </p>
            </div>
          )}
        </section>

        {/* ── Reassurance strip ── */}
        <section className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Buyer protection",
              body: "Your money is held safely until you confirm the item.",
            },
            {
              icon: Tag,
              title: "Fair, flat fee",
              body: "A simple 5% on each sale — no hidden charges.",
            },
            {
              icon: Sparkles,
              title: "Curated quality",
              body: "Every listing is reviewed before it goes live.",
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

      <Footer />
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
