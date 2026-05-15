import { useMemo } from 'react';
import { ArrowRightLeft, RotateCcw, Truck } from 'lucide-react';
import { toast } from 'sonner';
import CustomSelect from '../../components/CustomSelect';
import DatePicker from '../../components/DatePicker';
import EquipmentRequirementCard from './EquipmentRequirementCard';
import { EQUIPMENT_LIFECYCLE, equipmentSortIndex } from '../../lib/cancellationConstants';
import type { CxlEquipment } from '../../lib/mockData';

export interface IntakeExtras {
  transferredtounit: string;
  prepassnumber: string;
  rfidnumber: string;
  platenumber: string;
  fleetnumber: string;
  logsfromdate: string;
  logstodate: string;
}

interface Props {
  equipment: CxlEquipment[];
  isLoading: boolean;
  onPrimaryChange: (equipmentId: string, lifecycleState: number) => void;
  onQualifierToggle: (equipmentId: string, key: 'transferred' | 'reactivated', value: boolean) => void;
  extras: IntakeExtras;
  onExtraChange: <K extends keyof IntakeExtras>(field: K, value: IntakeExtras[K]) => void;
}

const FLEET_OPTIONS = [
  { value: 'Fleet 1', label: 'Fleet 1' },
  { value: 'Fleet 2', label: 'Fleet 2' },
];

function inlineInput(
  label: string,
  value: string,
  onChange: (v: string) => void,
  placeholder = '',
) {
  return (
    <div className="space-y-1">
      <label className="eq-label text-[10px] font-bold uppercase tracking-wider">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="eq-input w-full h-8 rounded-md border border-input px-2.5 text-xs shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

export default function Step2Equipment({ equipment, isLoading, onPrimaryChange, onQualifierToggle, extras, onExtraChange }: Props) {
  const sorted = useMemo(
    () => [...equipment].sort(
      (a, b) => equipmentSortIndex(a.cr6cd_equipmentkey) - equipmentSortIndex(b.cr6cd_equipmentkey),
    ),
    [equipment],
  );

  const anyTransferred = sorted.some(
    (e) => e.cr6cd_istransferred || e.cr6cd_lifecyclestate === EQUIPMENT_LIFECYCLE.TRANSFERRED,
  );

  const handleMarkAll = (key: 'transferred' | 'reactivated') => {
    const requiredItems = sorted.filter((e) => e.cr6cd_lifecyclestate === EQUIPMENT_LIFECYCLE.NEED);
    if (requiredItems.length === 0) {
      toast.info('No required items to update.');
      return;
    }
    const targets = requiredItems.filter((e) =>
      key === 'transferred' ? !e.cr6cd_istransferred : !e.cr6cd_isreactivated,
    );
    if (targets.length === 0) {
      toast.info(`All required items are already marked as ${key === 'transferred' ? 'Transferred' : 'Reactivated'}.`);
      return;
    }
    targets.forEach((e) => onQualifierToggle(e.cr6cd_dixcxlequipmentid, key, true));
    toast.success(`Marked ${targets.length} item${targets.length === 1 ? '' : 's'} as ${key === 'transferred' ? 'Transferred' : 'Reactivated'}.`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in-up">
        <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-base font-semibold text-foreground">Equipment & Returns</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tag each item as Required, Not Required, Transferred, or Reactivated. Returns are tracked in the modal.
            </p>
          </div>
          {!isLoading && sorted.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleMarkAll('reactivated')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:border-sky-300 hover:text-sky-700 hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Mark all as Reactivated
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('transferred')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-300 hover:text-purple-700 hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Mark all as Transferred
              </button>
            </div>
          )}
        </div>

        <div className="p-5">
          {isLoading && (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading equipment...</div>
          )}
          {!isLoading && sorted.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Equipment will be auto-seeded the first time you save Step 1.
            </div>
          )}
          {!isLoading && sorted.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sorted.map((item, idx) => {
                const isRequired = item.cr6cd_lifecyclestate === EQUIPMENT_LIFECYCLE.NEED;
                const key = item.cr6cd_equipmentkey;
                let inline = null;

                if (isRequired && key === 'prepass') {
                  inline = inlineInput('PrePass Number', extras.prepassnumber, (v) => onExtraChange('prepassnumber', v), 'e.g. 9988-7766');
                } else if (isRequired && key === 'rfid') {
                  inline = inlineInput('RFID Number', extras.rfidnumber, (v) => onExtraChange('rfidnumber', v), 'e.g. RF-12345');
                } else if (isRequired && key === 'license_plate') {
                  inline = (
                    <div className="grid grid-cols-2 gap-2">
                      {inlineInput('Plate Number', extras.platenumber, (v) => onExtraChange('platenumber', v), 'ABC-1234')}
                      <div className="space-y-1">
                        <label className="eq-label text-[10px] font-bold uppercase tracking-wider">Fleet</label>
                        <CustomSelect
                          options={FLEET_OPTIONS}
                          value={extras.fleetnumber}
                          onChange={(v) => onExtraChange('fleetnumber', v)}
                          placeholder="Select"
                          triggerClassName="h-8 text-xs"
                        />
                      </div>
                    </div>
                  );
                } else if (isRequired && key === 'logs') {
                  inline = (
                    <div className="space-y-2">
                      <label className="eq-label text-[10px] font-bold uppercase tracking-wider">Logs Date Range</label>
                      <div className="grid grid-cols-2 gap-2">
                        <DatePicker
                          value={extras.logsfromdate}
                          onChange={(v) => onExtraChange('logsfromdate', v)}
                          placeholder="From"
                        />
                        <DatePicker
                          value={extras.logstodate}
                          onChange={(v) => onExtraChange('logstodate', v)}
                          placeholder="To"
                        />
                      </div>
                    </div>
                  );
                }

                return (
                  <EquipmentRequirementCard
                    key={item.cr6cd_dixcxlequipmentid}
                    item={item}
                    onPrimaryChange={(s) => onPrimaryChange(item.cr6cd_dixcxlequipmentid, s)}
                    onQualifierToggle={(k, v) => onQualifierToggle(item.cr6cd_dixcxlequipmentid, k, v)}
                    delayMs={idx * 25}
                  >
                    {inline}
                  </EquipmentRequirementCard>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {anyTransferred && (
        <div
          className="eq-transfer-panel rounded-xl border-2 overflow-hidden"
          style={{
            animation: 'fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
          }}
        >
          <div className="eq-transfer-divider px-5 py-3 flex items-center gap-2.5 border-b">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#8B5CF6]">
              <ArrowRightLeft className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="eq-transfer-title text-sm font-bold">Transfer Destination</h4>
              <p className="eq-transfer-body text-[11px]">At least one item is being transferred — tell us where it's going.</p>
            </div>
          </div>
          <div className="p-5">
            <label className="eq-transfer-title text-xs font-semibold mb-1.5 inline-flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" />
              Items transferred to unit
              <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={extras.transferredtounit}
              onChange={(e) => onExtraChange('transferredtounit', e.target.value)}
              placeholder="Enter unit number"
              className="eq-transfer-input w-full h-10 rounded-lg border-2 px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-[#8B5CF6] focus:ring-2 focus:ring-purple-200/50"
            />
          </div>
        </div>
      )}
    </div>
  );
}
