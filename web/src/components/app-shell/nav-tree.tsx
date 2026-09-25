"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Factory } from "lucide-react";
import { cn } from "@/lib/utils";
import { setActiveLine } from "@/app/(app)/line-actions";
import {
  LINE_LABELS_AR,
  PRODUCTION_LINES,
  type ProductionLine,
} from "@/lib/production-line";
import {
  ADMIN_NAV_ITEMS,
  GLOBAL_NAV_ITEMS,
  LINE_NAV_ITEMS,
  isNavActive,
  type NavItem,
} from "./nav-items";

/**
 * The nav the sidebar and the mobile drawer both render: a few plant-wide
 * sections, then a group per production line holding that line's whole list.
 *
 * Which line you are on still lives in a cookie every server page reads, so
 * opening a section under "خط 3" is two things at once — set the line, then go.
 * The click does them in that order and waits, because navigating first would
 * render the page with the line you were leaving.
 */
export function NavTree({
  activeLine,
  isSuperAdmin = false,
  canViewAudit = false,
  onNavigate,
}: {
  activeLine: ProductionLine;
  isSuperAdmin?: boolean;
  canViewAudit?: boolean;
  /** Lets the mobile drawer close itself on the way out. */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [switching, startSwitch] = useTransition();

  // The line you are working on is open; the other one is a heading you can
  // reach past. Switching the line in the topbar moves the open group with it,
  // which is a render-time sync rather than an effect so the sidebar never
  // paints the old line as the open one.
  const [openLines, setOpenLines] = useState<Set<ProductionLine>>(
    () => new Set([activeLine])
  );
  const [openedFor, setOpenedFor] = useState(activeLine);
  if (openedFor !== activeLine) {
    setOpenedFor(activeLine);
    setOpenLines(new Set([activeLine]));
  }

  function toggleLine(line: ProductionLine) {
    setOpenLines((prev) => {
      const next = new Set(prev);
      if (next.has(line)) next.delete(line);
      else next.add(line);
      return next;
    });
  }

  const itemClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
      active
        ? "bg-white text-primary shadow-sm"
        : "text-white/65 hover:bg-white/10 hover:text-white"
    );

  const renderGlobalItem = (item: NavItem) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onNavigate={() => onNavigate?.()}
        className={itemClass(isNavActive(pathname, item.href))}
      >
        <Icon className="size-4.5" />
        {item.label}
      </Link>
    );
  };

  const renderLineItem = (item: NavItem, line: ProductionLine) => {
    const onActiveLine = line === activeLine;
    const active = onActiveLine && isNavActive(pathname, item.href);
    const Icon = item.icon;
    return (
      <Link
        key={`${line}:${item.href}`}
        href={item.href}
        // No point warming twelve pages of the line you are not on: the payload
        // would be scoped to the line you would be leaving anyway.
        prefetch={onActiveLine ? undefined : false}
        onNavigate={(e) => {
          onNavigate?.();
          if (onActiveLine) return;
          e.preventDefault();
          startSwitch(async () => {
            await setActiveLine(line);
            router.push(item.href);
          });
        }}
        className={cn(itemClass(active), "ps-6", switching && "opacity-60")}
      >
        <Icon className="size-4.5" />
        {item.label}
      </Link>
    );
  };

  const adminItems = ADMIN_NAV_ITEMS.filter((i) =>
    i.need === "super" ? isSuperAdmin : canViewAudit
  );

  return (
    <nav className="mt-4 flex-1 space-y-1.5 overflow-y-auto pl-1">
      {GLOBAL_NAV_ITEMS.map(renderGlobalItem)}

      {PRODUCTION_LINES.map((line) => {
        const open = openLines.has(line);
        return (
          <div key={line} className="pt-2">
            <button
              type="button"
              onClick={() => toggleLine(line)}
              aria-expanded={open}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-bold transition-colors",
                line === activeLine
                  ? "bg-white/15 text-white"
                  : "text-white/55 hover:bg-white/10 hover:text-white"
              )}
            >
              <Factory className="size-4.5 shrink-0" />
              <span className="flex-1 text-right">{LINE_LABELS_AR[line]}</span>
              {line === activeLine ? (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold text-white">
                  نشط
                </span>
              ) : null}
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 transition-transform",
                  open && "rotate-180"
                )}
              />
            </button>

            {open ? (
              <div className="mt-1.5 space-y-1.5 border-r border-white/15 pr-2">
                {LINE_NAV_ITEMS.map((item) => renderLineItem(item, line))}
              </div>
            ) : null}
          </div>
        );
      })}

      {adminItems.length > 0 ? (
        <>
          <div className="px-3.5 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wide text-white/40">
            الإدارة
          </div>
          {adminItems.map(renderGlobalItem)}
        </>
      ) : null}
    </nav>
  );
}
