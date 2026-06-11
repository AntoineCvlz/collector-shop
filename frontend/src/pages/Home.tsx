import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Sparkles, Tag } from "lucide-react";

import Footer from "../components/Footer";
import Header from "../components/Header";
import ProductCard, { type Product } from "../components/ProductCard";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { isAuthenticated } from "../lib/auth";

const CATEGORIES = [
  "All",
  "Watches",
  "Vinyl",
  "Coins",
  "Cameras",
  "Jewellery",
  "Comics",
  "Toys",
];

const SAMPLE: Array<Omit<Product, "id">> = [
  { title: "Omega Seamaster 1968", price: 1240, seller: "vintage_time", condition: "Very good", hue: 30, likes: 42 },
  { title: "Pink Floyd — Animals LP", price: 38, seller: "wax_archive", condition: "Good", hue: 280, likes: 17 },
  { title: "1921 Morgan Silver Dollar", price: 92, seller: "coin_vault", condition: "Excellent", hue: 90, likes: 8 },
  { title: "Leica M3 rangefinder", price: 890, seller: "analog_house", condition: "Very good", hue: 220, likes: 64 },
  { title: "Art Deco gold brooch", price: 215, seller: "atelier_lune", condition: "Excellent", hue: 50, likes: 23 },
  { title: "Amazing Spider-Man #129", price: 460, seller: "panel_press", condition: "Good", hue: 10, likes: 51 },
  { title: "Star Wars Kenner AT-AT", price: 140, seller: "retro_play", condition: "Used", hue: 200, likes: 19 },
  { title: "Seiko 6139 chronograph", price: 520, seller: "vintage_time", condition: "Very good", hue: 160, likes: 30 },
  { title: "The Beatles — Abbey Road", price: 55, seller: "wax_archive", condition: "Very good", hue: 320, likes: 27 },
  { title: "Roman denarius, 2nd c.", price: 310, seller: "coin_vault", condition: "Good", hue: 70, likes: 12 },
  { title: "Polaroid SX-70", price: 175, seller: "analog_house", condition: "Very good", hue: 250, likes: 38 },
  { title: "Tiffany sterling ring", price: 280, seller: "atelier_lune", condition: "Excellent", hue: 40, likes: 44 },
];

const PRODUCTS: Product[] = SAMPLE.map((p, i) => ({ ...p, id: i + 1 }));

// Loose mapping so chips actually filter the mock grid.
const CATEGORY_OF: Record<string, string> = {
  vintage_time: "Watches",
  wax_archive: "Vinyl",
  coin_vault: "Coins",
  analog_house: "Cameras",
  atelier_lune: "Jewellery",
  panel_press: "Comics",
  retro_play: "Toys",
};

export default function Home() {
  const authed = isAuthenticated();
  const [active, setActive] = useState("All");

  const products = useMemo(() => {
    if (active === "All") return PRODUCTS;
    return PRODUCTS.filter((p) => CATEGORY_OF[p.seller] === active);
  }, [active]);

  return (
    <div className="min-h-svh">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        {/* ── Promo banner ── */}
        <section className="animate-pop mt-6 overflow-hidden rounded-3xl bg-coral/10 p-8 sm:p-12">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-coral px-3 py-1 text-xs font-bold text-coral-foreground">
              <Sparkles className="size-3.5" /> New today
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
              Find the piece you've been hunting for.
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              Thousands of rare and vintage collectibles, listed by people who
              love them as much as you do.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full font-semibold">
                <Link to={authed ? "/profile" : "/register"}>
                  {authed ? "Sell an item" : "Start collecting"}
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-border font-semibold"
              >
                <Link to="/">Browse all</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ── Category chips ── */}
        <nav
          aria-label="Categories"
          className="mt-8 flex gap-2 overflow-x-auto pb-2"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActive(cat)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                active === cat
                  ? "border-coral bg-coral text-coral-foreground"
                  : "border-border bg-background text-foreground hover:bg-secondary",
              )}
            >
              {cat}
            </button>
          ))}
        </nav>

        {/* ── Product grid ── */}
        <section className="mt-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold">
              {active === "All" ? "Fresh finds" : active}
            </h2>
            <span className="text-sm text-muted-foreground">
              {products.length} items
            </span>
          </div>

          {products.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  className="animate-pop"
                  style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}
                />
              ))}
            </div>
          ) : (
            <p className="mt-10 text-center text-sm text-muted-foreground">
              No items in this category yet.
            </p>
          )}
        </section>

        {/* ── Reassurance strip ── */}
        <section className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Buyer protection",
              body: "Your money is held safely until you confirm the item.",
            },
            {
              icon: Tag,
              title: "Fair, flat fee",
              body: "A simple 5% on each sale — no hidden charges.",
            },
            {
              icon: Sparkles,
              title: "Curated quality",
              body: "Every listing is reviewed before it goes live.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <span className="grid size-10 place-items-center rounded-full bg-coral/10 text-coral">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-3 font-bold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
              </div>
            );
          })}
        </section>
      </main>

      <Footer />
    </div>
  );
}
