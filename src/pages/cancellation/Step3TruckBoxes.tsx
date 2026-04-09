import { cn } from '../../lib/utils';
import { US_STATES } from '../../lib/mockData';
import CustomSelect from '../../components/CustomSelect';

const BOX_ITEMS = [
  'BOLs','Log Book','Insurance Card','Green Regulation Book','Zip Ties','Door Strap','Door Signs',
  'IFTA Stickers','Pre-Pass','ELD','Dash Cam','Fuel Card','RFID Tag','Hazmat Books','MD Liquor',
];

interface Props {
  form: Record<string, string>;
  onChange: (field: string, value: string) => void;
  boxContents: Record<string, boolean>;
  onBoxToggle: (item: string) => void;
  sameAsDriver: boolean;
  onSameAsDriverChange: (v: boolean) => void;
}

export default function Step3TruckBoxes({ form, onChange, boxContents, onBoxToggle, sameAsDriver, onSameAsDriverChange }: Props) {
  const selectedCount = Object.values(boxContents).filter(Boolean).length;

  const field = (name: string, label: string, opts?: { type?: string; placeholder?: string }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <input
        type={opts?.type || 'text'}
        placeholder={opts?.placeholder || `Enter ${label.toLowerCase()}`}
        value={form[name] || ''}
        onChange={(e) => onChange(name, e.target.value)}
        className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground hover:border-muted-foreground/40"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in-up">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">Shipping Details</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Configure shipping and delivery information</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {field('boxFirstName', 'First Name')}
            {field('boxLastName', 'Last Name')}
            {field('boxUnitNumber', 'Unit Number')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Sending To</label>
              <CustomSelect
                options={[
                  { value: 'Terminal', label: 'Terminal' },
                  { value: 'Driver', label: 'Driver' },
                  { value: 'Corporate', label: 'Corporate' },
                ]}
                value={form.boxSendingTo || ''}
                onChange={(v) => onChange('boxSendingTo', v)}
                placeholder="Select destination"
              />
            </div>
            {field('boxReceiverName', 'Receiver Name')}
            {field('boxReceiverPhone', 'Receiver Phone', { type: 'tel' })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Delivery Type</label>
              <CustomSelect
                options={[
                  { value: 'Priority', label: 'Priority' },
                  { value: 'Overnight', label: 'Overnight (By 10:00 AM)' },
                ]}
                value={form.boxDeliveryType || ''}
                onChange={(v) => onChange('boxDeliveryType', v)}
                placeholder="Select delivery type"
              />
            </div>
            {field('boxBillingInfo', 'Billing Info')}
            {field('boxTruckColor', 'Truck Color')}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in-up" style={{ animationDelay: '55ms' }}>
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">Delivery Address</h3>
        </div>
        <div className="p-6 space-y-4">
          <label className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-200',
            sameAsDriver ? 'bg-primary/10 border-primary/30' : 'bg-muted/40 border-border',
          )}>
            <input type="checkbox" checked={sameAsDriver} onChange={(e) => onSameAsDriverChange(e.target.checked)} className="accent-primary w-4 h-4" />
            <span className="text-sm font-medium">Same as Driver Address</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {field('boxStreet', 'Street')}
            {field('boxCity', 'City')}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">State</label>
              <CustomSelect
                options={US_STATES.map((s) => ({ value: s, label: s }))}
                value={form.boxState || ''}
                onChange={(v) => onChange('boxState', v)}
                placeholder="Select state"
              />
            </div>
            {field('boxZipCode', 'Zip Code')}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in-up" style={{ animationDelay: '110ms' }}>
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Box Contents</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Select items to include in the truck box</p>
          </div>
          {selectedCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-white animate-pop">
              {selectedCount} items selected
            </span>
          )}
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {BOX_ITEMS.map((item) => (
              <label
                key={item}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer text-sm font-medium',
                  'transition-all duration-200',
                  boxContents[item]
                    ? 'bg-primary/10 border-primary/30 text-primary shadow-sm'
                    : 'bg-background border-border text-foreground hover:border-muted-foreground/40',
                )}
              >
                <input type="checkbox" checked={!!boxContents[item]} onChange={() => onBoxToggle(item)} className="accent-primary w-3.5 h-3.5" />
                {item}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm p-6 animate-fade-in-up" style={{ animationDelay: '140ms' }}>
        <div className="space-y-1.5 max-w-sm">
          <label className="text-sm font-medium text-muted-foreground">Cable Type</label>
          <CustomSelect
            options={[
              { value: 'USB-C', label: 'USB-C' },
              { value: 'Micro USB', label: 'Micro USB' },
              { value: 'Lightning', label: 'Lightning' },
            ]}
            value={form.boxCableType || ''}
            onChange={(v) => onChange('boxCableType', v)}
            placeholder="Select cable type"
          />
        </div>
      </div>
    </div>
  );
}
