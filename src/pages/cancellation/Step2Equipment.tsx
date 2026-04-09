import { cn } from '../../lib/utils';
import CustomSelect from '../../components/CustomSelect';

const EQUIPMENT_ITEMS = ['ELD', 'DashCam', 'Door Signs', 'IFTA', 'PrePass', 'RFID', 'Trailer Lock', 'Logs'];

interface Props {
  equipment: Record<string, boolean>;
  onToggle: (key: string) => void;
  plateOption: string;
  onPlateChange: (v: string) => void;
  transferEquipment: boolean;
  onTransferChange: (v: boolean) => void;
  form: Record<string, string>;
}

export default function Step2Equipment({ equipment, onToggle, plateOption, onPlateChange, transferEquipment, onTransferChange, form }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border animate-fade-in">
        <span className="text-sm text-muted-foreground">{form.cxlFirstName || 'No'} {form.cxlLastName || 'Driver'}</span>
        <div className="w-px h-6 bg-border" />
        <span className="text-sm text-muted-foreground">{form.terminal || 'No Terminal'}</span>
        <div className="w-px h-6 bg-border" />
        <span className="text-sm font-medium text-foreground">{form.cxlUnitNumber || '—'}</span>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in-up">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">Equipment Required</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg bg-muted/40 border border-border">
            {EQUIPMENT_ITEMS.map((item) => (
              <label
                key={item}
                className={cn(
                  'flex items-center gap-2 select-none px-3 py-2 rounded-lg border cursor-pointer',
                  'transition-all duration-200',
                  equipment[item]
                    ? 'bg-primary/10 border-primary/30 text-primary shadow-sm'
                    : 'bg-background border-border text-foreground hover:border-muted-foreground/40',
                )}
              >
                <input
                  type="checkbox"
                  checked={!!equipment[item]}
                  onChange={() => onToggle(item)}
                  className="accent-primary w-4 h-4"
                />
                <span className="text-sm font-medium">{item}</span>
                {equipment[item] && <span className="text-xs text-primary/70">Required</span>}
              </label>
            ))}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background">
              <span className="text-sm font-medium">Plate</span>
              <CustomSelect
                options={[
                  { value: 'No Fleet', label: 'No Fleet' },
                  { value: 'Fleet 1', label: 'Fleet 1' },
                  { value: 'Fleet 2', label: 'Fleet 2' },
                ]}
                value={plateOption}
                onChange={onPlateChange}
                triggerClassName="h-8 min-w-[120px]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in-up" style={{ animationDelay: '55ms' }}>
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">Transfer Equipment</h3>
        </div>
        <div className="p-6">
          <label className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all duration-200',
            transferEquipment ? 'bg-primary/10 border-primary/30' : 'bg-muted/40 border-border hover:border-muted-foreground/40',
          )}>
            <input type="checkbox" checked={transferEquipment} onChange={(e) => onTransferChange(e.target.checked)} className="accent-primary w-4 h-4" />
            <span className={cn('text-sm font-medium', transferEquipment ? 'text-primary' : 'text-muted-foreground')}>
              {transferEquipment ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
