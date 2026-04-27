import { useMemo } from 'react';
import { Package, Truck } from 'lucide-react';
import CustomSelect from '../../components/CustomSelect';
import DatePicker from '../../components/DatePicker';
import { cn, formatDate } from '../../lib/utils';
import {
  EQUIPMENT_LIFECYCLE,
  EQUIPMENT_LIFECYCLE_LABELS,
  EQUIPMENT_LIFECYCLE_COLORS,
  EQUIPMENT_LIFECYCLE_OPTIONS,
  equipmentProgress,
} from '../../lib/cancellationConstants';
import type { CxlEquipment } from '../../lib/mockData';

interface Props {
  equipment: CxlEquipment[];
  isLoading: boolean;
  onUpdate: (equipmentId: string, patch: Partial<{ lifecycleState: number; returneddate: string; notes: string }>) => void;
  cancellationName: string;
  terminalLabel: string;
}

export default function Step2Equipment({ equipment, isLoading, onUpdate, cancellationName, terminalLabel }: Props) {
  const sorted = useMemo(() => [...equipment].sort((a, b) => a.cr6cd_displayname.localeCompare(b.cr6cd_displayname)), [equipment]);
  const progress = useMemo(() => equipmentProgress(sorted.map((e) => ({ lifecycleState: e.cr6cd_lifecyclestate }))), [sorted]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border animate-fade-in">
        <Truck className="w-5 h-5 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">{cancellationName || '—'}</span>
        <div className="w-px h-6 bg-border" />
        <span className="text-sm text-muted-foreground">Terminal {terminalLabel || '—'}</span>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in-up">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" /> Equipment & Returns
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Set each item to N/A if not applicable, then update lifecycle state as items come back.</p>
          </div>
          <div className="flex items-center gap-3 min-w-[260px]">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Returned</span>
                <span className="font-semibold text-foreground">{progress.returned} / {progress.total}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-[#10B981] transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
            <span className="text-2xl font-bold text-[#10B981]">{progress.percent}%</span>
          </div>
        </div>

        <div className="divide-y divide-border">
          {isLoading && (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">Loading equipment...</div>
          )}
          {!isLoading && sorted.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              Equipment will be auto-seeded the first time you save Step 1.
            </div>
          )}
          {sorted.map((item) => (
            <div key={item.cr6cd_dixcxlequipmentid} className="px-6 py-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center transition-colors duration-200 hover:bg-muted/30">
              <div className="md:col-span-3">
                <p className="text-sm font-semibold text-foreground">{item.cr6cd_displayname}</p>
                <p className="text-[11px] text-muted-foreground">{item.cr6cd_equipmentkey}</p>
              </div>
              <div className="md:col-span-3">
                <CustomSelect
                  options={EQUIPMENT_LIFECYCLE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
                  value={String(item.cr6cd_lifecyclestate)}
                  onChange={(v) => onUpdate(item.cr6cd_dixcxlequipmentid, { lifecycleState: Number(v) })}
                  triggerClassName="h-9"
                />
              </div>
              <div className="md:col-span-2">
                <span
                  className={cn(
                    'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
                    'border-transparent text-white',
                  )}
                  style={{ backgroundColor: EQUIPMENT_LIFECYCLE_COLORS[item.cr6cd_lifecyclestate] }}
                >
                  {EQUIPMENT_LIFECYCLE_LABELS[item.cr6cd_lifecyclestate]}
                </span>
              </div>
              <div className="md:col-span-2">
                {item.cr6cd_lifecyclestate === EQUIPMENT_LIFECYCLE.RETURNED ? (
                  <DatePicker
                    value={item.cr6cd_returneddate || ''}
                    onChange={(v) => onUpdate(item.cr6cd_dixcxlequipmentid, { returneddate: v })}
                    placeholder="Returned date"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">{item.cr6cd_returneddate ? formatDate(item.cr6cd_returneddate) : '—'}</span>
                )}
              </div>
              <div className="md:col-span-2">
                <input
                  type="text"
                  value={item.cr6cd_notes || ''}
                  placeholder="Notes"
                  onChange={(e) => onUpdate(item.cr6cd_dixcxlequipmentid, { notes: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
