"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, CheckCircle2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { Enums, Tables } from "@/lib/supabase/types";
import { Constants } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import {
  ACTION_STATUS_BADGE_CLASS,
  ACTION_STATUS_LABELS_AR,
  ACTION_TYPE_LABELS_AR,
  PRIORITY_BADGE_CLASS,
  PRIORITY_LABELS_AR,
} from "@/lib/constants";

type ActionRow = Tables<"maintenance_actions"> & {
  inspection_findings: {
    finding_code: string;
    finding_title: string;
    severity: Enums<"priority_level">;
    equipment: { equipment_name: string } | null;
    equipment_parts: { part_name: string } | null;
  } | null;
  responsible: { full_name: string } | null;
  verifier: { full_name: string } | null;
};

const ALL = "__all__";

// forward-only workflow transitions
const NEXT_STATUS: Partial<Record<Enums<"action_status">, Enums<"action_status">[]>> = {
  Open: ["Planned", "In Progress", "Waiting Shutdown", "Cancelled"],
  Planned: ["In Progress", "Waiting Shutdown", "Cancelled"],
  "In Progress": ["Waiting Shutdown", "Completed", "Cancelled"],
  "Waiting Shutdown": ["In Progress", "Completed", "Cancelled"],
};

export function ActionsClient({
  initialActions,
  canManage,
}: {
  initialActions: ActionRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [completing, setCompleting] = useState<ActionRow | null>(null);

  const isOverdue = (a: ActionRow) =>
    a.target_date &&
    !["Completed", "Verified", "Cancelled"].includes(a.status) &&
    a.target_date < new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialActions.filter((a) => {
      if (statusFilter !== ALL && a.status !== statusFilter) return false;
      if (!q) return true;
      return (
        a.action_code.toLowerCase().includes(q) ||
        a.action_title.toLowerCase().includes(q) ||
        (a.inspection_findings?.finding_code ?? "").toLowerCase().includes(q) ||
        (a.inspection_findings?.equipment?.equipment_name ?? "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [initialActions, search, statusFilter]);

  async function setStatus(action: ActionRow, status: Enums<"action_status">) {
    const supabase = createClient();
    const { error } = await supabase
      .from("maintenance_actions")
      .update({ status })
      .eq("action_id", action.action_id);
    if (error) {
      toast.error("فشل تحديث الحالة");
      return;
    }
    toast.success("تم تحديث حالة الإجراء");
    router.refresh();
  }

  async function verify(action: ActionRow) {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("maintenance_actions")
      .update({
        status: "Verified",
        verified_by: userData.user?.id ?? null,
        verified_at: new Date().toISOString(),
      })
      .eq("action_id", action.action_id);
    if (error) {
      toast.error("فشل التحقق");
      return;
    }
    toast.success("تم التحقق من الإجراء");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">إجراءات الصيانة</h1>
        <p className="text-sm text-muted-foreground">
          الإجراءات المتولدة من ملاحظات الفحص ومتابعة تنفيذها حتى التحقق
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>كل الحالات</SelectItem>
            {Constants.public.Enums.action_status.map((s) => (
              <SelectItem key={s} value={s}>
                {ACTION_STATUS_LABELS_AR[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} إجراء</span>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <Card className="rounded-3xl border-0 shadow-sm">
            <CardContent className="py-10 text-center text-muted-foreground">
              لا توجد إجراءات — تُنشأ الإجراءات من صفحة الملاحظات
            </CardContent>
          </Card>
        ) : (
          filtered.map((a) => (
            <Card
              key={a.action_id}
              className={cn(
                "rounded-3xl border-0 shadow-sm",
                isOverdue(a) && "ring-1 ring-red-300 dark:ring-red-800"
              )}
            >
              <CardContent className="flex flex-col gap-3 pt-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{a.action_title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {a.inspection_findings?.equipment?.equipment_name}
                      {" · "}
                      {a.inspection_findings?.equipment_parts?.part_name}
                      {" · من الملاحظة "}
                      <span className="font-mono text-xs" dir="ltr">
                        {a.inspection_findings?.finding_code}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="font-mono" dir="ltr">
                      {a.action_code}
                    </Badge>
                    <Badge variant="secondary">{ACTION_TYPE_LABELS_AR[a.action_type]}</Badge>
                    <Badge className={PRIORITY_BADGE_CLASS[a.priority]}>
                      {PRIORITY_LABELS_AR[a.priority]}
                    </Badge>
                    <Badge className={ACTION_STATUS_BADGE_CLASS[a.status]}>
                      {ACTION_STATUS_LABELS_AR[a.status]}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  {a.responsible_department ? <span>القسم: {a.responsible_department}</span> : null}
                  {a.responsible ? <span>المسؤول: {a.responsible.full_name}</span> : null}
                  {a.target_date ? (
                    <span className={cn(isOverdue(a) && "font-bold text-red-600 dark:text-red-400")}>
                      الاستهداف: <span className="font-mono" dir="ltr">{a.target_date}</span>
                      {isOverdue(a) ? " (متأخر)" : ""}
                    </span>
                  ) : null}
                  {a.verification_required ? <span>يتطلب تحقق</span> : null}
                  {a.verifier ? <span>تحقق بواسطة: {a.verifier.full_name}</span> : null}
                </div>

                {a.completion_note ? (
                  <p className="text-sm">
                    <span className="font-medium">ملاحظة الإكمال: </span>
                    <span className="text-muted-foreground" dir="auto">
                      {a.completion_note}
                    </span>
                  </p>
                ) : null}

                {canManage &&
                !["Verified", "Cancelled"].includes(a.status) ? (
                  <div className="flex flex-wrap gap-2 border-t pt-3">
                    {(NEXT_STATUS[a.status] ?? [])
                      .filter((s) => s !== "Completed")
                      .map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => setStatus(a, s)}
                        >
                          {ACTION_STATUS_LABELS_AR[s]}
                        </Button>
                      ))}
                    {(NEXT_STATUS[a.status] ?? []).includes("Completed") ? (
                      <Button
                        size="sm"
                        className="rounded-xl"
                        onClick={() => setCompleting(a)}
                      >
                        <CheckCircle2 className="size-3.5" />
                        إكمال
                      </Button>
                    ) : null}
                    {a.status === "Completed" ? (
                      <Button size="sm" className="rounded-xl" onClick={() => verify(a)}>
                        <BadgeCheck className="size-3.5" />
                        تحقق وإقفال
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CompleteActionDialog
        action={completing}
        onClose={() => setCompleting(null)}
      />
    </div>
  );
}

function CompleteActionDialog({
  action,
  onClose,
}: {
  action: ActionRow | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!action) return;
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("maintenance_actions")
      .update({
        status: "Completed",
        completion_note: note.trim() || null,
        completion_date: new Date().toISOString(),
      })
      .eq("action_id", action.action_id);
    setSubmitting(false);
    if (error) {
      toast.error("فشل إكمال الإجراء");
      return;
    }
    toast.success("تم إكمال الإجراء");
    setNote("");
    onClose();
    router.refresh();
  }

  return (
    <Dialog open={!!action} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إكمال الإجراء {action?.action_code}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>ملاحظة الإكمال</Label>
            <Textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ما الذي تم عمله؟"
            />
          </div>
          <DialogFooter>
            <Button onClick={submit} disabled={submitting}>
              تأكيد الإكمال
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
