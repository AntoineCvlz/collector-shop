import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ImageOff, ShieldCheck, Truck } from "lucide-react";

import Footer from "../components/Footer";
import Header from "../components/Header";
import StarRating from "../components/StarRating";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { getUser, isAuthenticated } from "../lib/auth";
import { getArticle } from "../services/article.service";
import { getUserReviews } from "../services/review.service";

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const articleId = Number(id);
  const [active, setActive] = useState(0);

  const {
    data: article,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["article", articleId],
    queryFn: () => getArticle(articleId),
    enabled: Number.isFinite(articleId),
  });

  const sellerId = article?.seller?.id;
  const { data: sellerReviews } = useQuery({
    queryKey: ["user-reviews", sellerId],
    queryFn: () => getUserReviews(sellerId as number),
    enabled: Boolean(sellerId),
  });

  return (
    <div className="flex min-h-svh flex-col">
      <Header />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to catalogue
        </Link>

        {isLoading ? (
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-2xl bg-secondary" />
            <div className="space-y-4">
              <div className="h-8 w-2/3 animate-pulse rounded bg-secondary" />
              <div className="h-6 w-1/3 animate-pulse rounded bg-secondary" />
              <div className="h-24 animate-pulse rounded bg-secondary" />
            </div>
          </div>
        ) : isError || !article ? (
          <div className="mt-16 text-center">
            <h1 className="text-2xl font-extrabold">Article not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              It may have been removed or is awaiting review.
            </p>
            <Button asChild className="mt-6 rounded-full font-semibold">
              <Link to="/">Browse the catalogue</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            {/* Gallery */}
            <div>
              <div className="aspect-square w-full overflow-hidden rounded-2xl border border-border bg-secondary">
                {article.images?.[active] ? (
                  <img
                    src={article.images[active].url}
                    alt={article.title}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="grid size-full place-items-center text-muted-foreground">
                    <ImageOff className="size-10" />
                  </div>
                )}
              </div>
              {article.images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {article.images.map((img, i) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setActive(i)}
                      className={cn(
                        "size-16 shrink-0 overflow-hidden rounded-lg border-2",
                        i === active ? "border-coral" : "border-transparent",
                      )}
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="size-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              {article.category && (
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {article.category.name}
                </span>
              )}
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
                {article.title}
              </h1>

              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-coral">
                  €{Number(article.price).toFixed(2)}
                </span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Truck className="size-4" />+€
                  {Number(article.shipping_cost ?? 0).toFixed(2)} shipping
                </span>
              </div>

              {article.seller && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    Sold by{" "}
                    <span className="font-medium text-foreground">
                      {article.seller.name}
                    </span>
                  </p>
                  {sellerReviews && sellerReviews.meta.total_reviews > 0 ? (
                    <div className="mt-1.5 flex items-center gap-2">
                      <StarRating
                        value={sellerReviews.meta.average_rating ?? 0}
                        size="sm"
                      />
                      <span className="text-sm text-muted-foreground">
                        {sellerReviews.meta.average_rating} (
                        {sellerReviews.meta.total_reviews})
                      </span>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      No reviews yet
                    </p>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {!isAuthenticated() ? (
                  <Button
                    asChild
                    size="lg"
                    className="h-12 flex-1 rounded-full font-semibold"
                  >
                    <Link to="/login">Log in to buy</Link>
                  </Button>
                ) : getUser()?.id === article.seller?.id ? (
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 flex-1 rounded-full font-semibold"
                    disabled
                  >
                    This is your listing
                  </Button>
                ) : (
                  <Button
                    asChild
                    size="lg"
                    className="h-12 flex-1 rounded-full font-semibold"
                  >
                    <Link to={`/articles/${article.id}/checkout`}>Buy now</Link>
                  </Button>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl bg-secondary/60 p-3 text-sm text-muted-foreground">
                <ShieldCheck className="size-4 shrink-0 text-coral" />
                Protected by Collector.shop buyer protection.
              </div>

              <div className="mt-8">
                <h2 className="text-sm font-bold">Description</h2>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                  {article.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
