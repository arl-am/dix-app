import { useMemo } from 'react';
import { ArrowRightLeft, Truck } from 'lucide-react';
import CustomSelect from '../../components/CustomSelect';
import DatePicker from '../../components/DatePicker';
import EquipmentRequirementCard from './EquipmentRequirementCard';
import { EQUIPMENT_LIFECYCLE } from '../../lib/cancellationConstants';
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
  onUpdate: (equipmentId: string, lifecycleState: number) => void;
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
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-8 rounded-md border border-input bg-white/80 px-2.5 text-xs shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

export default function Step2Equipment({ equipment, isLoading, onUpdate, extras, onExtraChange }: Props) {
  const sorted = useMemo(
    () => [...equipment].sort((a, b) => a.cr6cd_displayname.localeCompare(b.cr6cd_displayname)),
    [equipment],
  );

  const anyTransferred = sorted.some((e) => e.cr6cd_lifecyclestate === EQUIPMENT_LIFECYCLE.TRANSFERRED);

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in-up">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">Equipment & Returns</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tag each item as Required, Not Required, Transferred, or Reactivated. Returns are tracked in the modal.
          </p>
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
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fleet</label>
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
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Logs Date Range</label>
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
                    onUpdate={(s) => onUpdate(item.cr6cd_dixcxlequipmentid, s)}
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
          className="rounded-xl border-2 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
            borderColor: '#C4B5FD',
            animation: 'fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
          }}
        >
          <div className="px-5 py-3 flex items-center gap-2.5 border-b border-purple-200/60">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#8B5CF6' }}>
              <ArrowRightLeft className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-purple-900">Transfer Destination</h4>
              <p className="text-[11px] text-purple-700">At least one item is being transferred — tell us where it's going.</p>
            </div>
          </div>
          <div className="p-5">
            <label className="text-xs font-semibold text-purple-900 mb-1.5 inline-flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" />
              Items transferred to unit
              <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              value={extras.transferredtounit}
              onChange={(e) => onExtraChange('transferredtounit', e.target.value)}
              placeholder="Enter unit number"
              className="w-full h-10 rounded-lg border-2 border-purple-300 bg-white/80 px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-[#8B5CF6] focus:ring-2 focus:ring-purple-200 placeholder:text-purple-400/70"
            />
          </div>
        </div>
      )}
    </div>
  );
}
