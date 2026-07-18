"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS, NAV_ITEMS, type NavItem } from "./nav-items";

export function MobileNav({
  isSuperAdmin = false,
  canViewAudit = false,
}: {
  isSuperAdmin?: boolean;
  canViewAudit?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // close the drawer whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // lock body scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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
        onClick={() => setOpen(false)}
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
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="فتح القائمة"
        className="flex size-11 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm hover:text-foreground md:hidden"
      >
        <Menu className="size-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 right-0 flex w-72 max-w-[85%] flex-col border-l border-white/10 bg-ink p-4 text-white shadow-2xl">
            <div className="flex h-14 items-center justify-between px-1">
              <div className="flex items-center gap-3">
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
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="إغلاق القائمة"
                className="flex size-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X className="size-5" />
              </button>
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
          </aside>
        </div>
      ) : null}
    </>
  );
}
