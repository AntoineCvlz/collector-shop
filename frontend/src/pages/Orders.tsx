import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { PackageOpen, Receipt, Store } from "lucide-react";

import Footer from "../components/Footer";
import Header from "../components/Header";
import { cn } from "../lib/utils";
import { getToken, getUser, isSeller } from "../lib/auth";
import {
  listMyOrders,
  listMySales,
  type Order,
} from "../services/order.service";

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
                <OrderRow key={order.id} order={order} mode={tab} />
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

function OrderRow({ order, mode }: { order: Order; mode: Tab }) {
  const date = order.paid_at
    ? new Date(order.paid_at).toLocaleDateString()
    : "—";

  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="min-w-0">
        {order.article ? (
          <Link
            to={`/articles/${order.article.id}`}
            className="line-clamp-1 font-semibold hover:text-coral"
          >
            {order.article.title}
          </Link>
        ) : (
          <p className="line-clamp-1 font-semibold">Article #{order.article_id}</p>
        )}
        <p className="text-sm text-muted-foreground">
          {mode === "purchases"
            ? `Sold by ${order.seller?.name ?? "—"}`
            : `Bought by ${order.buyer?.name ?? "—"}`}{" "}
          · {date}
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
    </li>
  );
}
