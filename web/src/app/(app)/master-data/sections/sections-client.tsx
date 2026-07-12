"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
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
import type { Tables } from "@/lib/supabase/types";

type Section = Tables<"sections">;
type Area = Tables<"areas">;

const sectionSchema = z.object({
  area_id: z.string().uuid("اختر منطقة"),
  section_code: z.string().min(1, "الكود مطلوب").max(50),
  section_name: z.string().min(1, "الاسم مطلوب").max(200),
  description: z.string().max(2000).optional(),
});

type SectionFormValues = z.infer<typeof sectionSchema>;

export function SectionsClient({
  initialSections,
  areas,
  canWrite,
}: {
  initialSections: Section[];
  areas: Area[];
  canWrite: boolean;
}) {
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);

  const areaById = useMemo(
    () => new Map(areas.map((a) => [a.area_id, a])),
    [areas]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialSections.filter((s) => {
      if (areaFilter !== "all" && s.area_id !== areaFilter) return false;
      if (!q) return true;
      return (
        s.section_code.toLowerCase().includes(q) ||
        s.section_name.toLowerCase().includes(q)
      );
    });
  }, [initialSections, search, areaFilter]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(section: Section) {
    setEditing(section);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">الأقسام</h1>
          <p className="text-sm text-muted-foreground">
            المستوى الثاني من هيكل الأصول، داخل كل منطقة
          </p>
        </div>
        {canWrite ? (
          <Button onClick={openCreate} disabled={areas.length === 0}>
            <Plus className="size-4" />
            قسم جديد
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث بالكود أو الاسم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={areaFilter} onValueChange={setAreaFilter}>
          <SelectTrigger className="w-48">
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
      </div>

      <div className="overflow-hidden rounded-3xl border-0 bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الكود</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>المنطقة</TableHead>
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
                  لا توجد أقسام
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((section) => (
                <TableRow key={section.section_id}>
                  <TableCell className="font-mono text-sm">
                    {section.section_code}
                  </TableCell>
                  <TableCell className="font-medium">{section.section_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {areaById.get(section.area_id)?.area_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={section.active ? "default" : "secondary"}>
                      {section.active ? "نشط" : "غير نشط"}
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
                          <DropdownMenuItem onClick={() => openEdit(section)}>
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
        <SectionFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          section={editing}
          areas={areas}
        />
      ) : null}
    </div>
  );
}

function SectionFormDialog({
  open,
  onOpenChange,
  section,
  areas,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: Section | null;
  areas: Area[];
}) {
  const router = useRouter();
  const isEdit = !!section;

  const form = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    values: {
      area_id: section?.area_id ?? "",
      section_code: section?.section_code ?? "",
      section_name: section?.section_name ?? "",
      description: section?.description ?? "",
    },
  });

  const [active, setActive] = useState(section?.active ?? true);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(values: SectionFormValues) {
    setSubmitting(true);
    const supabase = createClient();

    const payload = {
      area_id: values.area_id,
      section_code: values.section_code,
      section_name: values.section_name,
      description: values.description || null,
      active,
    };

    const { error } = isEdit
      ? await supabase
          .from("sections")
          .update(payload)
          .eq("section_id", section!.section_id)
      : await supabase.from("sections").insert(payload);

    setSubmitting(false);

    if (error) {
      toast.error(
        error.code === "23505"
          ? "كود القسم مستخدم بالفعل في هذه المنطقة"
          : "حدث خطأ، حاول مرة أخرى"
      );
      return;
    }

    toast.success(isEdit ? "تم تحديث القسم" : "تم إنشاء القسم");
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
          <DialogTitle>{isEdit ? "تعديل القسم" : "قسم جديد"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label>المنطقة</Label>
            <Controller
              control={form.control}
              name="area_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر منطقة" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((a) => (
                      <SelectItem key={a.area_id} value={a.area_id}>
                        {a.area_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.area_id ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.area_id.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="section_code">الكود</Label>
            <Input id="section_code" dir="ltr" {...form.register("section_code")} />
            {form.formState.errors.section_code ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.section_code.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="section_name">الاسم</Label>
            <Input id="section_name" {...form.register("section_name")} />
            {form.formState.errors.section_name ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.section_name.message}
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
