import { useMemo } from 'react';
import { cn, formatDate } from '../../lib/utils';
import DatePicker from '../../components/DatePicker';
import { tentativeReleaseDate } from '../../lib/cancellationConstants';

export interface Step3Form {
  lastitemreceived: string;
  forfeit: boolean;
  elddeposit: string;
  dashcamdeposit: string;
  pdideposit: string;
  notes: string;
  requestreturnlabel: boolean;
  rltrackingnumber: string;
  returnlabelurl: string;
}

interface Props {
  form: Step3Form;
  onChange: <K extends keyof Step3Form>(field: K, value: Step3Form[K]) => void;
  cancellationName: string;
  terminalLabel: string;
  driverName: string;
}

export default function Step4FinalRelease({ form, onChange, cancellationName, terminalLabel, driverName }: Props) {
  const tentative = useMemo(() => tentativeReleaseDate(form.lastitemreceived), [form.lastitemreceived]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border animate-fade-in">
        <span className="text-sm font-semibold text-foreground">{cancellationName}</span>
        {driverName && <><div className="w-px h-6 bg-border" /><span className="text-sm text-muted-foreground">{driverName}</span></>}
        <div className="w-px h-6 bg-border" />
        <span className="text-sm text-muted-foreground">Terminal {terminalLabel || '—'}</span>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in-up">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">Return Label</h3>
        </div>
        <div className="p-6 space-y-4">
          <label className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all duration-200',
            form.requestreturnlabel ? 'bg-primary/10 border-primary/30' : 'bg-muted/40 border-border hover:border-muted-foreground/40',
          )}>
            <input
              type="checkbox"
              checked={form.requestreturnlabel}
              onChange={(e) => onChange('requestreturnlabel', e.target.checked)}
              className="accent-primary w-4 h-4"
            />
            <span className={cn('text-sm font-medium', form.requestreturnlabel ? 'text-primary' : 'text-muted-foreground')}>
              Request a return label for the driver
            </span>
          </label>
          {form.requestreturnlabel && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Tracking Number</label>
                <input
                  type="text"
                  value={form.rltrackingnumber || ''}
                  placeholder="e.g. 8706 5380 0618"
                  onChange={(e) => onChange('rltrackingnumber', e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">Label URL</label>
                <input
                  type="text"
                  value={form.returnlabelurl || ''}
                  placeholder="SharePoint or other share link"
                  onChange={(e) => onChange('returnlabelurl', e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in-up" style={{ animationDelay: '50ms' }}>
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">Release Details</h3>
        </div>
        <div className="p-6 space-y-4">
          <label className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all duration-200',
            form.forfeit ? 'bg-destructive/10 border-destructive/30' : 'bg-muted/40 border-border hover:border-muted-foreground/40',
          )}>
            <input
              type="checkbox"
              checked={form.forfeit}
              onChange={(e) => onChange('forfeit', e.target.checked)}
              className="accent-destructive w-4 h-4"
            />
            <div>
              <span className={cn('text-sm font-semibold', form.forfeit ? 'text-destructive' : 'text-foreground')}>Forfeit</span>
              <p className="text-xs text-muted-foreground">Forfeits all deposits</p>
            </div>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">ELD Deposit ($)</label>
              <input
                type="number"
                value={form.elddeposit || ''}
                placeholder="0.00"
                onChange={(e) => onChange('elddeposit', e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">DashCam Deposit ($)</label>
              <input
                type="number"
                value={form.dashcamdeposit || ''}
                placeholder="0.00"
                onChange={(e) => onChange('dashcamdeposit', e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">PDI Deposit ($)</label>
              <input
                type="number"
                value={form.pdideposit || ''}
                placeholder="0.00"
                onChange={(e) => onChange('pdideposit', e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Last Item Received</label>
              <DatePicker value={form.lastitemreceived || ''} onChange={(v) => onChange('lastitemreceived', v)} placeholder="Pick a date" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Tentative Release Date</label>
              <div className="h-10 rounded-lg border border-input bg-muted/30 px-3 flex items-center text-sm text-muted-foreground">
                {tentative ? `${formatDate(tentative)} (Last Item + 45 days)` : 'Select Last Item Received date'}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Corporate Notes</label>
            <textarea
              placeholder="Internal notes for ops/billing..."
              value={form.notes || ''}
              onChange={(e) => onChange('notes', e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
