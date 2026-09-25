"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NavTree } from "./nav-tree";
import type { ProductionLine } from "@/lib/production-line";

export function MobileNav({
  activeLine,
  isSuperAdmin = false,
  canViewAudit = false,
}: {
  activeLine: ProductionLine;
  isSuperAdmin?: boolean;
  canViewAudit?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [drawnFor, setDrawnFor] = useState(pathname);

  // Close the drawer whenever the route changes. Done while rendering rather
  // than in an effect so the new page never shows through the old drawer.
  if (drawnFor !== pathname) {
    setDrawnFor(pathname);
    setOpen(false);
  }

  // lock body scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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
          <aside className="absolute inset-y-0 right-0 flex w-72 max-w-[85%] flex-col bg-gradient-to-b from-brand-purple to-brand-purple-strong p-4 text-white shadow-2xl">
            <div className="flex h-14 items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-white text-sm font-extrabold tracking-tight text-brand-navy">
                  AC
                </div>
                <div>
                  <div className="text-sm font-bold tracking-wide text-white">
                    AMREYAH CEMENT
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
            <NavTree
              activeLine={activeLine}
              isSuperAdmin={isSuperAdmin}
              canViewAudit={canViewAudit}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}
