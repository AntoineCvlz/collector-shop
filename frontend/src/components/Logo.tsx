import { Link } from "react-router-dom";

import { cn } from "../lib/utils";

interface LogoProps {
  className?: string;
  /** Render as a static mark instead of a link (e.g. inside a footer). */
  asStatic?: boolean;
}

function Mark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-xl font-extrabold tracking-tight",
        className,
      )}
    >
      Collector
      <span className="text-coral">.</span>
      shop
    </span>
  );
}

export default function Logo({ className, asStatic = false }: LogoProps) {
  if (asStatic) {
    return <Mark className={className} />;
  }

  return (
    <Link to="/" aria-label="Collector.shop — home">
      <Mark className={className} />
    </Link>
  );
}
