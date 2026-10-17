"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Droplet,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  HeartHandshake,
  ShieldCheck,
  UserCheck,
  Upload,
  X,
} from "lucide-react";

import { authService, AUTH_ME_KEY } from "@/api/auth.api";
import { ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FEATURES = [
  {
    icon: HeartHandshake,
    title: "Join the donor network",
    description: "Create your account and become part of the community.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by default",
    description: "Your credentials are hashed and sessions stay private.",
  },
  {
    icon: UserCheck,
    title: "Grow your access",
    description: "Admins can promote your account to richer roles later.",
  },
];

export default function SignupPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [roleId, setRoleId] = useState("");
  const [image, setImage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Roles flagged for self-signup — empty list falls back to the fixed USER role.
  const { data: signupRoles, isPending: rolesPending } = useQuery({
    queryKey: ["auth", "signup-roles"],
    queryFn: () => authService.signupRoles(),
    staleTime: 60_000,
  });
  const roles = signupRoles ?? [];

  // Auto-select Blood Donar role by default once roles load (render-time adjust).
  const [prevRoles, setPrevRoles] = useState(roles);
  if (roles !== prevRoles) {
    setPrevRoles(roles);
    if (!roleId && roles.length > 0) {
      const donorRole = roles.find(
        (r) =>
          r.name.toLowerCase().includes("dona") ||
          r.name.toLowerCase().includes("donor")
      );
      if (donorRole) {
        setRoleId(donorRole.id);
      }
    }
  }

  const signupMutation = useMutation({
    mutationFn: () =>
      authService.signUp(name.trim(), email.trim(), password, {
        roleId: roleId || undefined,
        image: image || undefined,
      }),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(AUTH_ME_KEY, { user });
      setFormError(null);

      toast.success(`Welcome, ${user.name.split(" ")[0]}`, {
        description: "Your account is ready.",
      });

      const roleLower = (user.role || "").toLowerCase();
      if (roleLower.includes("bank")) {
        router.replace("/onboarding/blood-bank");
      } else if (roleLower.includes("dona") || roleLower.includes("donor")) {
        router.replace("/onboarding/donor");
      } else {
        router.replace("/dashboard");
      }
    },
    onError: (error) => {
      if (error instanceof ApiRequestError) {
        if (error.code === "EMAIL_IN_USE") {
          setFormError("An account with this email already exists.");
        } else if (error.code === "RATE_LIMITED") {
          setFormError("Too many attempts. Please try again later.");
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please select a valid image file (JPEG, PNG, WEBP, GIF).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Image must be smaller than 5MB.");
      return;
    }

    try {
      setIsUploadingImage(true);
      setFormError(null);
      const res = await authService.uploadSignupAvatar(file);
      setImage(res.url);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to upload image"
      );
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isBusy = signupMutation.isPending || isUploadingImage;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setFormError("Fill in all fields.");
      return;
    }
    if (!roleId && roles.length > 0) {
      setFormError("Please select a role. Role selection is mandatory.");
      return;
    }
    if (password.length < 10) {
      setFormError("Password must be at least 10 characters.");
      return;
    }
    if (password !== confirm) {
      setFormError("Passwords don't match.");
      return;
    }
    setFormError(null);
    signupMutation.mutate();
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Brand panel — visible on large screens */}
      <aside className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between bg-[oklch(0.17_0.035_20)] p-12 text-white">
        {/* Decorations */}
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="animate-drift pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[oklch(0.70_0.21_25/0.22)] blur-3xl" />
        <div className="animate-drift pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-[oklch(0.75_0.14_65/0.14)] blur-3xl [animation-delay:-6s]" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[oklch(0.68_0.22_25)] text-white shadow-[0_0_24px_-4px] shadow-[oklch(0.68_0.22_25/0.6)]">
            <Droplet className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            DoodleBlue
          </span>
        </div>

        <div className="relative max-w-md space-y-8">
          <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight xl:text-5xl">
            Give the gift
            <br />
            <span className="text-[oklch(0.78_0.19_25)]">of life.</span>
          </h1>
          <p className="text-sm leading-relaxed text-white/55">
            Create your account to join the blood donation platform — it takes
            less than a minute.
          </p>

          <ul className="space-y-5">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex items-start gap-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <f.icon className="h-4 w-4 text-[oklch(0.75_0.20_25)]" />
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
              <Droplet className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">
              DoodleBlue
            </span>
          </div>

          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold tracking-tight">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign up to get started — it&apos;s free
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Full name
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  className="h-11 rounded-lg pl-10 focus-visible:ring-primary/30 focus-visible:border-primary"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={signupMutation.isPending}
                />
              </div>
            </div>

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
                  disabled={signupMutation.isPending}
                />
              </div>
            </div>

            {roles.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="role" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Select Your Role <span className="text-primary font-bold">*</span>
                </Label>
                <Select
                  value={roleId}
                  onValueChange={setRoleId}
                  disabled={rolesPending || isBusy}
                >
                  <SelectTrigger id="role" className="h-11 w-full rounded-lg">
                    <SelectValue placeholder="Choose a role (Mandatory)" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Minimum 10 characters"
                  className="h-11 rounded-lg pl-10 pr-11 focus-visible:ring-primary/30 focus-visible:border-primary"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={signupMutation.isPending}
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

            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Confirm password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  className="h-11 rounded-lg pl-10 focus-visible:ring-primary/30 focus-visible:border-primary"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={signupMutation.isPending}
                />
              </div>
            </div>

            {/* Profile photo (optional) */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Profile photo{" "}
                <span className="font-normal normal-case">(optional)</span>
              </Label>
              <div className="flex items-center gap-3">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border/80 bg-muted shadow-sm">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt="Avatar preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-semibold text-muted-foreground">
                      {name ? name.charAt(0).toUpperCase() : "?"}
                    </span>
                  )}
                  {image && (
                    <button
                      type="button"
                      onClick={() => setImage("")}
                      disabled={isBusy}
                      className="absolute right-0 top-0 rounded-full bg-background/90 p-0.5 text-foreground shadow transition-colors hover:bg-destructive hover:text-destructive-foreground"
                      title="Remove photo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isBusy}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 rounded-lg text-xs"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isBusy}
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {isUploadingImage ? "Uploading…" : "Upload photo"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG, WEBP or GIF (max 5MB)
                  </p>
                </div>
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
              disabled={isBusy}
            >
              {signupMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
