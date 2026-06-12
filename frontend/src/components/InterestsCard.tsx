import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Heart } from "lucide-react";

import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { listCategories } from "../services/category.service";
import { getInterests, syncInterests } from "../services/favorite.service";

interface InterestsCardProps {
  token: string;
}

/**
 * Lets a buyer pick favourite categories to drive recommendations.
 */
export default function InterestsCard({ token }: InterestsCardProps) {
  const [saved, setSaved] = useState(false);
  // Local edits layered on top of the loaded interests. Null = not edited yet,
  // so we mirror whatever the server returned.
  const [draft, setDraft] = useState<number[] | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const { data: interests = [] } = useQuery({
    queryKey: ["interests"],
    queryFn: () => getInterests(token),
  });

  const selected = draft ?? interests.map((c) => c.id);

  const mutation = useMutation({
    mutationFn: () => syncInterests(token, selected),
    onSuccess: () => {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    },
  });

  const toggle = (id: number) => {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    setDraft(next);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Heart className="size-4 text-coral" />
        <h2 className="text-base font-bold">Your interests</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick categories you love to get tailored recommendations.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {categories.map((cat) => {
          const on = selected.includes(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggle(cat.id)}
              aria-pressed={on}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                on
                  ? "border-coral bg-coral text-coral-foreground"
                  : "border-border bg-background hover:bg-secondary",
              )}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button
          size="sm"
          className="rounded-full font-semibold"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving…" : "Save interests"}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-coral">
            <CheckCircle2 className="size-4" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
