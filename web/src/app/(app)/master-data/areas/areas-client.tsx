"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { MoreHorizontal, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

type Area = Tables<"areas">;

const areaSchema = z.object({
  area_code: z.string().min(1, "الكود مطلوب").max(50),
  area_name: z.string().min(1, "الاسم مطلوب").max(200),
  description: z.string().max(2000).optional(),
});

type AreaFormValues = z.infer<typeof areaSchema>;

export function AreasClient({
  initialAreas,
  canWrite,
}: {
  initialAreas: Area[];
  canWrite: boolean;
}) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Area | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return initialAreas;
    return initialAreas.filter(
      (a) =>
        a.area_code.toLowerCase().includes(q) ||
        a.area_name.toLowerCase().includes(q)
    );
  }, [initialAreas, search]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(area: Area) {
    setEditing(area);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">المناطق</h1>
          <p className="text-sm text-muted-foreground">
            المستوى الأول من هيكل الأصول
          </p>
        </div>
        {canWrite ? (
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            منطقة جديدة
          </Button>
        ) : null}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="بحث بالكود أو الاسم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border-0 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الكود</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>الوصف</TableHead>
              <TableHead>الحالة</TableHead>
              {canWrite ? <TableHead className="w-10" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canWrite ? 5 : 4}
                  className="py-10 text-center text-muted-foreground"
                >
                  لا توجد مناطق
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((area) => (
                <TableRow key={area.area_id}>
                  <TableCell className="font-mono text-sm">{area.area_code}</TableCell>
                  <TableCell className="font-medium">{area.area_name}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {area.description || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={area.active ? "default" : "secondary"}>
                      {area.active ? "نشط" : "غير نشط"}
                    </Badge>
                  </TableCell>
                  {canWrite ? (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(area)}>
                            تعديل
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {canWrite ? (
        <AreaFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          area={editing}
        />
      ) : null}
    </div>
  );
}

function AreaFormDialog({
  open,
  onOpenChange,
  area,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  area: Area | null;
}) {
  const router = useRouter();
  const isEdit = !!area;

  const form = useForm<AreaFormValues>({
    resolver: zodResolver(areaSchema),
    values: {
      area_code: area?.area_code ?? "",
      area_name: area?.area_name ?? "",
      description: area?.description ?? "",
    },
  });

  const [active, setActive] = useState(area?.active ?? true);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(values: AreaFormValues) {
    setSubmitting(true);
    const supabase = createClient();

    const payload = {
      area_code: values.area_code,
      area_name: values.area_name,
      description: values.description || null,
      active,
    };

    const { error } = isEdit
      ? await supabase.from("areas").update(payload).eq("area_id", area!.area_id)
      : await supabase.from("areas").insert(payload);

    setSubmitting(false);

    if (error) {
      toast.error(
        error.code === "23505" ? "كود المنطقة مستخدم بالفعل" : "حدث خطأ، حاول مرة أخرى"
      );
      return;
    }

    toast.success(isEdit ? "تم تحديث المنطقة" : "تم إنشاء المنطقة");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          form.reset();
          setActive(true);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل المنطقة" : "منطقة جديدة"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="area_code">الكود</Label>
            <Input id="area_code" dir="ltr" {...form.register("area_code")} />
            {form.formState.errors.area_code ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.area_code.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="area_name">الاسم</Label>
            <Input id="area_name" {...form.register("area_name")} />
            {form.formState.errors.area_name ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.area_name.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea id="description" rows={3} {...form.register("description")} />
          </div>
          {isEdit ? (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="active">نشط</Label>
              <Switch id="active" checked={active} onCheckedChange={setActive} />
            </div>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {isEdit ? "حفظ التغييرات" : "إنشاء"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
