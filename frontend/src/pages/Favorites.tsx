import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { HeartCrack } from "lucide-react";

import ArticleCard from "../components/ArticleCard";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { getToken } from "../lib/auth";
import { getFavorites } from "../services/favorite.service";

export default function Favorites() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = getToken();

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const { data: page, isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => getFavorites(token as string),
    enabled: Boolean(token),
  });

  if (!token) {
    return null;
  }

  const articles = page?.data ?? [];

  return (
    <div className="flex min-h-svh flex-col">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {t("favorites.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("favorites.subtitle")}
        </p>

        {isLoading ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-2xl bg-secondary"
              />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-3 py-16 text-center">
            <HeartCrack className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("favorites.empty")}
            </p>
            <Link
              to="/"
              className="text-sm font-semibold text-coral hover:underline"
            >
              {t("common.browseCatalogue")}
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} favorited />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
