import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Lock, Mail } from "lucide-react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { login } from "../services/auth.service";
import { saveSession } from "../lib/auth";

export default function LoginForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      saveSession(data.token, data.user_info);
      navigate("/");
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate({ email, password });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6"
      aria-label="Sign in form"
    >
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">
          {t("auth.welcomeBack")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth.loginSubtitle")}
        </p>
      </header>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          {t("auth.email")}
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 pl-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium">
            {t("auth.password")}
          </label>
          <Link
            to="/login"
            className="text-xs font-medium text-coral transition-colors hover:underline"
          >
            {t("auth.forgot")}
          </Link>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 pl-9"
          />
        </div>
      </div>

      {mutation.isError && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" />
          {t("auth.invalidCredentials")}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={mutation.isPending}
        className="group h-12 rounded-full font-semibold"
      >
        {mutation.isPending ? t("auth.loggingIn") : t("nav.login")}
        {!mutation.isPending && (
          <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("auth.newHere")}{" "}
        <Link
          to="/register"
          className="font-semibold text-coral underline-offset-4 hover:underline"
        >
          {t("nav.signup")}
        </Link>
      </p>
    </form>
  );
}
