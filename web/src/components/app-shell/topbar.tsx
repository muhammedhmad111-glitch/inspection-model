import Link from "next/link";
import { Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/app-shell/mobile-nav";
import { ROLE_LABELS_AR } from "@/lib/constants";
import { signOut } from "@/app/login/actions";
import type { getCurrentProfile } from "@/lib/current-profile";

export function Topbar({
  profile,
  unreadCount = 0,
}: {
  profile: NonNullable<Awaited<ReturnType<typeof getCurrentProfile>>>;
  unreadCount?: number;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between px-4 md:h-20 md:px-6">
      <MobileNav
        isSuperAdmin={profile.isSuperAdmin}
        canViewAudit={profile.canViewAudit}
      />
      <div className="flex items-center gap-2 md:gap-3">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="relative size-11 rounded-full bg-card text-muted-foreground shadow-sm hover:text-foreground"
          title="الإشعارات"
        >
          <Link href="/notifications">
            <Bell className="size-5" />
            {unreadCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-brand-pink px-1 text-[11px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </Link>
        </Button>
        <div className="flex items-center gap-2 rounded-full bg-card p-1.5 pr-1.5 shadow-sm sm:gap-3 sm:pr-4">
        <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {profile.full_name.trim().charAt(0).toUpperCase()}
        </div>
        <div className="hidden text-right leading-tight sm:block">
          <div className="max-w-[10rem] truncate text-sm font-semibold">
            {profile.full_name}
          </div>
          <div className="text-xs text-muted-foreground">
            {ROLE_LABELS_AR[profile.role]}
          </div>
        </div>
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-foreground"
            title="تسجيل الخروج"
          >
            <LogOut className="size-4" />
          </Button>
        </form>
        </div>
      </div>
    </header>
  );
}
