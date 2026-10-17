"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Building2,
  CalendarCheck,
  CheckCheck,
  Droplet,
  Eye,
  FileText,
  HeartHandshake,
  Info,
  Loader2,
} from "lucide-react";

import {
  notificationsApi,
  NOTIFICATIONS_KEY,
  NOTIFICATIONS_UNREAD_KEY,
  type AppNotification,
  type NotificationType,
} from "@/api/notifications.api";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const TYPE_ICONS: Record<NotificationType, typeof Droplet> = {
  BLOOD_REQUEST: Droplet,
  DONOR_RESPONSE: HeartHandshake,
  APPOINTMENT: CalendarCheck,
  REQUEST_UPDATE: FileText,
  VERIFICATION: Building2,
  SYSTEM: Info,
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

/** Extract the request id from a notification link like "/notification/<uuid>". */
function requestIdFromLink(link?: string | null) {
  if (!link) return null;
  const match = link.match(
    /\/(?:notification|requests)\/([0-9a-fA-F-]{36})/
  );
  return match?.[1] ?? null;
}

export function NotificationsBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: unread } = useQuery({
    queryKey: NOTIFICATIONS_UNREAD_KEY,
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 30_000,
  });
  const unreadCount = unread?.count ?? 0;

  const { data, isPending } = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => notificationsApi.listMine({ limit: 50 }),
    enabled: open,
  });
  const notifications = data?.data ?? [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_KEY });
  };

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: invalidate,
  });
  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: invalidate,
  });

  const handleView = (n: AppNotification) => {
    if (!n.isRead) markReadMutation.mutate(n.id);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        onClick={() => setOpen(true)}
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          <SheetHeader className="border-b border-border/60 pb-3">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-display text-lg">
                Notifications
              </SheetTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => markAllMutation.mutate()}
                  disabled={markAllMutation.isPending}
                >
                  {markAllMutation.isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Mark all read
                </Button>
              )}
            </div>
            <SheetDescription>
              Blood appeals and updates from your network.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {isPending && (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading notifications…
              </div>
            )}

            {!isPending && notifications.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No notifications yet.
                </p>
              </div>
            )}

            <ul className="divide-y divide-border/50">
              {notifications.map((n) => {
                const Icon = TYPE_ICONS[n.type] ?? Info;
                const requestId = requestIdFromLink(n.link);
                const canView = n.type === "BLOOD_REQUEST" && !!requestId;
                return (
                  <li
                    key={n.id}
                    className={`flex items-start gap-3 px-1 py-3.5 ${
                      n.isRead ? "opacity-70" : ""
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        n.type === "BLOOD_REQUEST"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-snug">
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {n.message}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground/70">
                          {relativeTime(n.createdAt)}
                        </span>
                        {canView && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1.5 px-2 text-xs text-primary"
                            asChild
                          >
                            <Link
                              href={`/notification/${requestId}`}
                              onClick={() => handleView(n)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
