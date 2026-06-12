import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { PackageOpen, Receipt, Store } from "lucide-react";

import Footer from "../components/Footer";
import Header from "../components/Header";
import StarRating from "../components/StarRating";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { getToken, getUser, isSeller } from "../lib/auth";
import {
  listMyOrders,
  listMySales,
  type Order,
} from "../services/order.service";
import { createReview } from "../services/review.service";

type Tab = "purchases" | "sales";

export default function Orders() {
  const navigate = useNavigate();
  const token = getToken();
  const user = getUser();
  const seller = isSeller(user);
  const [tab, setTab] = useState<Tab>("purchases");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const purchases = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => listMyOrders(token as string),
    enabled: Boolean(token) && tab === "purchases",
  });

  const sales = useQuery({
    queryKey: ["my-sales"],
    queryFn: () => listMySales(token as string),
    enabled: Boolean(token) && seller && tab === "sales",
  });

  if (!token) {
    return null;
  }

  const active = tab === "purchases" ? purchases : sales;
  const orders = active.data?.data ?? [];

  return (
    <div className="flex min-h-svh flex-col bg-secondary/30">
      <Header />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Transaction history
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track everything you've bought and sold.
        </p>

        {/* Tabs */}
        <div className="mt-6 flex gap-2">
          <TabButton
            active={tab === "purchases"}
            onClick={() => setTab("purchases")}
            icon={Receipt}
            label="Purchases"
          />
          {seller && (
            <TabButton
              active={tab === "sales"}
              onClick={() => setTab("sales")}
              icon={Store}
              label="Sales"
            />
          )}
        </div>

        <section className="mt-5">
          {active.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card py-16 text-center">
              <PackageOpen className="size-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {tab === "purchases"
                  ? "You haven't bought anything yet."
                  : "You haven't sold anything yet."}
              </p>
              {tab === "purchases" && (
                <Link
                  to="/"
                  className="text-sm font-semibold text-coral hover:underline"
                >
                  Browse the catalogue
                </Link>
              )}
            </div>
          ) : (
            <ul className="space-y-3">
              {orders.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  mode={tab}
                  token={token}
                />
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: typeof Receipt;
  label: string;
}

function TabButton({ active, onClick, icon: Icon, label }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
        active
          ? "border-coral bg-coral text-coral-foreground"
          : "border-border bg-background text-foreground hover:bg-secondary",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

function OrderRow({
  order,
  mode,
  token,
}: {
  order: Order;
  mode: Tab;
  token: string;
}) {
  const [reviewing, setReviewing] = useState(false);
  const [done, setDone] = useState(false);
  const date = order.paid_at
    ? new Date(order.paid_at).toLocaleDateString()
    : "—";
  const counterpart =
    mode === "purchases" ? order.seller?.name : order.buyer?.name;

  return (
    <li className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          {order.article ? (
            <Link
              to={`/articles/${order.article.id}`}
              className="line-clamp-1 font-semibold hover:text-coral"
            >
              {order.article.title}
            </Link>
          ) : (
            <p className="line-clamp-1 font-semibold">
              Article #{order.article_id}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {mode === "purchases" ? "Sold by" : "Bought by"}{" "}
            {counterpart ?? "—"} · {date}
          </p>
          <p className="text-xs text-muted-foreground">
            Card •••• {order.card_last4}
          </p>
        </div>

        <div className="text-right">
          {mode === "purchases" ? (
            <p className="text-base font-extrabold text-coral">
              €{Number(order.amount).toFixed(2)}
            </p>
          ) : (
            <>
              <p className="text-base font-extrabold text-coral">
                +€{Number(order.seller_payout).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                fee €{Number(order.commission).toFixed(2)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Review affordance */}
      <div className="mt-3 border-t border-border pt-3">
        {done ? (
          <p className="text-sm font-medium text-coral">Thanks for your review!</p>
        ) : reviewing ? (
          <ReviewForm
            token={token}
            orderId={order.id}
            counterpart={counterpart}
            mode={mode}
            onDone={() => {
              setReviewing(false);
              setDone(true);
            }}
            onCancel={() => setReviewing(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setReviewing(true)}
            className="text-sm font-semibold text-coral hover:underline"
          >
            {mode === "purchases" ? "Review the seller" : "Review the buyer"}
          </button>
        )}
      </div>
    </li>
  );
}

function ReviewForm({
  token,
  orderId,
  counterpart,
  mode,
  onDone,
  onCancel,
}: {
  token: string;
  orderId: number;
  counterpart?: string;
  mode: Tab;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: () => createReview(token, orderId, { rating, comment }),
    onSuccess: onDone,
  });

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">
        Rate {counterpart ?? (mode === "purchases" ? "the seller" : "the buyer")}
      </p>
      <StarRating value={rating} onChange={setRating} />
      <textarea
        rows={2}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment (optional)"
        className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
      {mutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          Couldn't submit your review (maybe already reviewed).
        </p>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          className="rounded-full font-semibold"
          disabled={rating === 0 || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Submitting…" : "Submit review"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full font-semibold"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
