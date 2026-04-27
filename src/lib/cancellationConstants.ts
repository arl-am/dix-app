// Dataverse Choice columns auto-increment from 100000000.
// These constants mirror the option values created by
// scripts/create-cancellation-tables.ps1.

export const CXL_TYPE = {
  VENDOR_ONLY: 100000000,
  DRIVER_ONLY: 100000001,
  UNIT_ONLY: 100000002,
  VENDOR_DRIVER_UNIT: 100000003,
  VENDOR_DRIVER: 100000004,
  VENDOR_UNIT: 100000005,
  DRIVER_UNIT: 100000006,
  TRAILER_ONLY: 100000007,
  SUB_UNIT: 100000008,
  RENTAL_ONLY: 100000009,
} as const;

export const CXL_TYPE_LABELS: Record<number, string> = {
  [CXL_TYPE.VENDOR_ONLY]: 'Vendor Only',
  [CXL_TYPE.DRIVER_ONLY]: 'Driver Only',
  [CXL_TYPE.UNIT_ONLY]: 'Unit Only',
  [CXL_TYPE.VENDOR_DRIVER_UNIT]: 'Vendor/Driver/Unit',
  [CXL_TYPE.VENDOR_DRIVER]: 'Vendor/Driver',
  [CXL_TYPE.VENDOR_UNIT]: 'Vendor/Unit',
  [CXL_TYPE.DRIVER_UNIT]: 'Driver/Unit',
  [CXL_TYPE.TRAILER_ONLY]: 'Trailer Only',
  [CXL_TYPE.SUB_UNIT]: 'SUB Unit',
  [CXL_TYPE.RENTAL_ONLY]: 'Rental Only',
};

export const CXL_TYPE_OPTIONS = Object.entries(CXL_TYPE_LABELS).map(([v, l]) => ({
  value: Number(v),
  label: l,
}));

export const CXL_STATUS = {
  NOT_STARTED: 100000000,
  IN_PROGRESS: 100000001,
  AWAITING_RETURNS: 100000002,
  ALL_ITEMS_RECEIVED: 100000003,
  ITEMS_NOT_RECEIVED: 100000004,
  FORFEIT: 100000005,
  TRANSFERRED: 100000006,
  REACTIVATED_NTL: 100000007,
  RELEASED: 100000008,
} as const;

export const CXL_STATUS_LABELS: Record<number, string> = {
  [CXL_STATUS.NOT_STARTED]: 'Not Started',
  [CXL_STATUS.IN_PROGRESS]: 'In Progress',
  [CXL_STATUS.AWAITING_RETURNS]: 'Awaiting Returns',
  [CXL_STATUS.ALL_ITEMS_RECEIVED]: 'All Items Received',
  [CXL_STATUS.ITEMS_NOT_RECEIVED]: 'Items Not Received',
  [CXL_STATUS.FORFEIT]: 'Forfeit',
  [CXL_STATUS.TRANSFERRED]: 'Transferred',
  [CXL_STATUS.REACTIVATED_NTL]: 'Reactivated NTL',
  [CXL_STATUS.RELEASED]: 'Released',
};

export const CXL_STATUS_COLORS: Record<number, string> = {
  [CXL_STATUS.NOT_STARTED]: '#64748B',
  [CXL_STATUS.IN_PROGRESS]: '#F59E0B',
  [CXL_STATUS.AWAITING_RETURNS]: '#3B82F6',
  [CXL_STATUS.ALL_ITEMS_RECEIVED]: '#10B981',
  [CXL_STATUS.ITEMS_NOT_RECEIVED]: '#DC2626',
  [CXL_STATUS.FORFEIT]: '#DC2626',
  [CXL_STATUS.TRANSFERRED]: '#8B5CF6',
  [CXL_STATUS.REACTIVATED_NTL]: '#10B981',
  [CXL_STATUS.RELEASED]: '#2563EB',
};

export const KANBAN_COLUMNS = [
  CXL_STATUS.NOT_STARTED,
  CXL_STATUS.IN_PROGRESS,
  CXL_STATUS.AWAITING_RETURNS,
  CXL_STATUS.ALL_ITEMS_RECEIVED,
  CXL_STATUS.RELEASED,
];

export const CXL_REASON = {
  RESIGNED_OTHER: 100000000,
  RESIGNED_FOUND_JOB: 100000001,
  RESIGNED_TRUCK_DOWN: 100000002,
  RESIGNED_SICK: 100000003,
  RESIGNED_PERSONAL: 100000004,
  RESIGNED_RETIRING: 100000005,
  TERM_OTHER: 100000006,
  TERM_NO_CONTACT: 100000007,
  TERM_MEDICAL: 100000008,
  TERM_SAFETY: 100000009,
} as const;

export const CXL_REASON_LABELS: Record<number, string> = {
  [CXL_REASON.RESIGNED_OTHER]: 'Resigned - Other',
  [CXL_REASON.RESIGNED_FOUND_JOB]: 'Resigned - Found Another Job',
  [CXL_REASON.RESIGNED_TRUCK_DOWN]: 'Resigned - Truck Down',
  [CXL_REASON.RESIGNED_SICK]: 'Resigned - Sick or Injury',
  [CXL_REASON.RESIGNED_PERSONAL]: 'Resigned - Personal Issue',
  [CXL_REASON.RESIGNED_RETIRING]: 'Resigned - Retiring',
  [CXL_REASON.TERM_OTHER]: 'Termination - Other',
  [CXL_REASON.TERM_NO_CONTACT]: 'Termination - No Contact',
  [CXL_REASON.TERM_MEDICAL]: 'Termination - Medically Disqualified',
  [CXL_REASON.TERM_SAFETY]: 'Termination - Safety Violations',
};

export const CXL_REASON_OPTIONS = Object.entries(CXL_REASON_LABELS).map(([v, l]) => ({
  value: Number(v),
  label: l,
}));

export const EQUIPMENT_LIFECYCLE = {
  NEED: 100000000,
  RETURNED: 100000001,
  NOT_RECEIVED: 100000002,
  TRANSFERRED: 100000003,
  DAMAGED: 100000004,
  FORFEIT: 100000005,
  UNDER_REVIEW: 100000006,
  NO_LONGER_NEEDED: 100000007,
  NA: 100000008,
  REACTIVATED: 100000009,
} as const;

// User-facing labels (Dataverse choice text is independent — these are what the UI shows).
// "Need" reads as "Required", "N/A" as "Not Required", "Not Received" as "Not Returned",
// "Forfeit" as "Discarded". Transferred + Reactivated are surfaced via the boolean qualifier
// columns now, but we keep their label entries in the map for legacy data + tag derivation.
export const EQUIPMENT_LIFECYCLE_LABELS: Record<number, string> = {
  [EQUIPMENT_LIFECYCLE.NEED]: 'Required',
  [EQUIPMENT_LIFECYCLE.RETURNED]: 'Returned',
  [EQUIPMENT_LIFECYCLE.NOT_RECEIVED]: 'Not Returned',
  [EQUIPMENT_LIFECYCLE.TRANSFERRED]: 'Transferred',
  [EQUIPMENT_LIFECYCLE.DAMAGED]: 'Damaged',
  [EQUIPMENT_LIFECYCLE.FORFEIT]: 'Discarded',
  [EQUIPMENT_LIFECYCLE.UNDER_REVIEW]: 'Under Review',
  [EQUIPMENT_LIFECYCLE.NO_LONGER_NEEDED]: 'No Longer Needed',
  [EQUIPMENT_LIFECYCLE.NA]: 'Not Required',
  [EQUIPMENT_LIFECYCLE.REACTIVATED]: 'Reactivated',
};

export const EQUIPMENT_LIFECYCLE_COLORS: Record<number, string> = {
  [EQUIPMENT_LIFECYCLE.NEED]: '#F59E0B',
  [EQUIPMENT_LIFECYCLE.RETURNED]: '#10B981',
  [EQUIPMENT_LIFECYCLE.NOT_RECEIVED]: '#DC2626',
  [EQUIPMENT_LIFECYCLE.TRANSFERRED]: '#8B5CF6',
  [EQUIPMENT_LIFECYCLE.DAMAGED]: '#DC2626',
  [EQUIPMENT_LIFECYCLE.FORFEIT]: '#DC2626',
  [EQUIPMENT_LIFECYCLE.UNDER_REVIEW]: '#64748B',
  [EQUIPMENT_LIFECYCLE.NO_LONGER_NEEDED]: '#64748B',
  [EQUIPMENT_LIFECYCLE.NA]: '#94A3B8',
  [EQUIPMENT_LIFECYCLE.REACTIVATED]: '#0EA5E9',
};

// Soft tinted card palette per state — used by EquipmentCard.
// Each entry: bg, border, dot (the small status indicator).
export interface LifecycleStyle { bg: string; border: string; dot: string; text: string }
export const LIFECYCLE_STYLE: Record<number, LifecycleStyle> = {
  [EQUIPMENT_LIFECYCLE.NEED]:           { bg: '#FFF7ED', border: '#FED7AA', dot: '#F97316', text: '#9A3412' },
  [EQUIPMENT_LIFECYCLE.RETURNED]:       { bg: '#F0FDF4', border: '#BBF7D0', dot: '#10B981', text: '#166534' },
  [EQUIPMENT_LIFECYCLE.NOT_RECEIVED]:   { bg: '#FEF2F2', border: '#FECACA', dot: '#DC2626', text: '#991B1B' },
  [EQUIPMENT_LIFECYCLE.TRANSFERRED]:    { bg: '#FAF5FF', border: '#E9D5FF', dot: '#8B5CF6', text: '#6B21A8' },
  [EQUIPMENT_LIFECYCLE.DAMAGED]:        { bg: '#FEF2F2', border: '#FECACA', dot: '#DC2626', text: '#991B1B' },
  [EQUIPMENT_LIFECYCLE.FORFEIT]:        { bg: '#FEF2F2', border: '#FECACA', dot: '#DC2626', text: '#991B1B' },
  [EQUIPMENT_LIFECYCLE.UNDER_REVIEW]:   { bg: '#FFFBEB', border: '#FDE68A', dot: '#CA8A04', text: '#854D0E' },
  [EQUIPMENT_LIFECYCLE.NO_LONGER_NEEDED]: { bg: '#F1F5F9', border: '#CBD5E1', dot: '#64748B', text: '#475569' },
  [EQUIPMENT_LIFECYCLE.NA]:             { bg: '#F8FAFC', border: '#E2E8F0', dot: '#94A3B8', text: '#64748B' },
  [EQUIPMENT_LIFECYCLE.REACTIVATED]:    { bg: '#F0F9FF', border: '#BAE6FD', dot: '#0EA5E9', text: '#075985' },
};

export const EQUIPMENT_LIFECYCLE_OPTIONS = Object.entries(EQUIPMENT_LIFECYCLE_LABELS).map(([v, l]) => ({
  value: Number(v),
  label: l,
}));

// Primary lifecycle states that the modal lets a user pick (single-select within this set).
// Transferred + Reactivated are surfaced as additive boolean qualifiers — see TRACKING_QUALIFIERS.
export const TRACKING_PRIMARY_STATES: Array<{ value: number; label: string }> = [
  { value: EQUIPMENT_LIFECYCLE.NEED,         label: 'Required' },
  { value: EQUIPMENT_LIFECYCLE.NA,           label: 'Not Required' },
  { value: EQUIPMENT_LIFECYCLE.RETURNED,     label: 'Returned' },
  { value: EQUIPMENT_LIFECYCLE.NOT_RECEIVED, label: 'Not Returned' },
  { value: EQUIPMENT_LIFECYCLE.DAMAGED,      label: 'Damaged' },
  { value: EQUIPMENT_LIFECYCLE.FORFEIT,      label: 'Discarded' },
  { value: EQUIPMENT_LIFECYCLE.UNDER_REVIEW, label: 'Under Review' },
];

// Boolean qualifier flags surfaced in the modal alongside the primary state.
export const TRACKING_QUALIFIERS = [
  { key: 'transferred',  label: 'Transferred',  color: '#8B5CF6' },
  { key: 'reactivated',  label: 'Reactivated',  color: '#0EA5E9' },
] as const;

// Master catalog of trackable equipment, in display order.
// `category` drives the auto-seeding rule below.
export type EquipmentCategory = 'driver' | 'truck' | 'plate' | 'trailer';
export interface EquipmentDef { key: string; displayName: string; category: EquipmentCategory }

export const EQUIPMENT_CATALOG: EquipmentDef[] = [
  { key: 'eld',           displayName: 'ELD',           category: 'truck' },
  { key: 'dashcam',       displayName: 'DashCam',       category: 'truck' },
  { key: 'dashcam_cover', displayName: 'DashCam Cover', category: 'truck' },
  { key: 'door_signs',    displayName: 'Door Signs',    category: 'truck' },
  { key: 'ifta',          displayName: 'IFTA',          category: 'truck' },
  { key: 'license_plate', displayName: 'License Plate', category: 'plate' },
  { key: 'prepass',       displayName: 'PrePass',       category: 'truck' },
  { key: 'logs',          displayName: 'Logs',          category: 'driver' },
  { key: 'rfid',          displayName: 'RFID',          category: 'truck' },
  { key: 'trailer_lock',  displayName: 'Trailer Lock',  category: 'trailer' },
];

// Returns the default lifecycle state for a piece of equipment given the
// cancellation Type. Ops can override per-row in the wizard.
export function defaultLifecycleForType(category: EquipmentCategory, type: number): number {
  const isUnit = (
    type === CXL_TYPE.UNIT_ONLY ||
    type === CXL_TYPE.VENDOR_UNIT ||
    type === CXL_TYPE.DRIVER_UNIT ||
    type === CXL_TYPE.VENDOR_DRIVER_UNIT ||
    type === CXL_TYPE.SUB_UNIT ||
    type === CXL_TYPE.RENTAL_ONLY
  );
  const isDriver = (
    type === CXL_TYPE.DRIVER_ONLY ||
    type === CXL_TYPE.VENDOR_DRIVER ||
    type === CXL_TYPE.DRIVER_UNIT ||
    type === CXL_TYPE.VENDOR_DRIVER_UNIT
  );
  const isTrailer = type === CXL_TYPE.TRAILER_ONLY;

  if (isTrailer) {
    return category === 'trailer' ? EQUIPMENT_LIFECYCLE.NEED : EQUIPMENT_LIFECYCLE.NA;
  }
  if (category === 'driver') return isDriver ? EQUIPMENT_LIFECYCLE.NEED : EQUIPMENT_LIFECYCLE.NA;
  if (category === 'truck' || category === 'plate' || category === 'trailer') {
    return isUnit ? EQUIPMENT_LIFECYCLE.NEED : EQUIPMENT_LIFECYCLE.NA;
  }
  return EQUIPMENT_LIFECYCLE.NA;
}

// Conditional show flags for the wizard form.
export function typeNeedsDriver(type: number | undefined): boolean {
  if (type === undefined) return false;
  return [
    CXL_TYPE.DRIVER_ONLY,
    CXL_TYPE.VENDOR_DRIVER,
    CXL_TYPE.DRIVER_UNIT,
    CXL_TYPE.VENDOR_DRIVER_UNIT,
  ].includes(type as 100000001 | 100000004 | 100000006 | 100000003);
}

export function typeNeedsVendor(type: number | undefined): boolean {
  if (type === undefined) return false;
  return [
    CXL_TYPE.VENDOR_ONLY,
    CXL_TYPE.VENDOR_DRIVER,
    CXL_TYPE.VENDOR_UNIT,
    CXL_TYPE.VENDOR_DRIVER_UNIT,
    CXL_TYPE.DRIVER_ONLY,
    CXL_TYPE.UNIT_ONLY,
    CXL_TYPE.DRIVER_UNIT,
  ].includes(type as 100000000 | 100000004 | 100000005 | 100000003 | 100000001 | 100000002 | 100000006);
}

export function typeNeedsUnit(type: number | undefined): boolean {
  if (type === undefined) return false;
  return [
    CXL_TYPE.UNIT_ONLY,
    CXL_TYPE.VENDOR_UNIT,
    CXL_TYPE.DRIVER_UNIT,
    CXL_TYPE.VENDOR_DRIVER_UNIT,
    CXL_TYPE.SUB_UNIT,
    CXL_TYPE.RENTAL_ONLY,
  ].includes(type as 100000002 | 100000005 | 100000006 | 100000003 | 100000008 | 100000009);
}

export function typeNeedsTrailer(type: number | undefined): boolean {
  return type === CXL_TYPE.TRAILER_ONLY;
}

// Equipment progress = returned / (rows that count toward the denominator).
// Rows in NEED, RETURNED, DAMAGED, FORFEIT, NOT_RECEIVED count; NA / NLN / UNDER_REVIEW don't.
export function equipmentProgress(rows: { lifecycleState: number }[]): { returned: number; total: number; percent: number } {
  const counted = rows.filter((r) => [
    EQUIPMENT_LIFECYCLE.NEED,
    EQUIPMENT_LIFECYCLE.RETURNED,
    EQUIPMENT_LIFECYCLE.DAMAGED,
    EQUIPMENT_LIFECYCLE.FORFEIT,
    EQUIPMENT_LIFECYCLE.NOT_RECEIVED,
  ].includes(r.lifecycleState as 100000000 | 100000001 | 100000004 | 100000005 | 100000002));
  const returned = counted.filter((r) => r.lifecycleState === EQUIPMENT_LIFECYCLE.RETURNED).length;
  const total = counted.length;
  const percent = total === 0 ? 0 : Math.round((returned / total) * 100);
  return { returned, total, percent };
}

// Tentative release date = last item received + 45 days
export function tentativeReleaseDate(lastItemReceived: string | undefined | null): string | null {
  if (!lastItemReceived) return null;
  const d = new Date(lastItemReceived);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + 45);
  return d.toISOString().slice(0, 10);
}

// CXL Due date = cancel date + 7 days
export function defaultDueDate(cancelDate: string | undefined | null): string | null {
  if (!cancelDate) return null;
  const d = new Date(cancelDate);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().slice(0, 10);
}

// ─── Status as derived tags ──────────────────────────────────────────────
// Status used to be a single-value column with auto-progression rules.
// We've moved to a derived multi-tag model: the truth lives in the
// equipment array + a couple of manual flags (forfeit / released).
// `deriveTags()` returns one primary state plus zero-or-more secondary
// tags that reflect what *actually* happened to individual items.

export interface CxlTag {
  key: string;
  label: string;
  color: string;
  // primary tags get the bigger filled pill, secondary tags get an outline pill
  variant: 'primary' | 'secondary';
}

const NEEDED_LIKE = [EQUIPMENT_LIFECYCLE.NEED, EQUIPMENT_LIFECYCLE.UNDER_REVIEW];
const NOT_COUNTED = [EQUIPMENT_LIFECYCLE.NA, EQUIPMENT_LIFECYCLE.NO_LONGER_NEEDED];

interface DeriveInput {
  status?: number | null;       // manual override; Released shows up as a secondary tag
  canceltype?: number | null;   // null + no equipment ⇒ Pending intake
  forfeit?: boolean;            // whole-record forfeit flag
  equipment: { lifecycleState: number; istransferred?: boolean; isreactivated?: boolean }[];
}

// Equipment ordering — sort by EQUIPMENT_CATALOG index so ELD comes first
// rather than alphabetic (which would put DashCam first).
export function equipmentSortIndex(key: string): number {
  const i = EQUIPMENT_CATALOG.findIndex((c) => c.key === key);
  return i < 0 ? 999 : i;
}

// Pending = the cancellation is a stub that still needs intake (e.g. created
// by a Power Automate flow with partial data). Either no Type is set or no
// equipment has been seeded yet.
export function isPending(input: { canceltype?: number | null; equipmentCount: number }): boolean {
  return input.canceltype == null || input.equipmentCount === 0;
}

export const PENDING_COLOR = '#64748B';

export function deriveTags(input: DeriveInput): CxlTag[] {
  const tags: CxlTag[] = [];

  // 1. Pending intake — Power-Automate-created stubs or anything missing a Type.
  if (isPending({ canceltype: input.canceltype, equipmentCount: input.equipment.length })) {
    tags.push({ key: 'pending', label: 'Pending', color: PENDING_COLOR, variant: 'primary' });
  } else {
    // 2. Compute primary from equipment state.
    const counted = input.equipment.filter(
      (e) => !NOT_COUNTED.includes(e.lifecycleState as 100000007 | 100000008),
    );
    if (counted.length === 0) {
      tags.push({ key: 'awaiting', label: 'Awaiting Returns', color: CXL_STATUS_COLORS[CXL_STATUS.AWAITING_RETURNS], variant: 'primary' });
    } else {
      const stillNeeded = counted.some((e) =>
        NEEDED_LIKE.includes(e.lifecycleState as 100000000 | 100000006),
      );
      const anyReturned = counted.some((e) => e.lifecycleState === EQUIPMENT_LIFECYCLE.RETURNED);
      if (stillNeeded) {
        tags.push({ key: 'awaiting', label: 'Awaiting Returns', color: CXL_STATUS_COLORS[CXL_STATUS.AWAITING_RETURNS], variant: 'primary' });
      } else if (anyReturned) {
        tags.push({ key: 'all_received', label: 'All Items Received', color: CXL_STATUS_COLORS[CXL_STATUS.ALL_ITEMS_RECEIVED], variant: 'primary' });
      } else {
        tags.push({ key: 'not_received', label: 'Items Not Received', color: CXL_STATUS_COLORS[CXL_STATUS.ITEMS_NOT_RECEIVED], variant: 'primary' });
      }
    }
  }

  // 3. Secondary tags. Released sits here too — it's a tag on top of "All Items Received",
  // not a primary state by itself.
  if (input.status === CXL_STATUS.RELEASED) {
    tags.push({ key: 'released', label: 'Released', color: CXL_STATUS_COLORS[CXL_STATUS.RELEASED], variant: 'secondary' });
  }
  if (input.forfeit) {
    tags.push({ key: 'forfeit_record', label: 'Forfeit', color: '#DC2626', variant: 'secondary' });
  }
  if (input.equipment.some((e) => e.istransferred || e.lifecycleState === EQUIPMENT_LIFECYCLE.TRANSFERRED)) {
    tags.push({ key: 'transferred', label: 'Transferred', color: '#8B5CF6', variant: 'secondary' });
  }
  if (input.equipment.some((e) => e.isreactivated || e.lifecycleState === EQUIPMENT_LIFECYCLE.REACTIVATED)) {
    tags.push({ key: 'reactivated', label: 'Reactivated', color: '#0EA5E9', variant: 'secondary' });
  }
  if (input.equipment.some((e) => e.lifecycleState === EQUIPMENT_LIFECYCLE.DAMAGED)) {
    tags.push({ key: 'damaged', label: 'Damaged', color: '#F97316', variant: 'secondary' });
  }
  if (input.equipment.some((e) => e.lifecycleState === EQUIPMENT_LIFECYCLE.FORFEIT)) {
    tags.push({ key: 'item_discarded', label: 'Items Discarded', color: '#DC2626', variant: 'secondary' });
  }

  return tags;
}
