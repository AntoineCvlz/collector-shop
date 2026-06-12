import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";

import { cn } from "../lib/utils";
import { getToken, isAuthenticated } from "../lib/auth";
import { addFavorite, removeFavorite } from "../services/favorite.service";

interface FavoriteButtonProps {
  articleId: number;
  initialFavorited?: boolean;
  className?: string;
}

/**
 * Heart toggle for saving an article to the wishlist. Guests are sent to
 * login. Stops click propagation so it can sit inside a card link.
 */
export default function FavoriteButton({
  articleId,
  initialFavorited = false,
  className,
}: FavoriteButtonProps) {
  const navigate = useNavigate();
  const [favorited, setFavorited] = useState(initialFavorited);

  const mutation = useMutation({
    mutationFn: (next: boolean) => {
      const token = getToken() as string;
      return next ? addFavorite(token, articleId) : removeFavorite(token, articleId);
    },
    onError: () => setFavorited((v) => !v), // revert on failure
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    const next = !favorited;
    setFavorited(next); // optimistic
    mutation.mutate(next);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={favorited}
      aria-label={favorited ? "Remove from favourites" : "Add to favourites"}
      className={cn(
        "grid size-9 place-items-center rounded-full bg-background/80 backdrop-blur transition-transform hover:scale-110 active:scale-95",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-4 transition-colors",
          favorited ? "fill-coral text-coral" : "text-foreground",
        )}
      />
    </button>
  );
}
