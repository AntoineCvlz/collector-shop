import type { ReactNode } from "react";

import Header from "./Header";

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * Centered card on a clean background — the marketplace auth pattern.
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col bg-secondary/30">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="animate-pop w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-soft sm:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
