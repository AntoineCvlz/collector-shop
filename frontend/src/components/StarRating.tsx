import { Star } from "lucide-react";

import { cn } from "../lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  className?: string;
  size?: "sm" | "md";
}

export default function StarRating({
  value,
  onChange,
  className,
  size = "md",
}: StarRatingProps) {
  const interactive = typeof onChange === "function";
  const starSize = size === "sm" ? "size-4" : "size-6";

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        const StarEl = (
          <Star
            className={cn(
              starSize,
              filled ? "fill-coral text-coral" : "text-muted-foreground/40",
            )}
          />
        );

        return interactive ? (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            className="transition-transform hover:scale-110"
          >
            {StarEl}
          </button>
        ) : (
          <span key={star}>{StarEl}</span>
        );
      })}
    </div>
  );
}
