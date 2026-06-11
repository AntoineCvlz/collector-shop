import { Crown, ShoppingBag, Tag } from "lucide-react";

import { cn } from "../lib/utils";
import type { Role } from "../services/auth.service";

const ROLE_META: Record<Role, { label: string; icon: typeof Crown }> = {
  buyer: { label: "Collector", icon: ShoppingBag },
  seller: { label: "Seller", icon: Tag },
  admin: { label: "Admin", icon: Crown },
};

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

/**
 * A small pill describing a single role. Admin keeps a coral accent so it
 * reads as a special badge; buyer/seller stay neutral.
 */
export default function RoleBadge({ role, className }: RoleBadgeProps) {
  const meta = ROLE_META[role] ?? { label: role, icon: ShoppingBag };
  const Icon = meta.icon;
  const isAdmin = role === "admin";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        isAdmin
          ? "bg-coral/10 text-coral"
          : "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      <Icon className="size-3.5" />
      {meta.label}
    </span>
  );
}
