"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseEmails, type ExtraRecipient } from "@/lib/report-recipients";

/**
 * The "send it to these people too" block, shared by the daily and weekly report
 * dialogs. Addresses become checkboxes the moment they are added, so what is
 * about to be mailed is always on screen — the free-text box it replaces gave no
 * sign whether it had understood two addresses or one.
 */
export function ExtraRecipients({
  extras,
  selected,
  onToggle,
  onAdd,
  onForget,
  idPrefix,
}: {
  extras: ExtraRecipient[];
  selected: Set<string>;
  onToggle: (email: string) => void;
  onAdd: (emails: string[]) => Promise<void>;
  onForget: (email: string) => Promise<void>;
  idPrefix: string;
}) {
  const [draft, setDraft] = useState("");
  const [rejected, setRejected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function commit() {
    const { valid, invalid } = parseEmails(draft);
    setRejected(invalid);
    if (valid.length === 0) {
      if (invalid.length === 0) toast.error("اكتب إيميل الأول");
      return;
    }
    setBusy(true);
    await onAdd(valid);
    setBusy(false);
    // Keep only what was rejected, so the user can fix the typo in place instead
    // of retyping the whole line.
    setDraft(invalid.join(", "));
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`${idPrefix}-extra`}>
        إيميلات إضافية{extras.length ? ` (${extras.length})` : ""}
      </Label>

      <div className="flex gap-2">
        <Input
          id={`${idPrefix}-extra`}
          dir="ltr"
          placeholder="name@example.com، other@example.com"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // The dialog has a submit-looking button; Enter must not fire it.
              e.preventDefault();
              commit();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="shrink-0 rounded-xl"
          disabled={busy || !draft.trim()}
          onClick={commit}
        >
          <Plus className="size-4" />
          إضافة
        </Button>
      </div>

      {rejected.length ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          مش إيميلات صحيحة واتساببت:{" "}
          <span className="font-mono" dir="ltr">
            {rejected.join(" · ")}
          </span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          اكتب كذا إيميل مفصولين بمسافة أو فاصلة، أو دوس Enter بعد كل واحد. اللي
          بتضيفه بيتحفظ ويظهر لك المرة الجاية.
        </p>
      )}

      {extras.length ? (
        <div className="flex flex-col gap-1 rounded-xl border p-2">
          {extras.map((e) => (
            <div
              key={e.email}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted"
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={selected.has(e.email)}
                  onChange={() => onToggle(e.email)}
                />
                <span className="truncate font-mono text-xs" dir="ltr">
                  {e.email}
                </span>
              </label>
              <button
                type="button"
                title="حذف من القائمة"
                className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/50"
                onClick={() => onForget(e.email)}
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
