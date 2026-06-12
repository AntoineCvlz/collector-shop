import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Heart,
  LayoutGrid,
  LogOut,
  Search,
  Shield,
  User,
} from "lucide-react";

import Logo from "./Logo";
import { Button } from "./ui/button";
import {
  clearSession,
  getToken,
  getUser,
  isAdmin,
  isAuthenticated,
} from "../lib/auth";
import { logout } from "../services/auth.service";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function Header() {
  const navigate = useNavigate();
  const authed = isAuthenticated();
  const user = getUser();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    const token = getToken();
    setOpen(false);
    try {
      if (token) {
        await logout(token);
      }
    } finally {
      clearSession();
      navigate("/login");
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo className="shrink-0" />

        {/* Search — the heart of the marketplace */}
        <div className="relative mx-auto hidden w-full max-w-xl md:block">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search for watches, vinyl, coins…"
            className="h-11 w-full rounded-full border border-border bg-secondary/60 pr-4 pl-11 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-coral/40 focus:bg-background focus:ring-2 focus:ring-coral/20"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {authed && user ? (
            <>
              <Link
                to="/profile"
                className="hidden size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:grid"
                aria-label="Favourites"
              >
                <Heart className="size-5" />
              </Link>

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-secondary"
                  aria-haspopup="menu"
                  aria-expanded={open}
                >
                  <span className="grid size-8 place-items-center rounded-full bg-coral text-xs font-bold text-coral-foreground">
                    {initials(user.name)}
                  </span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </button>

                {open && (
                  <div
                    role="menu"
                    className="animate-fade absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-popover shadow-soft-lg"
                    style={{ animationDuration: "0.12s" }}
                  >
                    <div className="border-b border-border px-4 py-3">
                      <p className="truncate text-sm font-semibold">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <div className="p-1.5">
                      <MenuItem
                        icon={User}
                        label="My profile"
                        onClick={() => {
                          setOpen(false);
                          navigate("/profile");
                        }}
                      />
                      <MenuItem
                        icon={LayoutGrid}
                        label="My items"
                        onClick={() => {
                          setOpen(false);
                          navigate("/profile");
                        }}
                      />
                      {isAdmin(user) && (
                        <MenuItem
                          icon={Shield}
                          label="Categories"
                          onClick={() => {
                            setOpen(false);
                            navigate("/admin/categories");
                          }}
                        />
                      )}
                    </div>
                    <div className="border-t border-border p-1.5">
                      <MenuItem
                        icon={LogOut}
                        label="Log out"
                        destructive
                        onClick={handleLogout}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button asChild className="rounded-full font-semibold">
                <Link to="/profile">Sell now</Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className="hidden rounded-full font-semibold sm:inline-flex"
              >
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild className="rounded-full font-semibold">
                <Link to="/register">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile search */}
      <div className="border-t border-border px-4 py-2.5 md:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search items…"
            className="h-10 w-full rounded-full border border-border bg-secondary/60 pr-4 pl-11 text-sm outline-none placeholder:text-muted-foreground focus:border-coral/40 focus:bg-background focus:ring-2 focus:ring-coral/20"
          />
        </div>
      </div>
    </header>
  );
}

interface MenuItemProps {
  icon: typeof User;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

function MenuItem({ icon: Icon, label, onClick, destructive }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-secondary"
      }`}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}
