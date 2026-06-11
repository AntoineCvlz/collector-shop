import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Lock, Mail, User } from "lucide-react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { register } from "../services/auth.service";

export default function RegisterForm() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      // Account created — send the new collector to sign in.
      navigate("/login");
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate({ name, email, password });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5"
      aria-label="Create account form"
    >
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Join Collector.shop
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create your free account and start collecting today.
        </p>
      </header>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Full name
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Jane Collector"
            required
            minLength={4}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 pl-9"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
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
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
      </div>

      {mutation.isError && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" />
          Couldn't create the account. Check your details and try again.
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={mutation.isPending}
        className="group h-12 rounded-full font-semibold"
      >
        {mutation.isPending ? "Creating…" : "Create my account"}
        {!mutation.isPending && (
          <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already a member?{" "}
        <Link
          to="/login"
          className="font-semibold text-coral underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
