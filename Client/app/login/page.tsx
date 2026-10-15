"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Layers,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Users,
  KeyRound,
} from "lucide-react";

import { authService, AUTH_ME_KEY, getRoleLabel } from "@/api/auth.api";
import { ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Role-based access",
    description: "Granular permission matrices for every role you create.",
  },
  {
    icon: Users,
    title: "User provisioning",
    description: "Provision accounts with temporary credentials in seconds.",
  },
  {
    icon: KeyRound,
    title: "Secure sessions",
    description: "HttpOnly session cookies with forced password rotation.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: () => authService.signIn(email.trim(), password),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(AUTH_ME_KEY, { user });
      setFormError(null);

      toast.success(`Welcome back, ${user.name.split(" ")[0]}`, {
        description: `Signed in as ${getRoleLabel(user.role)}`,
      });
      router.replace("/dashboard");
    },
    onError: (error) => {
      if (error instanceof ApiRequestError) {
        if (error.code === "INVALID_CREDENTIALS") {
          setFormError("Invalid email or password.");
        } else if (error.code === "LOGIN_RATE_LIMITED") {
          setFormError("Too many attempts. Please try again later.");
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setFormError("Enter your email and password.");
      return;
    }
    setFormError(null);
    loginMutation.mutate();
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Brand panel — visible on large screens */}
      <aside className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between bg-[oklch(0.16_0.02_168)] p-12 text-white">
        {/* Decorations */}
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="animate-drift pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[oklch(0.78_0.17_152/0.18)] blur-3xl" />
        <div className="animate-drift pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-[oklch(0.62_0.10_195/0.15)] blur-3xl [animation-delay:-6s]" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[oklch(0.78_0.17_152)] text-[oklch(0.15_0.035_168)] shadow-[0_0_24px_-4px] shadow-[oklch(0.78_0.17_152/0.6)]">
            <Layers className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            DoodleBlue
          </span>
        </div>

        <div className="relative max-w-md space-y-8">
          <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight xl:text-5xl">
            Manage access
            <br />
            <span className="text-[oklch(0.78_0.17_152)]">with confidence.</span>
          </h1>
          <p className="text-sm leading-relaxed text-white/55">
            A clean admin console for users, roles and permissions — everything
            you need to control who can do what.
          </p>

          <ul className="space-y-5">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <f.icon className="h-4 w-4 text-[oklch(0.78_0.17_152)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-xs leading-relaxed text-white/50">
                    {f.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/35">
          DoodleBlue Admin Console
        </p>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-1 items-center justify-center bg-ambient-mesh px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm animate-fade-up">
          {/* Mobile brand mark */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/30">
              <Layers className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">
              DoodleBlue
            </span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email address
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-11 rounded-lg pl-10 focus-visible:ring-primary/30 focus-visible:border-primary"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loginMutation.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="h-11 rounded-lg pl-10 pr-11 focus-visible:ring-primary/30 focus-visible:border-primary"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loginMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {formError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {formError}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="h-11 w-full bg-primary text-primary-foreground shadow-md shadow-primary/30 hover:bg-primary/90"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Accounts are provisioned by your administrator.
          </p>
        </div>
      </main>
    </div>
  );
}
