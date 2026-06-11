import { Link } from "react-router-dom";

import Logo from "./Logo";

const COLUMNS = [
  {
    title: "Collector.shop",
    links: ["About", "How it works", "Careers", "Sustainability"],
  },
  {
    title: "Discover",
    links: ["Browse catalogue", "Today's finds", "Recently sold", "Categories"],
  },
  {
    title: "Help",
    links: ["Help centre", "Selling guide", "Buyer protection", "Contact us"],
  },
];

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Logo asStatic />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The marketplace for collectors. Buy and sell rare, vintage and
              remarkable finds — safely.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-bold">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link
                      to="/"
                      className="text-sm text-muted-foreground transition-colors hover:text-coral"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Collector.shop. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/" className="transition-colors hover:text-foreground">
              Terms
            </Link>
            <Link to="/" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link to="/" className="transition-colors hover:text-foreground">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
