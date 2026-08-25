"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Loader2,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

type Doc = Tables<"kb_documents">;

const DOC_TYPES: Record<string, string> = {
  manual: "مانيوال معدة",
  procedure: "إجراء تشغيل/صيانة",
  standard: "معيار أو مواصفة",
  note: "ملاحظات ومعرفة داخلية",
};

const STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "بانتظار المعالجة", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  processing: { label: "جاري المذاكرة", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  ready: { label: "جاهز", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  error: { label: "فشل", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
};

export function KnowledgeClient({
  initialDocs,
  canManage,
}: {
  initialDocs: Doc[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("manual");
  const [equipmentType, setEquipmentType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState("");

  const readyCount = initialDocs.filter((d) => d.status === "ready").length;
  const totalChunks = initialDocs.reduce((s, d) => s + (d.chunk_count ?? 0), 0);

  async function upload() {
    if (!file) return toast.error("اختر ملفًا أولاً");
    const finalTitle = title.trim() || file.name.replace(/\.[^.]+$/, "");

    setUploading(true);
    const supabase = createClient();
    let documentId: string | null = null;

    try {
      setStep("جاري رفع الملف...");
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("knowledge")
        .upload(path, file, { upsert: false });
      if (upErr) throw new Error("فشل رفع الملف: " + upErr.message);

      setStep("جاري تسجيل المستند...");
      const { data: doc, error: insErr } = await supabase
        .from("kb_documents")
        .insert({
          title: finalTitle,
          doc_type: docType,
          equipment_type: equipmentType.trim() || null,
          source_name: file.name,
          storage_path: path,
          status: "pending",
        })
        .select("document_id")
        .single();
      if (insErr || !doc) throw new Error("فشل تسجيل المستند: " + (insErr?.message ?? ""));
      documentId = doc.document_id;

      setStep("المساعد بيذاكر المستند... (ممكن ياخد شوية)");
      const { data: res, error: fnErr } = await supabase.functions.invoke("kb-ingest", {
        body: { document_id: documentId },
      });

      if (fnErr) {
        let msg = "فشلت معالجة المستند";
        try {
          const ctx = (fnErr as { context?: Response }).context;
          if (ctx && typeof ctx.json === "function") {
            const b = await ctx.json();
            if (b?.error) msg = b.error;
          }
        } catch {
          // keep the generic message
        }
        throw new Error(msg);
      }
      if (res?.error) throw new Error(res.error);

      toast.success(`تمت المذاكرة — ${res?.chunks ?? 0} مقطع جاهز للبحث`);
      setTitle("");
      setEquipmentType("");
      setFile(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
      router.refresh();
    } finally {
      setUploading(false);
      setStep("");
    }
  }

  async function remove(doc: Doc) {
    const supabase = createClient();
    const { error } = await supabase
      .from("kb_documents")
      .delete()
      .eq("document_id", doc.document_id);
    if (error) return toast.error("تعذّر الحذف");
    if (doc.storage_path) {
      await supabase.storage.from("knowledge").remove([doc.storage_path]);
    }
    toast.success("تم حذف المستند");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/assistant"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="size-4" />
        رجوع للمساعد
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">مكتبة المراجع</h1>
          <p className="text-sm text-muted-foreground">
            المانيوالات والمستندات اللي المساعد ذاكرها — {readyCount} مستند ·{" "}
            {totalChunks} مقطع مفهرس
          </p>
        </div>
      </div>

      {canManage ? (
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardContent className="flex flex-col gap-4 pt-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Upload className="size-4 text-primary" />
              أضف مرجع جديد
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">عنوان المستند</Label>
                <Input
                  id="title"
                  placeholder="مثلاً: Belt Conveyor — Maintenance Manual"
                  value={title}
                  disabled={uploading}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>نوع المستند</Label>
                <Select value={docType} onValueChange={setDocType} disabled={uploading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOC_TYPES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="eqtype">نوع المعدة (اختياري)</Label>
                <Input
                  id="eqtype"
                  placeholder="مثلاً: Belt conveyor"
                  value={equipmentType}
                  disabled={uploading}
                  onChange={(e) => setEquipmentType(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="file">الملف (PDF أو نص)</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.txt,.md"
                  disabled={uploading}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={upload} disabled={uploading || !file} className="rounded-xl">
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                ارفع وذاكر
              </Button>
              {step ? <span className="text-sm text-muted-foreground">{step}</span> : null}
            </div>
            <p className="text-xs text-muted-foreground">
              ملاحظة: الـ PDF لازم يكون فيه نص قابل للنسخ. الملفات الممسوحة ضوئيًا
              (صور) مش هينفع يتقرا منها.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="overflow-hidden rounded-3xl bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستند</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المعدة</TableHead>
                <TableHead>المقاطع</TableHead>
                <TableHead>الحالة</TableHead>
                {canManage ? <TableHead className="w-10" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialDocs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 6 : 5}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <BookOpen className="mx-auto mb-2 size-8 opacity-40" />
                    لسه مافيش مراجع — ارفع أول مانيوال عشان المساعد يذاكره
                  </TableCell>
                </TableRow>
              ) : (
                initialDocs.map((d) => {
                  const st = STATUS[d.status] ?? STATUS.pending;
                  return (
                    <TableRow key={d.document_id}>
                      <TableCell>
                        <div className="font-medium">{d.title}</div>
                        {d.source_name ? (
                          <div className="font-mono text-xs text-muted-foreground" dir="ltr">
                            {d.source_name}
                          </div>
                        ) : null}
                        {d.status === "error" && d.error_message ? (
                          <div className="mt-1 flex items-start gap-1 text-xs text-red-600 dark:text-red-400">
                            <TriangleAlert className="mt-0.5 size-3 shrink-0" />
                            {d.error_message}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {DOC_TYPES[d.doc_type] ?? d.doc_type}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {d.equipment_type || "—"}
                      </TableCell>
                      <TableCell className="font-mono" dir="ltr">
                        {d.chunk_count || 0}
                      </TableCell>
                      <TableCell>
                        <Badge className={st.className}>
                          {d.status === "ready" ? (
                            <CheckCircle2 className="size-3" />
                          ) : d.status === "processing" ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : null}
                          {st.label}
                        </Badge>
                      </TableCell>
                      {canManage ? (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="حذف"
                            onClick={() => remove(d)}
                          >
                            <Trash2 className="size-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
