import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Ban, RotateCcw } from "lucide-react";

import Footer from "../components/Footer";
import Header from "../components/Header";
import { Button } from "../components/ui/button";
import { canModerate, getToken, getUser } from "../lib/auth";
import {
  banSeller,
  listSellers,
  unbanSeller,
  type Seller,
} from "../services/admin.service";

export default function AdminSellers() {
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
    queryKey: ["admin-sellers"],
    queryFn: () => listSellers(token as string),
    enabled: Boolean(token) && canModerate(user),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-sellers"] });

  if (!token || !canModerate(user)) {
    return null;
  }

  const sellers = page?.data ?? [];

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
              Sellers
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ban sellers who break the charter, or lift a ban.
            </p>
          </div>
          <Link
            to="/admin/moderation"
            className="text-sm font-semibold text-coral hover:underline"
          >
            ← Review queue
          </Link>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : sellers.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No sellers yet.
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {sellers.map((seller) => (
              <SellerRow
                key={seller.id}
                seller={seller}
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
  seller: Seller;
  token: string;
  onDone: () => void;
}

function SellerRow({ seller, token, onDone }: RowProps) {
  const ban = useMutation({
    mutationFn: () => banSeller(token, seller.id),
    onSuccess: onDone,
  });
  const unban = useMutation({
    mutationFn: () => unbanSeller(token, seller.id),
    onSuccess: onDone,
  });

  const banned = seller.banned_at !== null;
  const busy = ban.isPending || unban.isPending;

  return (
    <li className="flex items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{seller.name}</p>
          {banned && (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
              Banned
            </span>
          )}
        </div>
        <p className="truncate text-sm text-muted-foreground">{seller.email}</p>
        <p className="text-xs text-muted-foreground">
          {seller.articles_count} listing
          {seller.articles_count === 1 ? "" : "s"}
        </p>
      </div>

      {banned ? (
        <Button
          size="sm"
          variant="outline"
          className="rounded-full font-semibold"
          onClick={() => unban.mutate()}
          disabled={busy}
        >
          <RotateCcw className="size-4" /> Unban
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="rounded-full font-semibold text-destructive hover:bg-destructive/10"
          onClick={() => {
            if (window.confirm(`Ban ${seller.name}? Their listings will be hidden.`)) {
              ban.mutate();
            }
          }}
          disabled={busy}
        >
          <Ban className="size-4" /> Ban
        </Button>
      )}
    </li>
  );
}
