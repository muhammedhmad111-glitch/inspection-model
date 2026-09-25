import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Network,
  Map,
  Boxes,
  Cog,
  BookOpen,
  ClipboardList,
  CalendarClock,
  ClipboardCheck,
  AlertTriangle,
  Wrench,
  PowerOff,
  FileBarChart,
  Clapperboard,
  ScrollText,
  CalendarDays,
  Users,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type AdminNavItem = NavItem & { need: "super" | "audit" };

/**
 * Sections that read the same whichever line you are working on: the plant-wide
 * dashboard, the assistant, the asset tree that deliberately shows both lines,
 * and the activity template library that both lines draw their plans from.
 */
export const GLOBAL_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/assistant", label: "المساعد الذكي", icon: Sparkles },
  { href: "/master-data/structure", label: "هيكل الأصول", icon: Network },
  { href: "/library", label: "مكتبة الفحص", icon: BookOpen },
];

/**
 * Everything below here is a different set of rows per line — line 3's areas are
 * not more of line 1's, and its overdue tasks belong to a different manager. So
 * the sidebar repeats this list under each line rather than showing it once and
 * leaving you to remember which line the numbers on screen came from.
 *
 * Each page already scopes itself to the active line; the nav's job is to make
 * the line you picked a place you are standing in, not a setting you set once.
 */
export const LINE_NAV_ITEMS: NavItem[] = [
  { href: "/master-data/areas", label: "المناطق", icon: Map },
  { href: "/master-data/sections", label: "الأقسام", icon: Boxes },
  { href: "/master-data/equipment", label: "المعدات", icon: Cog },
  { href: "/activities", label: "أنشطة الفحص", icon: ClipboardList },
  { href: "/scheduling", label: "الجدولة", icon: CalendarClock },
  { href: "/tasks", label: "مهام الفحص", icon: ClipboardCheck },
  { href: "/calendar", label: "التقويم", icon: CalendarDays },
  { href: "/findings", label: "الملاحظات", icon: AlertTriangle },
  { href: "/actions", label: "إجراءات الصيانة", icon: Wrench },
  { href: "/pm", label: "الصيانة الوقائية (PM)", icon: PowerOff },
  { href: "/reports", label: "التقارير", icon: FileBarChart },
  { href: "/reports/video", label: "فيديو التقرير", icon: Clapperboard },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin/users", label: "المستخدمون والأدوار", icon: Users, need: "super" },
  { href: "/admin/permissions", label: "الأدوار والصلاحيات", icon: ShieldCheck, need: "super" },
  { href: "/audit", label: "سجل التدقيق", icon: ScrollText, need: "audit" },
];

/** The sidebar and the mobile drawer agree on what "you are here" means. */
export function isNavActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
