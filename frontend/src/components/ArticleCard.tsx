import { Link } from "react-router-dom";
import { ImageOff } from "lucide-react";

import { cn } from "../lib/utils";
import type { Article } from "../services/article.service";

interface ArticleCardProps {
  article: Article;
  className?: string;
  style?: React.CSSProperties;
}

export default function ArticleCard({
  article,
  className,
  style,
}: ArticleCardProps) {
  const cover = article.images?.[0]?.url;
  const total = Number(article.price) + Number(article.shipping_cost ?? 0);

  return (
    <Link
      to={`/articles/${article.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-soft",
        className,
      )}
      style={style}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-secondary">
        {cover ? (
          <img
            src={cover}
            alt={article.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <ImageOff className="size-8" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-1 text-sm font-medium">{article.title}</h3>
        {article.seller && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {article.seller.name}
          </p>
        )}
        <div className="mt-2 flex items-baseline justify-between gap-2">
          <span className="text-base font-extrabold text-coral">
            €{Number(article.price).toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">
            +€{Number(article.shipping_cost ?? 0).toFixed(2)} ship
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          €{total.toFixed(2)} total
        </p>
      </div>
    </Link>
  );
}
