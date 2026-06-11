import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  Sparkles,
  Tag,
  User as UserIcon,
} from "lucide-react";

import Footer from "../components/Footer";
import Header from "../components/Header";
import RoleBadge from "../components/RoleBadge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { getMe, updateProfile } from "../services/auth.service";
import type { UserInfo } from "../services/auth.service";
import { getToken, getUser, isSeller, saveSession } from "../lib/auth";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = getToken();

  // Redirect guests out of the private space.
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(token as string),
    enabled: Boolean(token),
    initialData: () => {
      const cached = getUser();
      return cached
        ? {
            response_code: 200,
            status: "success",
            message: "cached",
            user_info: cached,
          }
        : undefined;
    },
  });

  const user = data?.user_info ?? getUser();

  if (!token) {
    return null;
  }

  return (
    <div className="flex min-h-svh flex-col bg-secondary/30">
      <Header />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        {/* ── Identity header ── */}
        <section className="animate-pop flex flex-wrap items-center gap-5">
          <span className="grid size-20 shrink-0 place-items-center rounded-full bg-coral text-2xl font-extrabold text-coral-foreground">
            {user ? initials(user.name) : "?"}
          </span>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {user ? user.name : "My profile"}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {user?.roles?.length ? (
                user.roles.map((role) => <RoleBadge key={role} role={role} />)
              ) : (
                <span className="text-sm text-muted-foreground">
                  No roles assigned yet.
                </span>
              )}
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          {/* ── Snapshot card ── */}
          <aside className="animate-pop" style={{ animationDelay: "0.06s" }}>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-base font-bold">Account details</h2>
              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                    <UserIcon className="size-4" />
                  </span>
                  <div>
                    <dt className="text-xs text-muted-foreground">Name</dt>
                    <dd className="font-medium">{user?.name ?? "—"}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                    <Mail className="size-4" />
                  </span>
                  <div>
                    <dt className="text-xs text-muted-foreground">Email</dt>
                    <dd className="font-medium break-all">
                      {user?.email ?? "—"}
                    </dd>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                    <Tag className="size-4" />
                  </span>
                  <div>
                    <dt className="text-xs text-muted-foreground">Member ID</dt>
                    <dd className="font-medium">#{user?.id ?? "—"}</dd>
                  </div>
                </div>
              </dl>
            </div>

            {/* Become a seller nudge for buyers */}
            {user && !isSeller(user) && (
              <div className="mt-5 rounded-2xl border border-coral/30 bg-coral/5 p-6">
                <span className="grid size-10 place-items-center rounded-full bg-coral/15 text-coral">
                  <Sparkles className="size-5" />
                </span>
                <h3 className="mt-3 font-bold">Ready to sell?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Apply for a seller account to list your own items.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-full font-semibold"
                  disabled
                >
                  Become a seller — soon
                </Button>
              </div>
            )}
          </aside>

          {/* ── Edit form ── */}
          <section
            className="animate-pop rounded-2xl border border-border bg-card p-6 sm:p-8"
            style={{ animationDelay: "0.12s" }}
          >
            <h2 className="text-xl font-bold">Edit profile</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Update your details. Leave the password blank to keep it
              unchanged.
            </p>

            {isLoading && !user ? (
              <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
            ) : (
              <ProfileForm
                token={token}
                user={user ?? null}
                onSaved={(updated) => {
                  saveSession(token, updated);
                  queryClient.setQueryData(["me"], {
                    response_code: 200,
                    status: "success",
                    message: "updated",
                    user_info: updated,
                  });
                }}
              />
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

interface ProfileFormProps {
  token: string;
  user: UserInfo | null;
  onSaved: (user: UserInfo) => void;
}

function ProfileForm({ token, user, onSaved }: ProfileFormProps) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: () => {
      const payload: { name?: string; email?: string; password?: string } = {};
      if (name && name !== user?.name) payload.name = name;
      if (email && email !== user?.email) payload.email = email;
      if (password) payload.password = password;
      return updateProfile(token, payload);
    },
    onSuccess: (res) => {
      setPassword("");
      setDone(true);
      onSaved(res.user_info);
      window.setTimeout(() => setDone(false), 3000);
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDone(false);
    mutation.mutate();
  };

  const dirty =
    name !== (user?.name ?? "") ||
    email !== (user?.email ?? "") ||
    password.length > 0;

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="p-name" className="text-sm font-medium">
          Full name
        </label>
        <Input
          id="p-name"
          type="text"
          minLength={4}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="p-email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="p-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="p-password" className="text-sm font-medium">
          New password
        </label>
        <Input
          id="p-password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11"
        />
      </div>

      {mutation.isError && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" />
          Couldn't save your changes. Please review and try again.
        </p>
      )}

      {done && (
        <p className="flex items-center gap-2 rounded-lg border border-coral/40 bg-coral/10 px-3 py-2 text-sm text-coral">
          <CheckCircle2 className="size-4 shrink-0" />
          Profile updated.
        </p>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          className="h-11 rounded-full font-semibold"
          disabled={mutation.isPending || !dirty}
        >
          {mutation.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
