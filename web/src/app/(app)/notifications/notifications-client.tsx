"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, CheckCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { NOTIF_PRIORITY_DOT, NOTIF_TYPE_LABELS_AR } from "@/lib/constants";

type Notif = Tables<"notifications">;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  return `منذ ${days} يوم`;
}

export function NotificationsClient({
  initial,
  canEscalate,
}: {
  initial: Notif[];
  canEscalate: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Notif[]>(initial);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [busy, setBusy] = useState(false);

  const unreadCount = useMemo(() => items.filter((n) => !n.is_read).length, [items]);
  const shown = tab === "unread" ? items.filter((n) => !n.is_read) : items;

  async function open(n: Notif) {
    if (!n.is_read) {
      setItems((cur) =>
        cur.map((x) => (x.notification_id === n.notification_id ? { ...x, is_read: true } : x))
      );
      const supabase = createClient();
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("notification_id", n.notification_id);
      router.refresh();
    }
    if (n.link) router.push(n.link);
  }

  async function markAll() {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("is_read", false);
    setBusy(false);
    if (error) {
      toast.error("حدث خطأ");
      return;
    }
    setItems((cur) => cur.map((x) => ({ ...x, is_read: true })));
    toast.success("تم تعليم الكل كمقروء");
    router.refresh();
  }

  async function escalate() {
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("run_escalations");
    setBusy(false);
    if (error) {
      toast.error("فشل فحص التنبيهات: " + error.message);
      return;
    }
    toast.success(
      data && data > 0 ? `تم إنشاء ${data} تنبيه جديد` : "لا توجد تنبيهات جديدة"
    );
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">مركز الإشعارات</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : "لا إشعارات غير مقروءة"}
          </p>
        </div>
        <div className="flex gap-2">
          {canEscalate ? (
            <Button variant="outline" onClick={escalate} disabled={busy} className="rounded-xl">
              <RefreshCw className={cn("size-4", busy && "animate-spin")} />
              فحص التنبيهات
            </Button>
          ) : null}
          <Button
            onClick={markAll}
            disabled={busy || unreadCount === 0}
            className="rounded-xl"
          >
            <CheckCheck className="size-4" />
            تعليم الكل كمقروء
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "unread")}>
        <TabsList className="rounded-2xl">
          <TabsTrigger value="all" className="rounded-xl">
            الكل ({items.length})
          </TabsTrigger>
          <TabsTrigger value="unread" className="rounded-xl">
            غير المقروءة ({unreadCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {shown.length === 0 ? (
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <BellRing className="size-10 opacity-40" />
            <p>لا توجد إشعارات</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {shown.map((n) => (
            <button
              key={n.notification_id}
              onClick={() => open(n)}
              className={cn(
                "flex items-start gap-3 rounded-2xl border-0 bg-card p-4 text-right shadow-sm transition-shadow hover:shadow-md",
                !n.is_read && "ring-2 ring-primary/20"
              )}
            >
              <span
                className={cn(
                  "mt-1.5 size-2.5 shrink-0 rounded-full",
                  NOTIF_PRIORITY_DOT[n.priority] ?? "bg-slate-400"
                )}
              />
              <div className="flex flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{n.title}</span>
                  {!n.is_read ? (
                    <span className="size-2 rounded-full bg-brand-pink" />
                  ) : null}
                </div>
                {n.body ? (
                  <span className="text-sm text-muted-foreground">{n.body}</span>
                ) : null}
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-0.5">
                    {NOTIF_TYPE_LABELS_AR[n.notif_type] ?? n.notif_type}
                  </span>
                  <span>{timeAgo(n.created_at)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
