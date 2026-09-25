import { NavTree } from "./nav-tree";
import type { ProductionLine } from "@/lib/production-line";

export function Sidebar({
  activeLine,
  isSuperAdmin = false,
  canViewAudit = false,
}: {
  activeLine: ProductionLine;
  isSuperAdmin?: boolean;
  canViewAudit?: boolean;
}) {
  return (
    <aside className="hidden w-64 shrink-0 p-3 md:block">
      <div className="sticky top-3 flex h-[calc(100vh-1.5rem)] flex-col rounded-3xl bg-gradient-to-b from-brand-purple to-brand-purple-strong p-4 text-white shadow-xl shadow-brand-navy/20">
        <div className="flex h-14 items-center gap-3 px-1">
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
        <NavTree
          activeLine={activeLine}
          isSuperAdmin={isSuperAdmin}
          canViewAudit={canViewAudit}
        />
      </div>
    </aside>
  );
}
