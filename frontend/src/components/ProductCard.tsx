import { useState } from "react";
import { Heart } from "lucide-react";

import { cn } from "../lib/utils";

export interface Product {
  id: number;
  title: string;
  price: number;
  seller: string;
  condition: string;
  /** Two-stop gradient used as a stand-in for the product photo. */
  hue: number;
  likes: number;
}

interface ProductCardProps {
  product: Product;
  className?: string;
  style?: React.CSSProperties;
}

export default function ProductCard({
  product,
  className,
  style,
}: ProductCardProps) {
  const [liked, setLiked] = useState(false);
  const likeCount = product.likes + (liked ? 1 : 0);

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-soft",
        className,
      )}
      style={style}
    >
      {/* Photo placeholder */}
      <div
        className="relative aspect-square w-full"
        style={{
          background: `linear-gradient(135deg, oklch(0.88 0.08 ${product.hue}), oklch(0.78 0.12 ${(product.hue + 40) % 360}))`,
        }}
      >
        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          aria-pressed={liked}
          aria-label={liked ? "Remove from favourites" : "Add to favourites"}
          className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-background/80 backdrop-blur transition-transform hover:scale-110 active:scale-95"
        >
          <Heart
            className={cn(
              "size-4 transition-colors",
              liked ? "fill-coral text-coral" : "text-foreground",
            )}
          />
        </button>
        <span className="absolute bottom-3 left-3 rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium backdrop-blur">
          {product.condition}
        </span>
      </div>

      {/* Meta */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-1 text-sm font-medium">{product.title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{product.seller}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-base font-extrabold text-coral">
            €{product.price.toFixed(2)}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Heart className="size-3.5" />
            {likeCount}
          </span>
        </div>
      </div>
    </article>
  );
}
