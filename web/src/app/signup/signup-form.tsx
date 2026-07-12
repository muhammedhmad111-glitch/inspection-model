"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("كلمة المرور لازم تكون 8 أحرف على الأقل");
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { data, error: fnError } = await supabase.functions.invoke("signup", {
      body: { email, password, full_name: fullName },
    });
    setPending(false);
    if (fnError) {
      // On a non-2xx response, supabase-js puts the Response on `fnError.context`.
      // Read the function's own error message instead of a generic fallback.
      let msg = "تعذّر إنشاء الحساب، حاول مرة أخرى";
      try {
        const ctx = (fnError as { context?: Response }).context;
        if (ctx && typeof ctx.json === "function") {
          const body = await ctx.json();
          if (body?.error) msg = body.error;
        }
      } catch {
        // keep the generic message
      }
      setError(msg);
      return;
    }
    if (data?.error) {
      setError(data.error);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
            <CheckCircle2 className="size-7" />
          </div>
          <h2 className="text-lg font-bold">تم إنشاء الحساب ✅</h2>
          <p className="text-sm text-muted-foreground">
            حسابك بانتظار موافقة المدير العام. هيتم تفعيله وتحديد دورك، وبعدها تقدر
            تسجّل الدخول.
          </p>
          <Button asChild className="mt-2 rounded-xl">
            <a href="/login">العودة لتسجيل الدخول</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="full_name">الاسم الكامل</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="الاسم بالكامل"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@amreyahcement.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="8 أحرف على الأقل"
            />
          </div>
          {error ? (
            <p className="text-sm font-medium text-destructive">{error}</p>
          ) : null}
          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? <Loader2 className="animate-spin" /> : null}
            إنشاء الحساب
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            عندك حساب؟{" "}
            <a href="/login" className="font-semibold text-primary hover:underline">
              تسجيل الدخول
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
