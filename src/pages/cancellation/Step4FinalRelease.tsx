import { cn } from '../../lib/utils';
import DatePicker from '../../components/DatePicker';

const RECEIVED_ITEMS = ['ELD', 'DashCam', 'Door Signs', 'IFTA', 'PrePass', 'RFID', 'Logs', 'Trailer Lock', 'Plate'];

interface Props {
  form: Record<string, string>;
  onChange: (field: string, value: string) => void;
  forfeit: boolean;
  onForfeitChange: (v: boolean) => void;
}

export default function Step4FinalRelease({ form, onChange, forfeit, onForfeitChange }: Props) {
  const lastItemDate = form.lastItemReceived ? new Date(form.lastItemReceived) : null;
  const tentativeDate = lastItemDate ? new Date(lastItemDate.getTime() + 45 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null;

  const field = (name: string, label: string, opts?: { type?: string; placeholder?: string }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <input
        type={opts?.type || 'text'}
        placeholder={opts?.placeholder}
        value={form[name] || ''}
        onChange={(e) => onChange(name, e.target.value)}
        className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground hover:border-muted-foreground/40"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border animate-fade-in">
        <span className="text-sm font-semibold text-foreground">{form.cxlFirstName || 'Marcus'} {form.cxlLastName || 'Johnson'}</span>
        <div className="w-px h-6 bg-border" />
        <span className="text-sm text-muted-foreground">{form.cxlUnitNumber || 'U30845'}</span>
        <div className="w-px h-6 bg-border" />
        <span className="text-sm text-muted-foreground">{form.cxlCity || 'Los Angeles'}</span>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in-up">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">Items Received</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
            {RECEIVED_ITEMS.map((item) => (
              <div key={item} className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted/50 text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in-up" style={{ animationDelay: '55ms' }}>
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">Deposits & Release Details</h3>
        </div>
        <div className="p-6 space-y-4">
          <label className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all duration-200',
            forfeit ? 'bg-destructive/10 border-destructive/30' : 'bg-muted/40 border-border hover:border-muted-foreground/40',
          )}>
            <input type="checkbox" checked={forfeit} onChange={(e) => onForfeitChange(e.target.checked)} className="accent-destructive w-4 h-4" />
            <div>
              <span className={cn('text-sm font-semibold', forfeit ? 'text-destructive' : 'text-foreground')}>Forfeit</span>
              <p className="text-xs text-muted-foreground">Forfeits all deposits</p>
            </div>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Unit's Start Date</label>
              <DatePicker value={form.unitStartDate || ''} onChange={(v) => onChange('unitStartDate', v)} placeholder="Pick a date" />
            </div>
            {field('cancellationReason', 'Cancellation Reason', { placeholder: 'Enter reason' })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {field('eldDeposit', 'ELD Deposit ($)', { type: 'number', placeholder: '0.00' })}
            {field('dashcamDeposit', 'DashCam Deposit ($)', { type: 'number', placeholder: '0.00' })}
            {field('pdiDeposit', 'PDI Deposit ($)', { type: 'number', placeholder: '0.00' })}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Corporate Notes</label>
            <textarea
              placeholder="Enter notes..."
              value={form.corporateNotes || ''}
              onChange={(e) => onChange('corporateNotes', e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground hover:border-muted-foreground/40 resize-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Last Item Received</label>
              <DatePicker value={form.lastItemReceived || ''} onChange={(v) => onChange('lastItemReceived', v)} placeholder="Pick a date" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Tentative Release Date</label>
              <div className="h-10 rounded-lg border border-input bg-muted/30 px-3 flex items-center text-sm text-muted-foreground">
                {tentativeDate ? `${tentativeDate} (Last Item + 45 days)` : 'Select Last Item Received date'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
