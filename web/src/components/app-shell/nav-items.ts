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

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/assistant", label: "المساعد الذكي", icon: Sparkles },
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
  { href: "/pm", label: "الصيانة الوقائية (PM)", icon: PowerOff },
  { href: "/reports", label: "التقارير", icon: FileBarChart },
  { href: "/reports/video", label: "فيديو التقرير", icon: Clapperboard },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin/users", label: "المستخدمون والأدوار", icon: Users, need: "super" },
  { href: "/admin/permissions", label: "الأدوار والصلاحيات", icon: ShieldCheck, need: "super" },
  { href: "/audit", label: "سجل التدقيق", icon: ScrollText, need: "audit" },
];
