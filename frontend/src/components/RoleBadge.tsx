import { useTranslation } from "react-i18next";
import { Crown, GavelIcon, ShoppingBag, Tag } from "lucide-react";

import { cn } from "../lib/utils";
import type { Role } from "../services/auth.service";

const ROLE_ICON: Record<Role, typeof Crown> = {
  buyer: ShoppingBag,
  seller: Tag,
  admin: Crown,
  moderator: GavelIcon,
};

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

export default function RoleBadge({ role, className }: RoleBadgeProps) {
  const { t } = useTranslation();
  const Icon = ROLE_ICON[role] ?? ShoppingBag;
  const accent = role === "admin" || role === "moderator";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        accent
          ? "bg-coral/10 text-coral"
          : "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      <Icon className="size-3.5" />
      {t(`roles.${role}`)}
    </span>
  );
}
