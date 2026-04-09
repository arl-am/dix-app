import { US_STATES, type Agent } from '../../lib/mockData';
import CustomSelect from '../../components/CustomSelect';
import DatePicker from '../../components/DatePicker';

interface Props {
  form: Record<string, string>;
  onChange: (field: string, value: string) => void;
  agents: Agent[];
}

export default function Step1Details({ form, onChange, agents }: Props) {
  const field = (name: string, label: string, opts?: { type?: string; placeholder?: string; colSpan?: boolean }) => (
    <div className={opts?.colSpan ? 'md:col-span-2 space-y-1.5' : 'space-y-1.5'}>
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
      <div className="border border-border rounded-xl p-5 bg-card space-y-4 animate-fade-in-up">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">General Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Cancellation Type</label>
            <CustomSelect
              options={[
                { value: 'Voluntary', label: 'Voluntary' },
                { value: 'Involuntary', label: 'Involuntary' },
                { value: 'Equipment Return', label: 'Equipment Return' },
                { value: 'Medical', label: 'Medical' },
                { value: 'Contract End', label: 'Contract End' },
                { value: 'Transfer Out', label: 'Transfer Out' },
              ]}
              value={form.cancellationType || ''}
              onChange={(v) => onChange('cancellationType', v)}
              placeholder="Select type..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Terminal</label>
            <CustomSelect
              options={agents.map((a) => ({ value: a.cr6cd_terminal, label: `${a.cr6cd_terminal} — ${a.cr6cd_title}` }))}
              value={form.terminal || ''}
              onChange={(v) => onChange('terminal', v)}
              placeholder="Select terminal..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Cancellation Date</label>
            <DatePicker
              value={form.cancellationDate || ''}
              onChange={(v) => onChange('cancellationDate', v)}
              placeholder="Select date"
            />
          </div>
        </div>
      </div>

      <div className="border border-border rounded-xl p-5 bg-card space-y-4 animate-fade-in-up" style={{ animationDelay: '55ms' }}>
        <h3 className="text-base font-semibold text-foreground">Driver Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {field('cxlFirstName', 'First Name')}
          {field('cxlLastName', 'Last Name')}
          {field('cxlDriverCode', 'Driver Code')}
        </div>
      </div>

      <div className="border border-border rounded-xl p-5 bg-card space-y-4 animate-fade-in-up" style={{ animationDelay: '110ms' }}>
        <h3 className="text-base font-semibold text-foreground">Vendor Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {field('cxlBusinessName', 'Business Name')}
          {field('cxlVendorCode', 'Vendor Code')}
          {field('cxlStreetAddress', 'Street Address')}
          {field('cxlCity', 'City')}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">State</label>
            <CustomSelect
              options={US_STATES.map((s) => ({ value: s, label: s }))}
              value={form.cxlState || ''}
              onChange={(v) => onChange('cxlState', v)}
              placeholder="Select state..."
            />
          </div>
          {field('cxlZipCode', 'Zip Code')}
        </div>
      </div>

      <div className="border border-border rounded-xl p-5 bg-card space-y-4 animate-fade-in-up" style={{ animationDelay: '140ms' }}>
        <h3 className="text-base font-semibold text-foreground">Truck Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {field('cxlUnitNumber', 'Unit Number')}
          {field('cxlVin', 'VIN', { placeholder: '17-character VIN' })}
        </div>
      </div>
    </div>
  );
}
