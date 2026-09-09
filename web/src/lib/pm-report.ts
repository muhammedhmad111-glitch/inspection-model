/**
 * The weekly PM: the shape `get_pm_report_data` returns, and the few labels the
 * page and the PDF both need. Deliberately separate from the weekly report — that
 * one is a management summary, this one is the record of a shutdown.
 */

/** Every row carries the machine the same way, so one type describes all of them. */
export type PmEquipment = {
  equipment: string | null;
  equipmentCode: string | null;
  location: string | null;
  section: string | null;
  part: string | null;
};

export type PmCompleted = PmEquipment & {
  taskCode: string;
  activity: string | null;
  category: string | null;
  requiresShutdown: boolean;
  completedAt: string | null;
  inspector: string | null;
  condition: string | null;
  items: number;
  flagged: number;
};

export type PmAction = PmEquipment & {
  actionCode: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  sapWorkOrder: string | null;
  responsible: string | null;
  department: string | null;
  completedAt: string | null;
  note: string | null;
  findingCode: string | null;
};

export type PmShutdownItem = PmEquipment & {
  /**
   * `planned` — master data says this check needs the machine stopped.
   * `blocked` — the inspector wrote "Not Accessible" because it was still running.
   */
  reason: "planned" | "blocked";
  label: string;
  result: string | null;
  measured: number | null;
  notes: string | null;
  taskCode: string;
  activity: string | null;
  inspector: string | null;
  completedAt: string | null;
};

export type PmWaitingAction = PmEquipment & {
  actionCode: string;
  title: string;
  type: string;
  priority: string;
  sapWorkOrder: string | null;
  responsible: string | null;
  targetDate: string | null;
  waitingSince: string;
};

export type PmReportData = {
  weekStart: string;
  weekEnd: string;
  completed: PmCompleted[];
  actions: PmAction[];
  shutdownItems: PmShutdownItem[];
  waitingShutdown: PmWaitingAction[];
};

export const PM_REASON_LABELS_AR: Record<PmShutdownItem["reason"], string> = {
  planned: "مخطط له — الفحص محتاج وقف",
  blocked: "المفتش مقدرش يوصله والمعدة شغالة",
};

export const PM_REASON_LABELS_EN: Record<PmShutdownItem["reason"], string> = {
  planned: "Planned (needs shutdown)",
  blocked: "Blocked (running)",
};

/** `Belt conveyor · B06.04 · RM-007`, from the flat shape the RPC returns. */
export function pmEquipmentLabel(e: PmEquipment, fallback = "-"): string {
  const parts = [e.equipment, e.location];
  // Skip the register code when the floc already repeats it.
  if (e.equipmentCode && e.equipmentCode !== e.location) parts.push(e.equipmentCode);
  const label = parts.filter(Boolean).join(" · ");
  return label || fallback;
}

/** How many days a job has been parked waiting for a stop. */
export function daysWaiting(since: string): number {
  const ms = Date.now() - new Date(since).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}
