import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
} from "lucide-react";

import Footer from "../components/Footer";
import Header from "../components/Header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { getToken, getUser, isBuyer } from "../lib/auth";
import { getArticle } from "../services/article.service";
import { checkout } from "../services/order.service";

export default function Checkout() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const articleId = Number(id);
  const navigate = useNavigate();
  const token = getToken();
  const user = getUser();

  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else if (!isBuyer(user)) {
      navigate(`/articles/${articleId}`);
    }
  }, [token, user, articleId, navigate]);

  const { data: article, isLoading } = useQuery({
    queryKey: ["article", articleId],
    queryFn: () => getArticle(articleId),
    enabled: Number.isFinite(articleId) && Boolean(token),
  });

  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      const [mm, yy] = expiry.split("/").map((s) => s.trim());
      return checkout(token as string, articleId, {
        card_number: number.replace(/\s+/g, ""),
        card_name: name,
        expiry_month: Number(mm),
        expiry_year: 2000 + Number(yy),
        cvv,
      });
    },
  });

  if (!token || !isBuyer(user)) {
    return null;
  }

  const price = Number(article?.price ?? 0);
  const shipping = Number(article?.shipping_cost ?? 0);
  const total = price + shipping;

  return (
    <div className="flex min-h-svh flex-col bg-secondary/30">
      <Header />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        {mutation.isSuccess ? (
          <div className="rounded-2xl border border-coral/30 bg-card p-8 text-center">
            <CheckCircle2 className="mx-auto size-12 text-coral" />
            <h1 className="mt-4 text-2xl font-extrabold">
              {t("checkout.successTitle")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("checkout.successBody")}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild className="rounded-full font-semibold">
                <Link to="/orders">{t("checkout.viewOrders")}</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-full font-semibold"
              >
                <Link to="/">{t("checkout.keepBrowsing")}</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {t("checkout.title")}
            </h1>

            <div className="mt-8 grid gap-6 md:grid-cols-[1.4fr_1fr]">
              {/* Card form */}
              <form
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  mutation.mutate();
                }}
                className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6"
                aria-label="Payment form"
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CreditCard className="size-4 text-coral" />
                  {t("checkout.cardDetails")}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="number" className="text-sm font-medium">
                    {t("checkout.cardNumber")}
                  </label>
                  <Input
                    id="number"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="4242 4242 4242 4242"
                    required
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="text-sm font-medium">
                    {t("checkout.nameOnCard")}
                  </label>
                  <Input
                    id="name"
                    autoComplete="cc-name"
                    required
                    minLength={3}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="expiry" className="text-sm font-medium">
                      {t("checkout.expiry")}
                    </label>
                    <Input
                      id="expiry"
                      autoComplete="cc-exp"
                      placeholder="12/28"
                      required
                      pattern="\d{2}\s*/\s*\d{2}"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="cvv" className="text-sm font-medium">
                      CVV
                    </label>
                    <Input
                      id="cvv"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                      required
                      pattern="\d{3,4}"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>

                {mutation.isError && (
                  <p
                    role="alert"
                    className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    <AlertCircle className="size-4 shrink-0" />
                    {t("checkout.error")}
                  </p>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 rounded-full font-semibold"
                  disabled={mutation.isPending || isLoading}
                >
                  <Lock className="size-4" />
                  {mutation.isPending
                    ? t("checkout.processing")
                    : t("checkout.pay", { amount: total.toFixed(2) })}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  {t("checkout.simulated")}
                </p>
              </form>

              {/* Order summary */}
              <aside className="h-fit rounded-2xl border border-border bg-card p-6">
                <h2 className="text-sm font-bold">{t("checkout.summary")}</h2>
                {article && (
                  <p className="mt-3 line-clamp-2 text-sm font-medium">
                    {article.title}
                  </p>
                )}
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      {t("checkout.itemPrice")}
                    </dt>
                    <dd>€{price.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      {t("checkout.shipping")}
                    </dt>
                    <dd>€{shipping.toFixed(2)}</dd>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-extrabold">
                    <dt>{t("checkout.total")}</dt>
                    <dd className="text-coral">€{total.toFixed(2)}</dd>
                  </div>
                </dl>
                <div className="mt-5 flex items-start gap-2 rounded-xl bg-secondary/60 p-3 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-coral" />
                  {t("checkout.protectionNote")}
                </div>
              </aside>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
