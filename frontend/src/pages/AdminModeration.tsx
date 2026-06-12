import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Check, ImageOff, Trash2, X } from "lucide-react";

import Footer from "../components/Footer";
import Header from "../components/Header";
import { Button } from "../components/ui/button";
import { canModerate, getToken, getUser } from "../lib/auth";
import type { Article } from "../services/article.service";
import {
  approveArticle,
  listPendingArticles,
  rejectArticle,
  removeArticle,
} from "../services/admin.service";

export default function AdminModeration() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = getToken();
  const user = getUser();

  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else if (!canModerate(user)) {
      navigate("/");
    }
  }, [token, user, navigate]);

  const { data: page, isLoading } = useQuery({
    queryKey: ["pending-articles"],
    queryFn: () => listPendingArticles(token as string),
    enabled: Boolean(token) && canModerate(user),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["pending-articles"] });

  if (!token || !canModerate(user)) {
    return null;
  }

  const articles = page?.data ?? [];

  return (
    <div className="flex min-h-svh flex-col bg-secondary/30">
      <Header />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-coral uppercase">
              Moderation
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
              Pending review
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Approve, reject or remove submitted listings.
            </p>
          </div>
          <Link
            to="/admin/sellers"
            className="text-sm font-semibold text-coral hover:underline"
          >
            Manage sellers →
          </Link>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : articles.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Nothing to review right now. 🎉
          </div>
        ) : (
          <ul className="space-y-3">
            {articles.map((article) => (
              <ModerationRow
                key={article.id}
                article={article}
                token={token}
                onDone={invalidate}
              />
            ))}
          </ul>
        )}
      </main>

      <Footer />
    </div>
  );
}

interface RowProps {
  article: Article;
  token: string;
  onDone: () => void;
}

function ModerationRow({ article, token, onDone }: RowProps) {
  const cover = article.images?.[0]?.url;

  const approve = useMutation({
    mutationFn: () => approveArticle(token, article.id),
    onSuccess: onDone,
  });
  const reject = useMutation({
    mutationFn: () => rejectArticle(token, article.id),
    onSuccess: onDone,
  });
  const remove = useMutation({
    mutationFn: () => removeArticle(token, article.id),
    onSuccess: onDone,
  });

  const busy = approve.isPending || reject.isPending || remove.isPending;

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
      <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
        {cover ? (
          <img src={cover} alt="" className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-muted-foreground">
            <ImageOff className="size-6" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <Link
          to={`/articles/${article.id}`}
          className="line-clamp-1 font-semibold hover:text-coral"
        >
          {article.title}
        </Link>
        <p className="text-sm text-muted-foreground">
          {article.category?.name} · {article.seller?.name}
        </p>
        <p className="mt-1 font-extrabold text-coral">
          €{Number(article.price).toFixed(2)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="rounded-full font-semibold"
          onClick={() => approve.mutate()}
          disabled={busy}
        >
          <Check className="size-4" /> Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full font-semibold"
          onClick={() => reject.mutate()}
          disabled={busy}
        >
          <X className="size-4" /> Reject
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-9 rounded-full text-destructive hover:bg-destructive/10"
          aria-label="Remove listing"
          onClick={() => {
            if (window.confirm(`Remove "${article.title}" permanently?`)) {
              remove.mutate();
            }
          }}
          disabled={busy}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
  );
}
