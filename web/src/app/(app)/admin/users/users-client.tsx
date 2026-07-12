"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/lib/supabase/types";
import { ASSIGNABLE_ROLES, ROLE_LABELS_AR } from "@/lib/constants";

type User = {
  id: string;
  full_name: string;
  role: Enums<"app_user_role">;
  active: boolean;
  created_at: string;
};

export function UsersClient({
  initialUsers,
  currentUserId,
}: {
  initialUsers: User[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        ROLE_LABELS_AR[u.role].includes(q)
    );
  }, [users, search]);

  async function changeRole(user: User, role: Enums<"app_user_role">) {
    setBusy(user.id);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ role }).eq("id", user.id);
    setBusy(null);
    if (error) {
      toast.error("فشل تحديث الدور");
      return;
    }
    setUsers((cur) => cur.map((u) => (u.id === user.id ? { ...u, role } : u)));
    toast.success("تم تحديث الدور");
    router.refresh();
  }

  async function toggleActive(user: User, active: boolean) {
    setBusy(user.id);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ active }).eq("id", user.id);
    setBusy(null);
    if (error) {
      toast.error("فشل تحديث الحالة");
      return;
    }
    setUsers((cur) => cur.map((u) => (u.id === user.id ? { ...u, active } : u)));
    toast.success(active ? "تم تفعيل المستخدم" : "تم تعطيل المستخدم");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">المستخدمون والأدوار</h1>
        <p className="text-sm text-muted-foreground">
          إدارة أدوار المستخدمين وصلاحياتهم — {users.length} مستخدم
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="بحث بالاسم أو الدور..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border-0 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستخدم</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>نشط</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {u.full_name.trim().charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{u.full_name}</div>
                          {isSelf ? (
                            <div className="text-xs text-muted-foreground">أنت</div>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(v) => changeRole(u, v as Enums<"app_user_role">)}
                        disabled={busy === u.id || isSelf}
                      >
                        <SelectTrigger className="w-44">
                          <SelectValue placeholder="اختر دورًا" />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSIGNABLE_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABELS_AR[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {u.role === "Pending" ? (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          بانتظار الموافقة
                        </Badge>
                      ) : (
                        <Badge variant={u.active ? "default" : "secondary"}>
                          {u.active ? "نشط" : "معطّل"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={u.active}
                        disabled={busy === u.id || isSelf}
                        onCheckedChange={(v) => toggleActive(u, v)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        ملاحظة: إضافة مستخدم جديد تتم عبر دعوة من لوحة Supabase Auth، ثم يظهر هنا لإسناد الدور.
      </p>
    </div>
  );
}
