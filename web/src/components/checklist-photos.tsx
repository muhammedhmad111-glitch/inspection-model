"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { attachmentUrl, uploadAttachments, type Attachment } from "@/lib/attachments";

/**
 * The photo strip under one checklist item. Deliberately not <Attachments/>: that
 * one fetches its own rows, and a thirty-item round would fire thirty queries on
 * load. The page loads them all once and hands each card its own slice.
 *
 * The list itself lives in the parent because the WhatsApp report reads it too.
 */
export function ChecklistPhotos({
  itemId,
  photos,
  canEdit,
  onAdded,
  onRemove,
}: {
  itemId: string;
  photos: Attachment[];
  canEdit: boolean;
  onAdded: (rows: Attachment[]) => void;
  onRemove: (att: Attachment) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const res = await uploadAttachments("checklist_item", itemId, Array.from(files));
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (!res) {
      toast.error("انتهت الجلسة");
      return;
    }
    if (res.rows.length) onAdded(res.rows);
    for (const name of res.failed) toast.error(`فشل رفع ${name}`);
  }

  if (!canEdit && photos.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {photos.map((a) => (
        <div key={a.attachment_id} className="relative">
          <a href={attachmentUrl(a.storage_path)} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachmentUrl(a.storage_path)}
              alt={a.file_name}
              className="size-16 rounded-xl border object-cover"
            />
          </a>
          {canEdit ? (
            // Always visible, not hover-revealed: this screen is used on a phone
            // in the plant, where there is no hover.
            <button
              type="button"
              onClick={() => onRemove(a)}
              className="absolute -left-1.5 -top-1.5 rounded-full bg-black/70 p-1 text-white"
              title="حذف الصورة"
            >
              <X className="size-3" />
            </button>
          ) : null}
        </div>
      ))}

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
            className="size-16 flex-col gap-1 rounded-xl border-dashed"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Camera className="size-4" />
            )}
            <span className="text-[10px] font-normal">صورة</span>
          </Button>
        </>
      ) : null}
    </div>
  );
}
