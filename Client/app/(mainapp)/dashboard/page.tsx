"use client";

import Link from "next/link";
import {
  Users,
  ShieldCheck,
  UserCheck,
  KeyRound,
  ArrowRight,
  UserPlus,
  ShieldPlus,
  Loader2,
} from "lucide-react";

import { useAuthUser } from "@/lib/use-auth-user";
import { useUsers } from "../users/_hooks/use-users";
import { useRoles } from "../roles/_hooks/use-roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { initials } from "../_components/console-utils";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuthUser();
  const { data: usersData, isPending: usersPending } = useUsers();
  const { data: rolesData, isPending: rolesPending } = useRoles();

  const users = usersData?.data ?? [];
  const roles = rolesData?.data ?? [];
  const isPending = usersPending || rolesPending;

  const activeUsers = users.filter((u) => u.isActive).length;
  const pendingResets = users.filter((u) => u.mustChangePassword).length;
  const recentUsers = [...users]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5);

  const stats = [
    {
      label: "Total users",
      value: usersData?.meta?.total ?? users.length,
      icon: Users,
      tint: "bg-primary/10 text-primary",
    },
    {
      label: "Active accounts",
      value: activeUsers,
      icon: UserCheck,
      tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Roles",
      value: rolesData?.meta?.total ?? roles.length,
      icon: ShieldCheck,
      tint: "bg-tertiary/15 text-tertiary",
    },
    {
      label: "Pending resets",
      value: pendingResets,
      icon: KeyRound,
      tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
  ];

  const firstName = user?.name.split(" ")[0] ?? "there";

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting */}
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}{" "}
          — here&apos;s what&apos;s happening across your workspace.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => (
          <Card
            key={stat.label}
            className="animate-fade-up border-border/80"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${stat.tint}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-2xl font-bold leading-none tracking-tight">
                  {isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    stat.value
                  )}
                </p>
                <p className="mt-1.5 text-xs font-medium text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent users */}
        <Card className="animate-fade-up border-border/80 lg:col-span-2" style={{ animationDelay: "240ms" }}>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="font-display text-base">Recent users</CardTitle>
            <Link
              href="/users"
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {usersPending ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading users…
              </div>
            ) : recentUsers.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No users yet.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {recentUsers.map((u) => (
                  <li key={u.id} className="flex items-center gap-3 py-3">
                    {u.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={u.image}
                        alt={u.name}
                        className="h-9 w-9 shrink-0 rounded-lg border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                        {initials(u.name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {u.email}
                      </p>
                    </div>
                    <Badge variant={u.isActive ? "success" : "secondary"}>
                      {u.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <span className="hidden text-xs text-muted-foreground sm:block">
                      {u.role}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="animate-fade-up border-border/80" style={{ animationDelay: "300ms" }}>
          <CardHeader className="pb-4">
            <CardTitle className="font-display text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <Link
              href="/users/create"
              className="group flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 transition-all hover:border-primary/40 hover:bg-accent"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserPlus className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Provision user</p>
                <p className="text-xs text-muted-foreground">
                  Create an account &amp; email credentials
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
            <Link
              href="/roles/create"
              className="group flex items-center gap-3 rounded-lg border border-border/80 bg-card p-3.5 transition-all hover:border-primary/40 hover:bg-accent"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-tertiary/15 text-tertiary">
                <ShieldPlus className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Create role</p>
                <p className="text-xs text-muted-foreground">
                  Define a new permission matrix
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
