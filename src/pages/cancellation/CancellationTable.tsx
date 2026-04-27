import { useMemo, useState } from 'react';
import { Pencil, ChevronUp, ChevronDown } from 'lucide-react';
import Spinner from '../../components/Spinner';
import { cn, formatDate } from '../../lib/utils';
import type { Cancellation } from '../../lib/mockData';
import {
  CXL_TYPE_LABELS,
  CXL_REASON_LABELS,
  deriveTags,
} from '../../lib/cancellationConstants';
import { useAllCxlEquipment } from '../../hooks/useCxlEquipment';

type SortField = 'terminal' | 'cr6cd_dix_name' | 'cr6cd_dix_canceldate' | 'cr6cd_dix_canceltype';

interface Props {
  cancellations: Cancellation[];
  isLoading: boolean;
  onTrack: (c: Cancellation, isPending: boolean) => void;
  onEdit: (c: Cancellation) => void;
}

const COLUMN_COUNT = 8;

export default function CancellationTable({ cancellations, isLoading, onTrack, onEdit }: Props) {
  const [sortField, setSortField] = useState<SortField>('cr6cd_dix_canceldate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const { data: allEquipment = [] } = useAllCxlEquipment();

  const tagsByCxl = useMemo(() => {
    const eqMap = new Map<string, typeof allEquipment>();
    for (const e of allEquipment) {
      const k = e._cr6cd_equipmentcancellation_value;
      if (!k) continue;
      const arr = eqMap.get(k) || [];
      arr.push(e);
      eqMap.set(k, arr);
    }
    const m = new Map<string, ReturnType<typeof deriveTags>>();
    for (const c of cancellations) {
      const eq = eqMap.get(c.cr6cd_dix_cancellationid) || [];
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
  }, [cancellations, allEquipment]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const sorted = [...cancellations].sort((a, b) => {
    const av = (a[sortField] ?? '') as string | number;
    const bv = (b[sortField] ?? '') as string | number;
    const cmp = String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className={cn('transition-all duration-200', sortField === field ? 'opacity-100' : 'opacity-30')}>
      {sortField === field && sortDir === 'asc'
        ? <ChevronUp className="w-3.5 h-3.5" />
        : <ChevronDown className="w-3.5 h-3.5" />}
    </span>
  );

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
          <tr className="border-b">
            {([
              ['cr6cd_dix_name', 'Name / Unit'],
              ['terminal', 'Terminal'],
              ['cr6cd_dix_canceltype', 'Type'],
              ['cr6cd_dix_canceldate', 'Cancel Date'],
            ] as [SortField, string][]).map(([field, label]) => (
              <th
                key={field}
                className="h-10 px-4 text-left font-semibold text-foreground cursor-pointer select-none transition-colors duration-200 hover:text-primary"
                onClick={() => toggleSort(field)}
              >
                <span className="flex items-center gap-1">{label} <SortIcon field={field} /></span>
              </th>
            ))}
            <th className="h-10 px-4 text-left font-semibold text-foreground">Status</th>
            <th className="h-10 px-4 text-left font-semibold text-foreground">Driver</th>
            <th className="h-10 px-4 text-left font-semibold text-foreground">Reason</th>
            <th className="h-10 px-4 text-left font-semibold text-foreground w-16" />
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={COLUMN_COUNT}><Spinner label="Loading cancellations..." /></td></tr>
          ) : sorted.length === 0 ? (
            <tr><td colSpan={COLUMN_COUNT}><Spinner label="No cancellations found" className="[&>div:first-child]:hidden" /></td></tr>
          ) : (
            sorted.map((c, idx) => {
              const tags = tagsByCxl.get(c.cr6cd_dix_cancellationid) || [];
              const isPending = tags.some((t) => t.variant === 'primary' && t.key === 'pending');
              return (
                <tr
                  key={c.cr6cd_dix_cancellationid}
                  className={cn(
                    'border-b cursor-pointer transition-all duration-200 hover:bg-primary/5',
                    idx % 2 === 0 ? 'bg-card' : 'bg-muted/30',
                  )}
                  onClick={() => onTrack(c, isPending)}
                >
                  <td className="px-4 py-3 whitespace-nowrap font-bold">{c.cr6cd_dix_name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{c.terminal || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {c.cr6cd_dix_canceltype != null ? CXL_TYPE_LABELS[c.cr6cd_dix_canceltype] : '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(c.cr6cd_dix_canceldate)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1 flex-wrap">
                      {tags.map((t) =>
                        t.variant === 'primary' ? (
                          <span
                            key={t.key}
                            className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold text-white border-transparent"
                            style={{ backgroundColor: t.color }}
                          >
                            {t.label}
                          </span>
                        ) : (
                          <span
                            key={t.key}
                            className="inline-flex items-center rounded-full px-1.5 py-0 text-[9px] font-bold border"
                            style={{ color: t.color, borderColor: t.color, backgroundColor: t.color + '1A' }}
                          >
                            {t.label}
                          </span>
                        ),
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{c.cr6cd_dix_drivername || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                    {c.cr6cd_dix_cancelreason != null ? CXL_REASON_LABELS[c.cr6cd_dix_cancelreason] : '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(c); }}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200 active:scale-90"
                      title="Open in wizard"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
