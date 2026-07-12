import type { Enums } from "@/lib/supabase/types";

export const ROLE_LABELS_AR: Record<Enums<"app_user_role">, string> = {
  "Super Admin": "المدير العام",
  "Inspection Manager": "مدير التفتيش",
  "Inspection Section Head": "سكشن هيد تفتيش",
  "Inspection Engineer": "مهندس تفتيش",
  "Preparation Manager": "مدير التجهيز",
  "Preparation Section Head": "سكشن هيد تجهيز",
  "Preparation Engineer": "مهندس تجهيز",
  "Maintenance Manager": "مدير الصيانة",
  "Maintenance Section Head": "سكشن هيد صيانة",
  "Maintenance Engineer": "مهندس صيانة",
  Inspector: "مفتش",
  "Mechanical Engineer": "مهندس ميكانيكي",
  "Electrical Engineer": "مهندس كهرباء",
  "Reliability Engineer": "مهندس موثوقية",
  "Production Manager": "مدير إنتاج",
  "Plant Manager": "مدير المصنع",
  Viewer: "مشاهد",
  Pending: "بانتظار الموافقة",
};

// Roles offered when the super admin assigns a role (excludes Pending)
export const ASSIGNABLE_ROLES: Enums<"app_user_role">[] = [
  "Super Admin",
  "Inspection Manager",
  "Inspection Section Head",
  "Inspection Engineer",
  "Preparation Manager",
  "Preparation Section Head",
  "Preparation Engineer",
  "Maintenance Manager",
  "Maintenance Section Head",
  "Maintenance Engineer",
  "Inspector",
  "Viewer",
];

export const PERMISSION_LABELS_AR: Record<string, string> = {
  master_data: "إدارة البيانات الأساسية والمكتبة والأنشطة والجدولة",
  execute: "تنفيذ الفحص الميداني وتسجيل النتائج",
  findings: "إدارة الملاحظات (تصعيد/إغلاق/إنشاء إجراء)",
  maintenance: "إدارة إجراءات الصيانة",
  escalate: "تشغيل تنبيهات التصعيد",
  reports: "عرض التقارير والتصدير",
  audit: "عرض سجل التدقيق",
  users: "إدارة المستخدمين والأدوار",
};

export const MASTER_DATA_WRITE_ROLES: Enums<"app_user_role">[] = [
  "Super Admin",
  "Inspection Manager",
  "Inspection Engineer",
];

export const NOTIF_PRIORITY_DOT: Record<string, string> = {
  Info: "bg-blue-500",
  Warning: "bg-amber-500",
  Critical: "bg-red-500",
};

export const NOTIF_TYPE_LABELS_AR: Record<string, string> = {
  assignment: "تعيين مهمة",
  critical_finding: "ملاحظة هامة",
  action_created: "إجراء جديد",
  overdue: "فحص متأخر",
  action_overdue: "إجراء متأخر",
};

export const AUDIT_ACTION_LABELS_AR: Record<string, string> = {
  INSERT: "إنشاء",
  UPDATE: "تعديل",
  STATUS_CHANGE: "تغيير حالة",
  DELETE: "حذف",
};

export const AUDIT_ACTION_BADGE_CLASS: Record<string, string> = {
  INSERT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  STATUS_CHANGE: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export const AUDIT_ENTITY_LABELS_AR: Record<string, string> = {
  inspection_tasks: "مهمة فحص",
  inspection_findings: "ملاحظة",
  maintenance_actions: "إجراء صيانة",
};

export const CRITICALITY_LABELS_AR: Record<Enums<"equipment_criticality">, string> = {
  Low: "منخفضة",
  Medium: "متوسطة",
  High: "عالية",
  Critical: "حرجة",
};

export const CRITICALITY_BADGE_CLASS: Record<Enums<"equipment_criticality">, string> = {
  Low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  High: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Critical: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export const STATUS_LABELS_AR: Record<Enums<"equipment_status">, string> = {
  Operational: "تشغيل",
  Warning: "تحذير",
  Critical: "حرج",
  Offline: "متوقف",
};

export const STATUS_BADGE_CLASS: Record<Enums<"equipment_status">, string> = {
  Operational: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Critical: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  Offline: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export const CATEGORY_LABELS_AR: Record<Enums<"inspection_category">, string> = {
  Visual: "فحص بصري",
  Vibration: "اهتزازات",
  Temperature: "حرارة",
  Lubrication: "تزييت",
  Alignment: "محاذاة",
  Wear: "تآكل",
  Leakage: "تسريب",
  Electrical: "كهرباء",
  Instrumentation: "أجهزة قياس",
  Housekeeping: "نظافة وسلامة",
  Environmental: "بيئة",
};

export const FREQUENCY_LABELS_AR: Record<Enums<"frequency_type">, string> = {
  Daily: "يومي",
  Weekly: "أسبوعي",
  Monthly: "شهري",
  Quarterly: "ربع سنوي",
  "Semi-Annual": "نصف سنوي",
  Annual: "سنوي",
  Custom: "مخصص",
};

export const FREQUENCY_BADGE_CLASS: Record<Enums<"frequency_type">, string> = {
  Daily: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  Weekly: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Monthly: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Quarterly: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "Semi-Annual": "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  Annual: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  Custom: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export const PRIORITY_LABELS_AR: Record<Enums<"priority_level">, string> = {
  Low: "منخفضة",
  Medium: "متوسطة",
  High: "عالية",
  Critical: "حرجة",
};

export const PRIORITY_BADGE_CLASS: Record<Enums<"priority_level">, string> = {
  Low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  High: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Critical: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export const TASK_STATUS_LABELS_AR: Record<Enums<"task_status">, string> = {
  Scheduled: "مجدولة",
  Upcoming: "قادمة",
  "In Progress": "قيد التنفيذ",
  Completed: "مكتملة",
  Overdue: "متأخرة",
  Delayed: "مؤجلة",
  Cancelled: "ملغاة",
  Skipped: "متخطاة",
};

export const FINDING_TYPE_LABELS_AR: Record<Enums<"finding_type">, string> = {
  Mechanical: "ميكانيكية",
  Electrical: "كهربائية",
  Process: "تشغيلية",
  Lubrication: "تزييت",
  Vibration: "اهتزازات",
  Structural: "إنشائية",
  Instrumentation: "أجهزة قياس",
  Safety: "سلامة",
  Environmental: "بيئية",
};

export const FINDING_STATUS_LABELS_AR: Record<Enums<"finding_status">, string> = {
  Open: "مفتوحة",
  Monitoring: "تحت المراقبة",
  Escalated: "مُصعّدة",
  "Action Created": "لها إجراء",
  Closed: "مغلقة",
};

export const FINDING_STATUS_BADGE_CLASS: Record<Enums<"finding_status">, string> = {
  Open: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  Monitoring: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Escalated: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  "Action Created": "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  Closed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

export const ACTION_TYPE_LABELS_AR: Record<Enums<"action_type">, string> = {
  Corrective: "تصحيحي",
  Preventive: "وقائي",
  Replacement: "استبدال",
  Repair: "إصلاح",
  Cleaning: "تنظيف",
  Adjustment: "ضبط",
  Investigation: "فحص وتحقيق",
};

export const ACTION_STATUS_LABELS_AR: Record<Enums<"action_status">, string> = {
  Open: "مفتوح",
  Planned: "مخطط",
  "In Progress": "قيد التنفيذ",
  "Waiting Shutdown": "بانتظار التوقف",
  Completed: "مكتمل",
  Verified: "تم التحقق",
  Cancelled: "ملغي",
};

export const ACTION_STATUS_BADGE_CLASS: Record<Enums<"action_status">, string> = {
  Open: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  Planned: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "In Progress": "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "Waiting Shutdown": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Verified: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Cancelled: "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export const DEPARTMENTS_AR = [
  "الصيانة الميكانيكية",
  "الصيانة الكهربائية",
  "أجهزة القياس والتحكم",
  "الإنتاج",
  "الموثوقية",
  "السلامة",
] as const;

export const CHECKLIST_RESULT_LABELS_AR: Record<Enums<"checklist_result">, string> = {
  OK: "سليم",
  Attention: "يحتاج متابعة",
  "Not OK": "غير سليم",
  "Not Accessible": "تعذر الوصول",
  "Not Applicable": "لا ينطبق",
};

export const CHECKLIST_RESULT_ACTIVE_CLASS: Record<Enums<"checklist_result">, string> = {
  OK: "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-600",
  Attention: "bg-amber-500 text-white border-amber-500 hover:bg-amber-500",
  "Not OK": "bg-red-600 text-white border-red-600 hover:bg-red-600",
  "Not Accessible": "bg-slate-500 text-white border-slate-500 hover:bg-slate-500",
  "Not Applicable": "bg-slate-400 text-white border-slate-400 hover:bg-slate-400",
};

export const CONDITION_LABELS_AR: Record<Enums<"equipment_condition">, string> = {
  Excellent: "ممتازة",
  Good: "جيدة",
  Fair: "مقبولة",
  Poor: "ضعيفة",
  Critical: "حرجة",
};

export const CONDITION_BADGE_CLASS: Record<Enums<"equipment_condition">, string> = {
  Excellent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Good: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Fair: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Poor: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  Critical: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

export const TASK_STATUS_BADGE_CLASS: Record<Enums<"task_status">, string> = {
  Scheduled: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Upcoming: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "In Progress": "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Overdue: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  Delayed: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  Cancelled: "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  Skipped: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};
