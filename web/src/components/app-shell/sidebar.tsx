"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS, NAV_ITEMS, type NavItem } from "./nav-items";

export function Sidebar({
  isSuperAdmin = false,
  canViewAudit = false,
}: {
  isSuperAdmin?: boolean;
  canViewAudit?: boolean;
}) {
  const pathname = usePathname();
  const adminItems = ADMIN_NAV_ITEMS.filter((i) =>
    i.need === "super" ? isSuperAdmin : canViewAudit
  );

  const renderItem = (item: NavItem) => {
    const active =
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold transition-colors",
          active
            ? "bg-white text-brand-red shadow-sm"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        )}
      >
        <Icon className="size-4.5" />
        {item.label}
      </Link>
    );
  };

  return (
    <aside className="hidden w-64 shrink-0 p-3 md:block">
      <div className="sticky top-3 flex h-[calc(100vh-1.5rem)] flex-col border border-white/10 bg-ink p-4 text-white">
        <div className="flex h-14 items-center gap-3 px-1">
          <div className="flex size-10 items-center justify-center bg-brand-red text-sm font-extrabold tracking-tight text-white">
            AC
          </div>
          <div>
            <div className="text-sm font-bold uppercase tracking-wide text-white">
              Amreyah Cement
            </div>
            <div className="text-[11px] text-white/55">نظام فحص المصنع</div>
          </div>
        </div>
        <nav className="mt-4 flex-1 space-y-1.5 overflow-y-auto pl-1">
          {NAV_ITEMS.map(renderItem)}
          {adminItems.length > 0 ? (
            <>
              <div className="px-3.5 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wide text-white/40">
                الإدارة
              </div>
              {adminItems.map(renderItem)}
            </>
          ) : null}
        </nav>
      </div>
    </aside>
  );
}
