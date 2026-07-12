"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Json } from "@/lib/supabase/types";
import {
  AUDIT_ACTION_BADGE_CLASS,
  AUDIT_ACTION_LABELS_AR,
  AUDIT_ENTITY_LABELS_AR,
} from "@/lib/constants";

export type AuditRow = {
  audit_id: string;
  entity_type: string;
  entity_id: string | null;
  action_type: string;
  changed_at: string;
  changed_by_name: string;
  old_value: Json | null;
  new_value: Json | null;
};

const ALL = "__all__";
const HIDDEN_FIELDS = new Set(["updated_at", "created_at"]);

type Obj = Record<string, unknown>;
function asObj(v: Json | null): Obj {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {};
}
function fmt(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function changedFields(row: AuditRow): { key: string; from: string; to: string }[] {
  const oldO = asObj(row.old_value);
  const newO = asObj(row.new_value);
  if (row.action_type === "INSERT") {
    return Object.keys(newO)
      .filter((k) => !HIDDEN_FIELDS.has(k) && newO[k] !== null && newO[k] !== "")
      .map((k) => ({ key: k, from: "—", to: fmt(newO[k]) }));
  }
  if (row.action_type === "DELETE") {
    return Object.keys(oldO)
      .filter((k) => !HIDDEN_FIELDS.has(k))
      .map((k) => ({ key: k, from: fmt(oldO[k]), to: "—" }));
  }
  const keys = new Set([...Object.keys(oldO), ...Object.keys(newO)]);
  const out: { key: string; from: string; to: string }[] = [];
  for (const k of keys) {
    if (HIDDEN_FIELDS.has(k)) continue;
    if (JSON.stringify(oldO[k]) !== JSON.stringify(newO[k])) {
      out.push({ key: k, from: fmt(oldO[k]), to: fmt(newO[k]) });
    }
  }
  return out;
}

export function AuditClient({ rows }: { rows: AuditRow[] }) {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState(ALL);
  const [actionFilter, setActionFilter] = useState(ALL);
  const [detail, setDetail] = useState<AuditRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (entityFilter !== ALL && r.entity_type !== entityFilter) return false;
      if (actionFilter !== ALL && r.action_type !== actionFilter) return false;
      if (!q) return true;
      return (
        r.changed_by_name.toLowerCase().includes(q) ||
        (r.entity_id ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, search, entityFilter, actionFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">سجل التدقيق</h1>
        <p className="text-sm text-muted-foreground">
          تتبّع كامل للتغييرات على المهام والملاحظات وإجراءات الصيانة
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث بالمستخدم أو المعرّف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>كل الكيانات</SelectItem>
            {Object.entries(AUDIT_ENTITY_LABELS_AR).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>كل الإجراءات</SelectItem>
            {Object.entries(AUDIT_ACTION_LABELS_AR).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} سجل</span>
      </div>

      <div className="overflow-hidden rounded-3xl border-0 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الوقت</TableHead>
                <TableHead>الكيان</TableHead>
                <TableHead>الإجراء</TableHead>
                <TableHead>المستخدم</TableHead>
                <TableHead>المعرّف</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    لا توجد سجلات
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.audit_id}>
                    <TableCell className="whitespace-nowrap font-mono text-xs" dir="ltr">
                      {new Date(r.changed_at).toLocaleString("en-GB")}
                    </TableCell>
                    <TableCell>
                      {AUDIT_ENTITY_LABELS_AR[r.entity_type] ?? r.entity_type}
                    </TableCell>
                    <TableCell>
                      <Badge className={AUDIT_ACTION_BADGE_CLASS[r.action_type] ?? ""}>
                        {AUDIT_ACTION_LABELS_AR[r.action_type] ?? r.action_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{r.changed_by_name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground" dir="ltr">
                      {r.entity_id?.slice(0, 8) ?? "—"}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => setDetail(r)}
                        className="text-sm text-primary hover:underline"
                      >
                        تفاصيل
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {detail ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {AUDIT_ACTION_LABELS_AR[detail.action_type] ?? detail.action_type} ·{" "}
                  {AUDIT_ENTITY_LABELS_AR[detail.entity_type] ?? detail.entity_type}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{detail.changed_by_name}</span>
                  <span className="font-mono" dir="ltr">
                    {new Date(detail.changed_at).toLocaleString("en-GB")}
                  </span>
                </div>
                <div className="overflow-x-auto rounded-2xl border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الحقل</TableHead>
                        <TableHead>قبل</TableHead>
                        <TableHead>بعد</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {changedFields(detail).map((f) => (
                        <TableRow key={f.key}>
                          <TableCell className="font-mono text-xs" dir="ltr">
                            {f.key}
                          </TableCell>
                          <TableCell className="max-w-40 truncate text-muted-foreground" dir="auto">
                            {f.from}
                          </TableCell>
                          <TableCell className="max-w-40 truncate font-medium" dir="auto">
                            {f.to}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
