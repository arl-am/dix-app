import { useMemo } from 'react';
import { Pencil } from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';
import type { Cancellation } from '../../lib/mockData';
import {
  CXL_STATUS,
  CXL_STATUS_LABELS,
  CXL_STATUS_COLORS,
  CXL_TYPE_LABELS,
  PENDING_COLOR,
  deriveTags,
} from '../../lib/cancellationConstants';
import { useAllCxlEquipment } from '../../hooks/useCxlEquipment';

interface Props {
  cancellations: Cancellation[];
  onSelect: (c: Cancellation, isPending: boolean) => void;
}

const KANBAN_PRIMARY_KEYS: Array<{ key: string; label: string; color: string }> = [
  { key: 'pending',      label: 'Pending',                                       color: PENDING_COLOR },
  { key: 'awaiting',     label: CXL_STATUS_LABELS[CXL_STATUS.AWAITING_RETURNS],   color: CXL_STATUS_COLORS[CXL_STATUS.AWAITING_RETURNS] },
  { key: 'all_received', label: CXL_STATUS_LABELS[CXL_STATUS.ALL_ITEMS_RECEIVED], color: CXL_STATUS_COLORS[CXL_STATUS.ALL_ITEMS_RECEIVED] },
  { key: 'not_received', label: CXL_STATUS_LABELS[CXL_STATUS.ITEMS_NOT_RECEIVED], color: CXL_STATUS_COLORS[CXL_STATUS.ITEMS_NOT_RECEIVED] },
];

export default function CancellationKanban({ cancellations, onSelect }: Props) {
  const { data: allEquipment = [] } = useAllCxlEquipment();

  const equipmentByCxl = useMemo(() => {
    const m = new Map<string, typeof allEquipment>();
    for (const e of allEquipment) {
      const k = e._cr6cd_equipmentcancellation_value;
      if (!k) continue;
      const arr = m.get(k) || [];
      arr.push(e);
      m.set(k, arr);
    }
    return m;
  }, [allEquipment]);

  const tagsByCxl = useMemo(() => {
    const m = new Map<string, ReturnType<typeof deriveTags>>();
    for (const c of cancellations) {
      const eq = equipmentByCxl.get(c.cr6cd_dix_cancellationid) || [];
      m.set(
        c.cr6cd_dix_cancellationid,
        deriveTags({
          status: c.cr6cd_dix_status,
          canceltype: c.cr6cd_dix_canceltype,
          forfeit: !!c.cr6cd_dix_forfeit,
          equipment: eq.map((e) => ({ lifecycleState: e.cr6cd_lifecyclestate })),
        }),
      );
    }
    return m;
  }, [cancellations, equipmentByCxl]);

  const grouped = useMemo(() => {
    const g = new Map<string, Cancellation[]>();
    for (const col of KANBAN_PRIMARY_KEYS) g.set(col.key, []);
    for (const c of cancellations) {
      const tags = tagsByCxl.get(c.cr6cd_dix_cancellationid) || [];
      const primaryKey = tags.find((t) => t.variant === 'primary')?.key || 'awaiting';
      const arr = g.get(primaryKey);
      if (arr) arr.push(c);
    }
    return g;
  }, [cancellations, tagsByCxl]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {KANBAN_PRIMARY_KEYS.map((col) => {
        const items = grouped.get(col.key) || [];
        const color = col.color;
        return (
          <div key={col.key} className="flex flex-col rounded-xl border border-border bg-card overflow-hidden min-h-[400px]">
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ backgroundColor: color + '15', borderBottom: `2px solid ${color}` }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
              </div>
              <span className="inline-flex items-center justify-center min-w-[24px] h-5 px-2 rounded-full bg-foreground/10 text-xs font-semibold text-foreground">
                {items.length}
              </span>
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
              {items.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">No cancellations</p>
              )}
              {items.map((c) => {
                const cTags = tagsByCxl.get(c.cr6cd_dix_cancellationid) || [];
                const secondary = cTags.filter((t) => t.variant === 'secondary');
                const isPending = col.key === 'pending';
                return (
                  <button
                    key={c.cr6cd_dix_cancellationid}
                    onClick={() => onSelect(c, isPending)}
                    className={cn(
                      'w-full text-left rounded-lg border border-border bg-background p-3 cursor-pointer',
                      'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/40 active:scale-[0.99] group',
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-bold text-foreground truncate">{c.cr6cd_dix_name}</p>
                      <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-1">
                      {c.cr6cd_dix_canceltype != null ? CXL_TYPE_LABELS[c.cr6cd_dix_canceltype] : '—'}
                    </p>
                    {secondary.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {secondary.map((t) => (
                          <span
                            key={t.key}
                            className="inline-flex items-center rounded-full px-1.5 py-0 text-[9px] font-bold border"
                            style={{ color: t.color, borderColor: t.color, backgroundColor: t.color + '1A' }}
                          >
                            {t.label}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">
                        {c.terminal ? `Term ${c.terminal}` : '—'}
                      </span>
                      <span className="text-muted-foreground">{formatDate(c.cr6cd_dix_canceldate || c.cr6cd_dix_requestdate)}</span>
                    </div>
                    {c.cr6cd_dix_drivername && (
                      <p className="text-xs text-foreground mt-1 truncate">{c.cr6cd_dix_drivername}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
