"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Clock, MoreHorizontal, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  CATEGORY_LABELS_AR,
  FREQUENCY_BADGE_CLASS,
  FREQUENCY_LABELS_AR,
  PRIORITY_BADGE_CLASS,
  PRIORITY_LABELS_AR,
} from "@/lib/constants";

type Template = Tables<"inspection_activity_templates">;

const templateSchema = z.object({
  activity_code: z.string().min(1, "الكود مطلوب").max(80),
  activity_name: z.string().min(1, "الاسم مطلوب").max(200),
  inspection_method: z.string().max(500).optional(),
  acceptance_criteria: z.string().max(2000).optional(),
  failure_criteria: z.string().max(2000).optional(),
  required_ppe: z.string().max(500).optional(),
  safety_notes: z.string().max(2000).optional(),
  estimated_duration_min: z
    .string()
    .optional()
    .refine((v) => !v || (/^\d+$/.test(v) && Number(v) <= 9999), "قيمة غير صالحة"),
  checklist_text: z.string().max(8000).optional(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

function checklistLabels(checklist: Template["standard_checklist"]): string[] {
  if (!Array.isArray(checklist)) return [];
  return checklist.flatMap((item) =>
    item && typeof item === "object" && "label" in item && typeof item.label === "string"
      ? [item.label]
      : []
  );
}

export function LibraryClient({
  initialTemplates,
  canWrite,
}: {
  initialTemplates: Template[];
  canWrite: boolean;
}) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [viewing, setViewing] = useState<Template | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return initialTemplates;
    return initialTemplates.filter(
      (t) =>
        t.activity_code.toLowerCase().includes(q) ||
        t.activity_name.toLowerCase().includes(q) ||
        CATEGORY_LABELS_AR[t.inspection_category].includes(q)
    );
  }, [initialTemplates, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">مكتبة الفحص</h1>
          <p className="text-sm text-muted-foreground">
            قوالب أنشطة الفحص القياسية حسب الفئة
          </p>
        </div>
        {canWrite ? (
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            قالب جديد
          </Button>
        ) : null}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="بحث بالكود أو الاسم أو الفئة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <p className="col-span-full py-10 text-center text-muted-foreground">
            لا توجد قوالب
          </p>
        ) : (
          filtered.map((tpl) => {
            const items = checklistLabels(tpl.standard_checklist);
            return (
              <Card
                key={tpl.template_id}
                className="cursor-pointer rounded-3xl border-0 shadow-sm transition-shadow hover:shadow-md"
                onClick={() => setViewing(tpl)}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-base">{tpl.activity_name}</CardTitle>
                    <p className="mt-1 font-mono text-xs text-muted-foreground" dir="ltr">
                      {tpl.activity_code}
                    </p>
                  </div>
                  {canWrite ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(tpl);
                            setDialogOpen(true);
                          }}
                        >
                          تعديل
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary">
                      {CATEGORY_LABELS_AR[tpl.inspection_category]}
                    </Badge>
                    <Badge className={FREQUENCY_BADGE_CLASS[tpl.default_frequency_type]}>
                      {FREQUENCY_LABELS_AR[tpl.default_frequency_type]}
                    </Badge>
                    <Badge className={PRIORITY_BADGE_CLASS[tpl.priority]}>
                      {PRIORITY_LABELS_AR[tpl.priority]}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{items.length} بند فحص</span>
                    {tpl.estimated_duration_min ? (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {tpl.estimated_duration_min} دقيقة
                      </span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <TemplateViewDialog template={viewing} onClose={() => setViewing(null)} />
      {canWrite ? (
        <TemplateFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          template={editing}
        />
      ) : null}
    </div>
  );
}

function TemplateViewDialog({
  template,
  onClose,
}: {
  template: Template | null;
  onClose: () => void;
}) {
  const items = template ? checklistLabels(template.standard_checklist) : [];
  return (
    <Dialog open={!!template} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {template ? (
          <>
            <DialogHeader>
              <DialogTitle>{template.activity_name}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary">
                  {CATEGORY_LABELS_AR[template.inspection_category]}
                </Badge>
                <Badge className={FREQUENCY_BADGE_CLASS[template.default_frequency_type]}>
                  {FREQUENCY_LABELS_AR[template.default_frequency_type]}
                </Badge>
                <Badge className={PRIORITY_BADGE_CLASS[template.priority]}>
                  {PRIORITY_LABELS_AR[template.priority]}
                </Badge>
              </div>
              {template.inspection_method ? (
                <Detail label="طريقة الفحص" value={template.inspection_method} />
              ) : null}
              {template.acceptance_criteria ? (
                <Detail label="معايير القبول" value={template.acceptance_criteria} />
              ) : null}
              {template.failure_criteria ? (
                <Detail label="معايير الرفض" value={template.failure_criteria} />
              ) : null}
              {template.required_ppe ? (
                <Detail label="مهمات الوقاية" value={template.required_ppe} />
              ) : null}
              {template.safety_notes ? (
                <Detail label="ملاحظات السلامة" value={template.safety_notes} />
              ) : null}
              {items.length > 0 ? (
                <div>
                  <p className="mb-2 font-semibold">بنود الفحص القياسية</p>
                  <ul className="flex flex-col gap-1.5">
                    {items.map((item, i) => (
                      <li
                        key={i}
                        className="rounded-xl bg-muted px-3 py-2 text-muted-foreground"
                        dir="ltr"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-semibold">{label}</p>
      <p className="mt-0.5 text-muted-foreground" dir="auto">
        {value}
      </p>
    </div>
  );
}

function TemplateFormDialog({
  open,
  onOpenChange,
  template,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
}) {
  const router = useRouter();
  const isEdit = !!template;

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    values: {
      activity_code: template?.activity_code ?? "",
      activity_name: template?.activity_name ?? "",
      inspection_method: template?.inspection_method ?? "",
      acceptance_criteria: template?.acceptance_criteria ?? "",
      failure_criteria: template?.failure_criteria ?? "",
      required_ppe: template?.required_ppe ?? "",
      safety_notes: template?.safety_notes ?? "",
      estimated_duration_min: template?.estimated_duration_min?.toString() ?? "",
      checklist_text: template
        ? checklistLabels(template.standard_checklist).join("\n")
        : "",
    },
  });

  const [category, setCategory] = useState<Enums<"inspection_category">>(
    template?.inspection_category ?? "Visual"
  );
  const [frequency, setFrequency] = useState<Enums<"frequency_type">>(
    template?.default_frequency_type ?? "Monthly"
  );
  const [priority, setPriority] = useState<Enums<"priority_level">>(
    template?.priority ?? "Medium"
  );
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(values: TemplateFormValues) {
    setSubmitting(true);
    const supabase = createClient();

    const checklist = (values.checklist_text ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((label) => ({ label }));

    const payload = {
      activity_code: values.activity_code,
      activity_name: values.activity_name,
      inspection_category: category,
      default_frequency_type: frequency,
      priority,
      inspection_method: values.inspection_method || null,
      acceptance_criteria: values.acceptance_criteria || null,
      failure_criteria: values.failure_criteria || null,
      required_ppe: values.required_ppe || null,
      safety_notes: values.safety_notes || null,
      estimated_duration_min: values.estimated_duration_min
        ? Number(values.estimated_duration_min)
        : null,
      standard_checklist: checklist,
    };

    const { error } = isEdit
      ? await supabase
          .from("inspection_activity_templates")
          .update(payload)
          .eq("template_id", template!.template_id)
      : await supabase.from("inspection_activity_templates").insert(payload);

    setSubmitting(false);

    if (error) {
      toast.error(
        error.code === "23505" ? "كود القالب مستخدم بالفعل" : "حدث خطأ، حاول مرة أخرى"
      );
      return;
    }

    toast.success(isEdit ? "تم تحديث القالب" : "تم إنشاء القالب");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "تعديل القالب" : "قالب جديد"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="الكود" error={form.formState.errors.activity_code?.message}>
              <Input dir="ltr" {...form.register("activity_code")} />
            </Field>
            <Field label="الاسم" error={form.formState.errors.activity_name?.message}>
              <Input {...form.register("activity_name")} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="الفئة">
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as Enums<"inspection_category">)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.inspection_category.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS_AR[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="التكرار الافتراضي">
              <Select
                value={frequency}
                onValueChange={(v) => setFrequency(v as Enums<"frequency_type">)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.frequency_type
                    .filter((f) => f !== "Custom")
                    .map((f) => (
                      <SelectItem key={f} value={f}>
                        {FREQUENCY_LABELS_AR[f]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="الأولوية">
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Enums<"priority_level">)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.priority_level.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS_AR[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="المدة التقديرية (دقيقة)">
            <Input
              type="number"
              dir="ltr"
              {...form.register("estimated_duration_min")}
            />
          </Field>
          <Field label="طريقة الفحص">
            <Input {...form.register("inspection_method")} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="معايير القبول">
              <Textarea rows={2} {...form.register("acceptance_criteria")} />
            </Field>
            <Field label="معايير الرفض">
              <Textarea rows={2} {...form.register("failure_criteria")} />
            </Field>
          </div>
          <Field label="مهمات الوقاية (PPE)">
            <Input {...form.register("required_ppe")} />
          </Field>
          <Field label="ملاحظات السلامة">
            <Textarea rows={2} {...form.register("safety_notes")} />
          </Field>
          <Field label="بنود الفحص (بند في كل سطر)">
            <Textarea dir="ltr" rows={5} {...form.register("checklist_text")} />
          </Field>
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

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
