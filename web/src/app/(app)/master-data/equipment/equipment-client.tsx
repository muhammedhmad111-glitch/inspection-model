"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { ChevronLeft, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { createClient } from "@/lib/supabase/client";
import type { Enums, Tables } from "@/lib/supabase/types";
import {
  CRITICALITY_BADGE_CLASS,
  CRITICALITY_LABELS_AR,
  STATUS_BADGE_CLASS,
  STATUS_LABELS_AR,
} from "@/lib/constants";
import { Constants } from "@/lib/supabase/types";

type Equipment = Tables<"equipment">;
type Section = Tables<"sections">;
type Area = Tables<"areas">;

const equipmentSchema = z.object({
  section_id: z.string().uuid("اختر قسمًا"),
  equipment_code: z.string().min(1, "الكود مطلوب").max(50),
  equipment_name: z.string().min(1, "الاسم مطلوب").max(200),
  functional_location: z.string().max(200).optional(),
  equipment_type: z.string().max(200).optional(),
  manufacturer: z.string().max(200).optional(),
  model: z.string().max(200).optional(),
  serial_number: z.string().max(200).optional(),
  criticality: z.enum(Constants.public.Enums.equipment_criticality),
  status: z.enum(Constants.public.Enums.equipment_status),
  installation_date: z.string().optional(),
});

type EquipmentFormValues = z.infer<typeof equipmentSchema>;

export function EquipmentClient({
  initialEquipment,
  sections,
  areas,
  canWrite,
}: {
  initialEquipment: Equipment[];
  sections: Section[];
  areas: Area[];
  canWrite: boolean;
}) {
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [criticalityFilter, setCriticalityFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);

  const sectionById = useMemo(
    () => new Map(sections.map((s) => [s.section_id, s])),
    [sections]
  );
  const areaById = useMemo(() => new Map(areas.map((a) => [a.area_id, a])), [areas]);

  const availableSections = useMemo(
    () =>
      areaFilter === "all"
        ? sections
        : sections.filter((s) => s.area_id === areaFilter),
    [sections, areaFilter]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialEquipment.filter((eq) => {
      const section = sectionById.get(eq.section_id);
      if (areaFilter !== "all" && section?.area_id !== areaFilter) return false;
      if (sectionFilter !== "all" && eq.section_id !== sectionFilter) return false;
      if (criticalityFilter !== "all" && eq.criticality !== criticalityFilter)
        return false;
      if (!q) return true;
      return (
        eq.equipment_code.toLowerCase().includes(q) ||
        eq.equipment_name.toLowerCase().includes(q) ||
        (eq.equipment_type ?? "").toLowerCase().includes(q)
      );
    });
  }, [initialEquipment, search, areaFilter, sectionFilter, criticalityFilter, sectionById]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(eq: Equipment) {
    setEditing(eq);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">المعدات</h1>
          <p className="text-sm text-muted-foreground">
            كل معدات المصنع مع بيانات الموقع والحرجية والحالة
          </p>
        </div>
        {canWrite ? (
          <Button onClick={openCreate} disabled={sections.length === 0}>
            <Plus className="size-4" />
            معدة جديدة
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث بالكود أو الاسم أو النوع..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select
          value={areaFilter}
          onValueChange={(v) => {
            setAreaFilter(v);
            setSectionFilter("all");
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="كل المناطق" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المناطق</SelectItem>
            {areas.map((a) => (
              <SelectItem key={a.area_id} value={a.area_id}>
                {a.area_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sectionFilter} onValueChange={setSectionFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="كل الأقسام" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأقسام</SelectItem>
            {availableSections.map((s) => (
              <SelectItem key={s.section_id} value={s.section_id}>
                {s.section_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={criticalityFilter} onValueChange={setCriticalityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="كل الأهميات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأهميات</SelectItem>
            {Constants.public.Enums.equipment_criticality.map((c) => (
              <SelectItem key={c} value={c}>
                {CRITICALITY_LABELS_AR[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-3xl border-0 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الكود</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>الموقع الوظيفي</TableHead>
              <TableHead>القسم</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>الأهمية</TableHead>
              <TableHead>الحالة التشغيلية</TableHead>
              <TableHead>نشط</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  لا توجد معدات
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((eq) => {
                const section = sectionById.get(eq.section_id);
                const area = section ? areaById.get(section.area_id) : undefined;
                return (
                  <TableRow key={eq.equipment_id}>
                    <TableCell className="font-mono text-sm">
                      {eq.equipment_code}
                    </TableCell>
                    <TableCell className="font-medium">{eq.equipment_name}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground" dir="ltr">
                      {eq.functional_location || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {section?.section_name}
                      {area ? ` / ${area.area_name}` : ""}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {eq.equipment_type || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={CRITICALITY_BADGE_CLASS[eq.criticality]}>
                        {CRITICALITY_LABELS_AR[eq.criticality]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_BADGE_CLASS[eq.status]}>
                        {STATUS_LABELS_AR[eq.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={eq.active ? "default" : "secondary"}>
                        {eq.active ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {canWrite ? (
                          <Button variant="ghost" size="sm" onClick={() => openEdit(eq)}>
                            تعديل
                          </Button>
                        ) : null}
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/master-data/equipment/${eq.equipment_id}`}>
                            <ChevronLeft className="size-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {canWrite ? (
        <EquipmentFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          equipment={editing}
          sections={sections}
        />
      ) : null}
    </div>
  );
}

function EquipmentFormDialog({
  open,
  onOpenChange,
  equipment,
  sections,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment | null;
  sections: Section[];
}) {
  const router = useRouter();
  const isEdit = !!equipment;

  const form = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    values: {
      section_id: equipment?.section_id ?? "",
      equipment_code: equipment?.equipment_code ?? "",
      equipment_name: equipment?.equipment_name ?? "",
      functional_location: equipment?.functional_location ?? "",
      equipment_type: equipment?.equipment_type ?? "",
      manufacturer: equipment?.manufacturer ?? "",
      model: equipment?.model ?? "",
      serial_number: equipment?.serial_number ?? "",
      criticality: equipment?.criticality ?? "Medium",
      status: equipment?.status ?? "Operational",
      installation_date: equipment?.installation_date ?? "",
    },
  });

  const [active, setActive] = useState(equipment?.active ?? true);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(values: EquipmentFormValues) {
    setSubmitting(true);
    const supabase = createClient();

    const payload = {
      section_id: values.section_id,
      equipment_code: values.equipment_code,
      equipment_name: values.equipment_name,
      functional_location: values.functional_location || null,
      equipment_type: values.equipment_type || null,
      manufacturer: values.manufacturer || null,
      model: values.model || null,
      serial_number: values.serial_number || null,
      criticality: values.criticality,
      status: values.status,
      installation_date: values.installation_date || null,
      active,
    };

    const { error } = isEdit
      ? await supabase
          .from("equipment")
          .update(payload)
          .eq("equipment_id", equipment!.equipment_id)
      : await supabase.from("equipment").insert(payload);

    setSubmitting(false);

    if (error) {
      toast.error(
        error.code === "23505" ? "كود المعدة مستخدم بالفعل" : "حدث خطأ، حاول مرة أخرى"
      );
      return;
    }

    toast.success(isEdit ? "تم تحديث المعدة" : "تم إنشاء المعدة");
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل المعدة" : "معدة جديدة"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>القسم</Label>
            <Controller
              control={form.control}
              name="section_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر قسمًا" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.section_id} value={s.section_id}>
                        {s.section_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.section_id ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.section_id.message}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="equipment_code">الكود</Label>
              <Input id="equipment_code" dir="ltr" {...form.register("equipment_code")} />
              {form.formState.errors.equipment_code ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.equipment_code.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="equipment_type">النوع</Label>
              <Input id="equipment_type" {...form.register("equipment_type")} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="equipment_name">الاسم</Label>
            <Input id="equipment_name" {...form.register("equipment_name")} />
            {form.formState.errors.equipment_name ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.equipment_name.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="functional_location">الموقع الوظيفي</Label>
            <Input id="functional_location" dir="ltr" {...form.register("functional_location")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="manufacturer">الشركة المصنعة</Label>
              <Input id="manufacturer" {...form.register("manufacturer")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="model">الموديل</Label>
              <Input id="model" dir="ltr" {...form.register("model")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="serial_number">الرقم التسلسلي</Label>
              <Input id="serial_number" dir="ltr" {...form.register("serial_number")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="installation_date">تاريخ التركيب</Label>
              <Input id="installation_date" type="date" {...form.register("installation_date")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div className="flex flex-col gap-2">
              <Label>الحالة التشغيلية</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Constants.public.Enums.equipment_status.map((s: Enums<"equipment_status">) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABELS_AR[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
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
