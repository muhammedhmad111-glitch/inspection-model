"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  ExternalLink,
  Loader2,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { PRIORITY_BADGE_CLASS, PRIORITY_LABELS_AR } from "@/lib/constants";
import type { Enums } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Source = { title: string; page_hint: string | null };

type ProposedFinding = {
  equipment_id: string;
  equipment_name: string;
  functional_location: string | null;
  finding_title: string;
  description: string;
  severity: Enums<"priority_level">;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  proposed?: ProposedFinding | null;
  isError?: boolean;
};

const SUGGESTIONS = [
  "إيه الحد الطبيعي لحرارة بلف السير؟",
  "اعرض المهام المتأخرة",
  "إيه الملاحظات الحرجة المفتوحة؟",
  "إزاي أتعامل مع انحراف السير عن مساره؟",
];

export function AssistantClient({ hasDocuments }: { hasDocuments: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;

    setInput("");
    setMessages((cur) => [...cur, { role: "user", content: q }]);
    setBusy(true);

    // only plain text turns go back as history — tool traffic stays server-side
    const history = messages
      .filter((m) => !m.isError)
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content }));

    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke("assistant", {
      body: { question: q, messages: history },
    });

    let reply: Message;
    if (error) {
      let msg = "تعذّر الوصول للمساعد. حاول مرة أخرى.";
      try {
        const ctx = (error as { context?: Response }).context;
        if (ctx && typeof ctx.json === "function") {
          const body = await ctx.json();
          if (body?.error) msg = body.error;
        }
      } catch {
        // keep the generic message
      }
      reply = { role: "assistant", content: msg, isError: true };
    } else if (data?.error) {
      reply = { role: "assistant", content: data.error, isError: true };
    } else {
      reply = {
        role: "assistant",
        content: data?.answer ?? "لم أستطع الوصول لإجابة.",
        sources: data?.sources ?? [],
        proposed: data?.proposed_finding ?? null,
      };
    }

    setMessages((cur) => [...cur, reply]);
    setBusy(false);
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">المساعد الذكي</h1>
            <p className="text-sm text-muted-foreground">
              يجاوبك من المانيوالات وبيانات المصنع الحقيقية
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/assistant/knowledge">
            <BookOpen className="size-4" />
            مكتبة المراجع
          </Link>
        </Button>
      </div>

      {!hasDocuments ? (
        <Card className="rounded-3xl border-0 bg-amber-50 shadow-sm dark:bg-amber-950/30">
          <CardContent className="flex flex-wrap items-center gap-3 py-4">
            <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="flex-1 text-sm">
              لسه مافيش مراجع مرفوعة. المساعد هيجاوب من بيانات النظام بس — ارفع
              المانيوالات عشان يذاكرها.
            </span>
            <Button asChild size="sm" className="rounded-xl">
              <Link href="/assistant/knowledge">ارفع مرجع</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* conversation */}
      <div className="flex-1 overflow-y-auto rounded-3xl bg-card p-4 shadow-sm">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-5 py-10 text-center">
            <div className="flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <Sparkles className="size-8" />
            </div>
            <div>
              <p className="text-lg font-semibold">اسألني أي حاجة عن الشغل</p>
              <p className="mt-1 text-sm text-muted-foreground">
                المواصفات الفنية، حالة المعدات، المهام، الملاحظات، وإجراءات الصيانة
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => ask(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {messages.map((m, i) => (
              <MessageBubble key={i} message={m} />
            ))}
            {busy ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="size-4" />
                </span>
                <Loader2 className="size-4 animate-spin" />
                بيبحث ويفكّر...
              </div>
            ) : null}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* composer */}
      <div className="flex items-end gap-2">
        <Textarea
          rows={1}
          value={input}
          disabled={busy}
          placeholder="اكتب سؤالك... (Enter للإرسال)"
          className="max-h-40 min-h-11 flex-1 resize-none rounded-2xl"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(input);
            }
          }}
        />
        <Button
          size="icon"
          className="size-11 shrink-0 rounded-2xl"
          disabled={busy || !input.trim()}
          onClick={() => ask(input)}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-xl",
          isUser
            ? "bg-muted text-muted-foreground"
            : message.isError
              ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300"
              : "bg-primary/10 text-primary"
        )}
      >
        {isUser ? <User className="size-4" /> : <Sparkles className="size-4" />}
      </span>

      <div className={cn("flex max-w-[85%] flex-col gap-2", isUser && "items-end")}>
        <div
          className={cn(
            "whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground"
              : message.isError
                ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                : "bg-muted"
          )}
        >
          {message.content}
        </div>

        {message.sources && message.sources.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">المصادر:</span>
            {message.sources.map((s, i) => (
              <Badge key={i} variant="secondary" className="gap-1 font-normal">
                <BookOpen className="size-3" />
                {s.title}
                {s.page_hint ? ` · ${s.page_hint}` : ""}
              </Badge>
            ))}
          </div>
        ) : null}

        {message.proposed ? <ProposedCard finding={message.proposed} /> : null}
      </div>
    </div>
  );
}

function ProposedCard({ finding }: { finding: ProposedFinding }) {
  return (
    <Card className="w-full rounded-2xl border-0 bg-amber-50 shadow-sm dark:bg-amber-950/30">
      <CardContent className="flex flex-col gap-2 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
            مسودة ملاحظة — تحتاج تأكيدك
          </span>
          <Badge className={PRIORITY_BADGE_CLASS[finding.severity]}>
            {PRIORITY_LABELS_AR[finding.severity]}
          </Badge>
        </div>
        <div className="text-sm font-medium">{finding.finding_title}</div>
        {finding.description ? (
          <p className="text-sm text-muted-foreground">{finding.description}</p>
        ) : null}
        <div className="text-xs text-muted-foreground">
          المعدة: {finding.equipment_name}
          {finding.functional_location ? ` · ${finding.functional_location}` : ""}
        </div>
        <p className="text-xs text-muted-foreground">
          الملاحظات تُسجَّل من داخل مهمة الفحص (لضمان ربطها بالجزء الصحيح).
        </p>
        <Button asChild size="sm" variant="outline" className="w-fit rounded-xl">
          <Link href={`/master-data/equipment/${finding.equipment_id}`}>
            <ExternalLink className="size-4" />
            افتح صفحة المعدة
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
