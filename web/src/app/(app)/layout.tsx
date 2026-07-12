import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { Sidebar } from "@/components/app-shell/sidebar";
import { Topbar } from "@/components/app-shell/topbar";
import { getCurrentProfile } from "@/lib/current-profile";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  // Belt-and-suspenders: proxy already redirects unauthenticated requests,
  // this covers the case where the auth user exists but has no profile row yet.
  if (!profile) {
    redirect("/login");
  }

  // Pending / deactivated accounts: show an approval-waiting screen instead of the app.
  if (!profile.active) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-brand-purple to-brand-purple-strong p-4">
        <div className="w-full max-w-md rounded-3xl bg-card p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
            <Clock className="size-8" />
          </div>
          <h1 className="text-xl font-bold">حسابك بانتظار الموافقة</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            تم إنشاء حسابك بنجاح ({profile.full_name}). سيقوم المدير العام بتفعيله
            وتحديد دورك وصلاحياتك قريبًا. حاول تسجيل الدخول مرة أخرى بعد الموافقة.
          </p>
          <form action={signOut} className="mt-6">
            <Button type="submit" variant="outline" className="rounded-xl">
              تسجيل الخروج
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar isSuperAdmin={profile.isSuperAdmin} canViewAudit={profile.canViewAudit} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar profile={profile} unreadCount={unreadCount ?? 0} />
        <main className="flex-1 px-4 pb-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
