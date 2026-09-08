"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  attachmentUrl,
  deleteAttachment,
  isImage,
  uploadAttachments,
  type Attachment,
} from "@/lib/attachments";

export function Attachments({
  entityType,
  entityId,
  canEdit = true,
}: {
  entityType: "task" | "finding";
  entityId: string;
  canEdit?: boolean;
}) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("attachments")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });
      if (active) {
        setItems(data ?? []);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [entityType, entityId]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const res = await uploadAttachments(entityType, entityId, Array.from(files));
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (!res) {
      toast.error("انتهت الجلسة");
      return;
    }
    setItems((cur) => [...res.rows, ...cur]);
    for (const name of res.failed) toast.error(`فشل رفع ${name}`);
    if (res.rows.length) toast.success(`تم رفع ${res.rows.length} ملف`);
  }

  async function remove(att: Attachment) {
    const prev = items;
    setItems((cur) => cur.filter((x) => x.attachment_id !== att.attachment_id));
    if (!(await deleteAttachment(att))) {
      setItems(prev);
      toast.error("فشل الحذف");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">المرفقات والصور ({items.length})</p>
        {canEdit ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
              إضافة صورة
            </Button>
          </>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">جارٍ التحميل…</p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl bg-muted px-3 py-4 text-center text-sm text-muted-foreground">
          لا توجد مرفقات
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((a) => (
            <div key={a.attachment_id} className="group relative overflow-hidden rounded-2xl border bg-muted">
              <a href={attachmentUrl(a.storage_path)} target="_blank" rel="noopener noreferrer">
                {isImage(a) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={attachmentUrl(a.storage_path)}
                    alt={a.file_name}
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 p-2 text-center">
                    <FileText className="size-6 text-muted-foreground" />
                    <span className="line-clamp-2 text-[10px] text-muted-foreground">
                      {a.file_name}
                    </span>
                  </div>
                )}
              </a>
              {canEdit ? (
                <button
                  onClick={() => remove(a)}
                  className="absolute left-1 top-1 hidden rounded-lg bg-black/60 p-1 text-white group-hover:block"
                  title="حذف"
                >
                  <Trash2 className="size-3.5" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
