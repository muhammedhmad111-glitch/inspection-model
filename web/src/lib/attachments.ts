/**
 * Uploading and removing files in the `attachments` bucket. Two screens do it now
 * — the attachments card and the per-checklist-item photo strip — and they have to
 * agree on the storage path, otherwise the same file lands in two shapes.
 */

import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

export type Attachment = Tables<"attachments">;

/** What a file can hang off. Mirrors attachments_entity_type_check in the DB. */
export type AttachmentEntity = "task" | "finding" | "checklist_item";

const BUCKET = "attachments";

export function attachmentUrl(path: string): string {
  const supabase = createClient();
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export const isImage = (a: Attachment) => (a.mime_type ?? "").startsWith("image/");

/**
 * Upload files one by one and record each. Returns what made it and what did not,
 * so a bad file in the middle of a batch does not throw away the good ones.
 * Returns null when the session is gone — a different problem, different message.
 */
export async function uploadAttachments(
  entityType: AttachmentEntity,
  entityId: string,
  files: File[]
): Promise<{ rows: Attachment[]; failed: string[] } | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const rows: Attachment[] = [];
  const failed: string[] = [];
  for (const file of files) {
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${entityType}/${entityId}/${crypto.randomUUID()}-${safeName}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) {
      failed.push(file.name);
      continue;
    }
    const { data: row, error: insErr } = await supabase
      .from("attachments")
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        storage_path: path,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        uploaded_by: user.id,
      })
      .select("*")
      .single();
    if (insErr || !row) {
      failed.push(file.name);
      continue;
    }
    rows.push(row);
  }
  return { rows, failed };
}

/** Drop the file then its row. False means the row survived — undo the removal. */
export async function deleteAttachment(att: Attachment): Promise<boolean> {
  const supabase = createClient();
  await supabase.storage.from(BUCKET).remove([att.storage_path]);
  const { error } = await supabase
    .from("attachments")
    .delete()
    .eq("attachment_id", att.attachment_id);
  return !error;
}
