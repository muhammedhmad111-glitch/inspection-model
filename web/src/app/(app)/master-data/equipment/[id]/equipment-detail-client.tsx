"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { ArrowRight, MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Constants, type Tables } from "@/lib/supabase/types";
import {
  CRITICALITY_BADGE_CLASS,
  CRITICALITY_LABELS_AR,
  STATUS_BADGE_CLASS,
  STATUS_LABELS_AR,
} from "@/lib/constants";

type Part = Tables<"equipment_parts">;
type EquipmentWithSection = Tables<"equipment"> & {
  sections: (Tables<"sections"> & { areas: Tables<"areas"> | null }) | null;
};

const partSchema = z.object({
  part_code: z.string().min(1, "الكود مطلوب").max(50),
  part_name: z.string().min(1, "الاسم مطلوب").max(200),
  part_group: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  criticality: z.enum(Constants.public.Enums.equipment_criticality),
  inspectable: z.boolean(),
});

type PartFormValues = z.infer<typeof partSchema>;

export function EquipmentDetailClient({
  equipment,
  initialParts,
  canWrite,
}: {
  equipment: EquipmentWithSection;
  initialParts: Part[];
  canWrite: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Part | null>(null);

  const infoFields: { label: string; value: string }[] = [
    { label: "القسم", value: equipment.sections?.section_name ?? "—" },
    { label: "المنطقة", value: equipment.sections?.areas?.area_name ?? "—" },
    { label: "النوع", value: equipment.equipment_type ?? "—" },
    { label: "الموقع الوظيفي", value: equipment.functional_location ?? "—" },
    { label: "الشركة المصنعة", value: equipment.manufacturer ?? "—" },
    { label: "الموديل", value: equipment.model ?? "—" },
    { label: "الرقم التسلسلي", value: equipment.serial_number ?? "—" },
    {
      label: "تاريخ التركيب",
      value: equipment.installation_date ?? "—",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/master-data/equipment"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="size-4" />
        رجوع إلى المعدات
      </Link>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{equipment.equipment_name}</CardTitle>
              <p className="font-mono text-sm text-muted-foreground">
                {equipment.equipment_code}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={CRITICALITY_BADGE_CLASS[equipment.criticality]}>
                {CRITICALITY_LABELS_AR[equipment.criticality]}
              </Badge>
              <Badge className={STATUS_BADGE_CLASS[equipment.status]}>
                {STATUS_LABELS_AR[equipment.status]}
              </Badge>
              <Badge variant={equipment.active ? "default" : "secondary"}>
                {equipment.active ? "نشط" : "غير نشط"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
            {infoFields.map((f) => (
              <div key={f.label}>
                <div className="text-xs text-muted-foreground">{f.label}</div>
                <div className="text-sm font-medium">{f.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">أجزاء المعدة</h2>
        {canWrite ? (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            جزء جديد
          </Button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-3xl border-0 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الكود</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>المجموعة</TableHead>
              <TableHead>الأهمية</TableHead>
              <TableHead>قابل للفحص</TableHead>
              <TableHead>نشط</TableHead>
              {canWrite ? <TableHead className="w-10" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialParts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canWrite ? 7 : 6} className="py-10 text-center text-muted-foreground">
                  لا توجد أجزاء مسجلة لهذه المعدة
                </TableCell>
              </TableRow>
            ) : (
              initialParts.map((part) => (
                <TableRow key={part.equipment_part_id}>
                  <TableCell className="font-mono text-sm">{part.part_code}</TableCell>
                  <TableCell className="font-medium">{part.part_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {part.part_group || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={CRITICALITY_BADGE_CLASS[part.criticality]}>
                      {CRITICALITY_LABELS_AR[part.criticality]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={part.inspectable ? "default" : "secondary"}>
                      {part.inspectable ? "نعم" : "لا"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={part.active ? "default" : "secondary"}>
                      {part.active ? "نشط" : "غير نشط"}
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
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(part);
                              setDialogOpen(true);
                            }}
                          >
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
        <PartFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          part={editing}
          equipmentId={equipment.equipment_id}
        />
      ) : null}
    </div>
  );
}

function PartFormDialog({
  open,
  onOpenChange,
  part,
  equipmentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: Part | null;
  equipmentId: string;
}) {
  const router = useRouter();
  const isEdit = !!part;

  const form = useForm<PartFormValues>({
    resolver: zodResolver(partSchema),
    values: {
      part_code: part?.part_code ?? "",
      part_name: part?.part_name ?? "",
      part_group: part?.part_group ?? "",
      description: part?.description ?? "",
      criticality: part?.criticality ?? "Medium",
      inspectable: part?.inspectable ?? true,
    },
  });

  const [active, setActive] = useState(part?.active ?? true);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(values: PartFormValues) {
    setSubmitting(true);
    const supabase = createClient();

    const payload = {
      equipment_id: equipmentId,
      part_code: values.part_code,
      part_name: values.part_name,
      part_group: values.part_group || null,
      description: values.description || null,
      criticality: values.criticality,
      inspectable: values.inspectable,
      active,
    };

    const { error } = isEdit
      ? await supabase
          .from("equipment_parts")
          .update(payload)
          .eq("equipment_part_id", part!.equipment_part_id)
      : await supabase.from("equipment_parts").insert(payload);

    setSubmitting(false);

    if (error) {
      toast.error(
        error.code === "23505" ? "كود الجزء مستخدم بالفعل لهذه المعدة" : "حدث خطأ، حاول مرة أخرى"
      );
      return;
    }

    toast.success(isEdit ? "تم تحديث الجزء" : "تم إنشاء الجزء");
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
          <DialogTitle>{isEdit ? "تعديل الجزء" : "جزء جديد"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="part_code">الكود</Label>
              <Input id="part_code" dir="ltr" {...form.register("part_code")} />
              {form.formState.errors.part_code ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.part_code.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="part_group">المجموعة</Label>
              <Input id="part_group" {...form.register("part_group")} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="part_name">الاسم</Label>
            <Input id="part_name" {...form.register("part_name")} />
            {form.formState.errors.part_name ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.part_name.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea id="description" rows={2} {...form.register("description")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>الأهمية</Label>
            <Controller
              control={form.control}
              name="criticality"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Constants.public.Enums.equipment_criticality.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CRITICALITY_LABELS_AR[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="inspectable">قابل للفحص</Label>
            <Controller
              control={form.control}
              name="inspectable"
              render={({ field }) => (
                <Switch
                  id="inspectable"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
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
