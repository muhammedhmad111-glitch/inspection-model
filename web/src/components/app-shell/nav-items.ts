import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Map,
  Boxes,
  Cog,
  BookOpen,
  ClipboardList,
  CalendarClock,
  ClipboardCheck,
  AlertTriangle,
  Wrench,
  FileBarChart,
  ScrollText,
  CalendarDays,
  Users,
  ShieldCheck,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type AdminNavItem = NavItem & { need: "super" | "audit" };

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/master-data/areas", label: "المناطق", icon: Map },
  { href: "/master-data/sections", label: "الأقسام", icon: Boxes },
  { href: "/master-data/equipment", label: "المعدات", icon: Cog },
  { href: "/library", label: "مكتبة الفحص", icon: BookOpen },
  { href: "/activities", label: "أنشطة الفحص", icon: ClipboardList },
  { href: "/scheduling", label: "الجدولة", icon: CalendarClock },
  { href: "/tasks", label: "مهام الفحص", icon: ClipboardCheck },
  { href: "/calendar", label: "التقويم", icon: CalendarDays },
  { href: "/findings", label: "الملاحظات", icon: AlertTriangle },
  { href: "/actions", label: "إجراءات الصيانة", icon: Wrench },
  { href: "/reports", label: "التقارير", icon: FileBarChart },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin/users", label: "المستخدمون والأدوار", icon: Users, need: "super" },
  { href: "/admin/permissions", label: "الأدوار والصلاحيات", icon: ShieldCheck, need: "super" },
  { href: "/audit", label: "سجل التدقيق", icon: ScrollText, need: "audit" },
];
