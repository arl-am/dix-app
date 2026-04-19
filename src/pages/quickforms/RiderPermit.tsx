import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileDown, Users, CalendarDays, DollarSign, Hash, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { useAgents } from '../../hooks/useAgents';
import { toast } from 'sonner';
import CustomSelect from '../../components/CustomSelect';
import DatePicker from '../../components/DatePicker';
import { generateRiderPermit } from '../../lib/generateRiderPermit';
import { useCreateRiderPermit } from '../../hooks/useCreateRiderPermit';
import { cn } from '../../lib/utils';
import mondayLogo from '../../assets/monday-logo.png';
import { assetUrl } from '../../utils/assetUrl';
import RiderPermitHistory from './RiderPermitHistory';

const MONDAY_FORM_URL = 'https://forms.monday.com/forms/e941a480c090c87dca48d740ec321f30?r=use1';

function parseLocalDate(iso: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function daysBetweenInclusive(start: Date, end: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
}

function rateForDays(days: number): { display: string; value: number } | null {
  if (days < 1 || days > 30) return null;
  if (days === 1) return { display: '$3.00', value: 3 };
  if (days <= 3) return { display: '$7.00', value: 7 };
  if (days <= 5) return { display: '$11.00', value: 11 };
  if (days <= 7) return { display: '$14.00', value: 14 };
  if (days <= 10) return { display: '$18.00', value: 18 };
  if (days <= 14) return { display: '$23.00', value: 23 };
  if (days <= 17) return { display: '$27.00', value: 27 };
  if (days <= 21) return { display: '$32.00', value: 32 };
  return { display: '$38.00', value: 38 };
}

export default function RiderPermit() {
  const { data: agents = [] } = useAgents();
  const [form, setForm] = useState<Record<string, string>>({});
  const [proNumber, setProNumber] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'generate' | 'download' | 'monday' | null>(null);
  const createPermitMut = useCreateRiderPermit();
  const queryClient = useQueryClient();

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const dateInfo = useMemo(() => {
    const start = parseLocalDate(form.permitStartDate || '');
    const end = parseLocalDate(form.permitEndDate || '');
    if (!start || !end) {
      return { state: 'pending' as const, days: null as number | null, rate: null as ReturnType<typeof rateForDays> };
    }
    if (end.getTime() < start.getTime()) {
      return { state: 'invalid' as const, days: null, rate: null };
    }
    const days = daysBetweenInclusive(start, end);
    if (days > 30) {
      return { state: 'exceeds' as const, days, rate: null };
    }
    return { state: 'valid' as const, days, rate: rateForDays(days) };
  }, [form.permitStartDate, form.permitEndDate]);

  const field = (name: string, label: string, opts?: { type?: string; placeholder?: string; disabled?: boolean }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <input
        type={opts?.type || 'text'}
        placeholder={opts?.placeholder || `Enter ${label.toLowerCase()}`}
        value={form[name] || ''}
        onChange={(e) => set(name, e.target.value)}
        disabled={opts?.disabled}
        className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground hover:border-muted-foreground/40 disabled:bg-muted/40 disabled:text-muted-foreground disabled:cursor-not-allowed"
      />
    </div>
  );

  const locked = proNumber !== null;

  const validate = (): string | null => {
    if (!form.terminal) return 'Please select a terminal';
    if (!form.driverName?.trim()) return 'Driver Name is required';
    if (!form.businessName?.trim()) return 'Business Name is required';
    if (!form.unitNumber?.trim()) return 'Unit Number is required';
    if (!form.riderFirstName?.trim()) return 'Passenger First Name is required';
    if (!form.riderLastName?.trim()) return 'Passenger Last Name is required';
    if (!form.permitStartDate) return 'Start Date is required';
    if (!form.permitEndDate) return 'End Date is required';
    if (dateInfo.state === 'invalid') return 'End date must be on or after start date';
    if (dateInfo.state === 'exceeds') return 'Maximum 30 days allowed';
    if (!dateInfo.rate) return 'Invalid date range';
    return null;
  };

  const buildPdfAndDownload = async (pro: string) => {
    await generateRiderPermit({
      driverName: form.driverName.trim(),
      businessName: form.businessName.trim(),
      unitNumber: form.unitNumber.trim(),
      proNumber: pro,
      passengerName: `${form.riderFirstName.trim()} ${form.riderLastName.trim()}`.trim(),
      permitStartDate: form.permitStartDate,
      permitEndDate: form.permitEndDate,
    });
  };

  const handleGenerate = async () => {
    const error = validate();
    if (error) { toast.error(error); return; }
    if (!dateInfo.rate || dateInfo.days == null) return;

    setBusyAction('generate');
    const toastId = toast.loading('Assigning PRO number...');
    try {
      const created = await createPermitMut.mutateAsync({
        driverName: form.driverName.trim(),
        businessName: form.businessName.trim(),
        terminalCode: form.terminal,
        unitNumber: form.unitNumber.trim(),
        passengerName: `${form.riderFirstName.trim()} ${form.riderLastName.trim()}`.trim(),
        permitStartDate: form.permitStartDate,
        permitEndDate: form.permitEndDate,
        rate: dateInfo.rate.value,
        daysCovered: dateInfo.days,
      });
      if (!created.proNumber) {
        toast.error('PRO Number was not returned. Check the Dataverse autonumber column.', { id: toastId });
        return;
      }
      setProNumber(created.proNumber);
      toast.loading('Generating PDF...', { id: toastId });
      await buildPdfAndDownload(created.proNumber);
      toast.success(`PRO ${created.proNumber} assigned and PDF downloaded`, { id: toastId });
      queryClient.invalidateQueries({ queryKey: ['rider-permits'] });
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`, { id: toastId });
    } finally {
      setBusyAction(null);
    }
  };

  const handleReDownload = async () => {
    if (!proNumber) return;
    setBusyAction('download');
    try {
      await buildPdfAndDownload(proNumber);
      toast.success('PDF downloaded');
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setBusyAction(null);
    }
  };

  const handleOpenMondayBoard = () => {
    if (!proNumber) {
      toast.error('No PRO Number assigned. Please generate a PRO Number first.');
      return;
    }
    setBusyAction('monday');
    const url = `${MONDAY_FORM_URL}&DriverName=${encodeURIComponent(form.driverName)}&Terminal=${encodeURIComponent(form.terminal)}&PRONumber=${encodeURIComponent(proNumber)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => setBusyAction(null), 400);
  };

  return (
    <div className="p-6 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/documents" className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-input bg-background shadow-sm transition-all duration-200 hover:bg-accent active:scale-95">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#2563EB]/10 dark:bg-[#2563EB]/20 dark:ring-1 dark:ring-[#2563EB]/20">
            <Users className="w-5 h-5 text-[#2563EB]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Rider Permit</h1>
            <p className="text-sm text-muted-foreground">Generate rider permit forms for passenger authorization</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        {locked && (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] dark:bg-emerald-500/10 p-4 flex items-start gap-3 animate-fade-in-up">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-foreground">PRO Number {proNumber} assigned</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permit saved. To create a permit for a different driver, close this form and reopen it.
              </p>
            </div>
          </div>
        )}

        <div className={cn('bg-card border border-border rounded-xl shadow-sm p-6 space-y-4 animate-fade-in-up', locked && 'opacity-90')} style={{ animationDelay: '55ms' }}>
          <h3 className="text-base font-semibold text-foreground">Driver & Terminal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Terminal <span className="text-destructive">*</span></label>
              <CustomSelect
                options={agents.map((a) => ({ value: a.cr6cd_terminal, label: a.cr6cd_title }))}
                value={form.terminal || ''}
                onChange={(v) => set('terminal', v)}
                placeholder="Select terminal..."
                disabled={locked}
              />
            </div>
            {field('driverName', 'Driver Name', { disabled: locked })}
            {field('businessName', 'Business Name (IBE)', { disabled: locked })}
            {field('unitNumber', 'Unit Number', { disabled: locked })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '110ms' }}>
          <h3 className="text-base font-semibold text-foreground">Passenger Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field('riderFirstName', 'First Name', { disabled: locked })}
            {field('riderLastName', 'Last Name', { disabled: locked })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '140ms' }}>
          <h3 className="text-base font-semibold text-foreground">Permit Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Start Date <span className="text-destructive">*</span></label>
              <DatePicker value={form.permitStartDate || ''} onChange={(v) => set('permitStartDate', v)} placeholder="Select start date" disabled={locked} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">End Date <span className="text-destructive">*</span></label>
              <DatePicker value={form.permitEndDate || ''} onChange={(v) => set('permitEndDate', v)} placeholder="Select end date" disabled={locked} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <StatTile
              icon={CalendarDays}
              label="Days Covered"
              value={dateInfo.days != null ? String(dateInfo.days) : '—'}
              sub={dateInfo.state === 'pending' ? 'Select both dates' : dateInfo.state === 'invalid' ? 'End before start' : dateInfo.days === 1 ? 'day' : 'days'}
              tone={dateInfo.state === 'valid' ? 'primary' : dateInfo.state === 'exceeds' ? 'danger' : 'muted'}
            />
            <StatTile
              icon={DollarSign}
              label="Rate"
              value={dateInfo.rate?.display || '—'}
              sub={dateInfo.state === 'pending' ? 'Select both dates' : dateInfo.state === 'exceeds' ? 'Max 30 days' : dateInfo.state === 'invalid' ? 'Invalid range' : 'per permit'}
              tone={dateInfo.rate ? 'success' : dateInfo.state === 'exceeds' ? 'danger' : 'muted'}
            />
            <StatTile
              icon={Hash}
              label="PRO Number"
              value={proNumber || 'Pending'}
              sub={proNumber ? 'assigned' : 'Available after generating'}
              tone={proNumber ? 'primary' : 'muted'}
            />
          </div>

          {dateInfo.state === 'exceeds' && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-700 dark:text-red-300 animate-fade-in-up">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Maximum 30 days allowed per permit. Adjust the end date.</span>
            </div>
          )}
          {dateInfo.state === 'invalid' && (
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-700 dark:text-red-300 animate-fade-in-up">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>End date must be on or after the start date.</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 animate-fade-in-up" style={{ animationDelay: '170ms' }}>
          <Link to="/documents" className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-10 px-4 py-2 border border-input bg-background shadow-sm transition-all duration-200 hover:bg-accent active:scale-95">
            Cancel
          </Link>

          {locked ? (
            <>
              <button
                onClick={handleReDownload}
                disabled={busyAction !== null}
                className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-10 px-4 py-2 border border-input bg-background shadow-sm transition-all duration-200 hover:bg-accent active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                <FileDown className="w-4 h-4" /> {busyAction === 'download' ? 'Downloading...' : 'Download PDF Again'}
              </button>
              <button
                onClick={handleOpenMondayBoard}
                disabled={busyAction !== null}
                className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold h-10 px-4 py-2 bg-gradient-to-r from-[#FF3D57] to-[#FF158A] text-white shadow-md shadow-[#FF3D57]/25 transition-all duration-200 hover:shadow-lg hover:shadow-[#FF3D57]/40 hover:translate-x-0.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                <img src={assetUrl(mondayLogo)} alt="" className="w-4 h-4" />
                Enter in Rider Permit Board
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={busyAction !== null || dateInfo.state === 'exceeds' || dateInfo.state === 'invalid'}
              className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold h-10 px-4 py-2 bg-[#2563EB] text-white shadow-md shadow-primary/25 transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-lg hover:shadow-primary/40 hover:translate-x-0.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              <FileDown className="w-4 h-4" /> {busyAction === 'generate' ? 'Generating...' : 'Generate PDF'}
            </button>
          )}
        </div>

        <RiderPermitHistory />
      </div>
    </div>
  );
}

type Tone = 'primary' | 'success' | 'danger' | 'muted';
const TONE_MAP: Record<Tone, { ring: string; valueColor: string; iconBg: string; iconColor: string }> = {
  primary: { ring: 'border-primary/25 bg-primary/[0.04] dark:bg-primary/10', valueColor: 'text-primary', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
  success: { ring: 'border-emerald-500/25 bg-emerald-500/[0.04] dark:bg-emerald-500/10', valueColor: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  danger: { ring: 'border-red-500/25 bg-red-500/[0.04] dark:bg-red-500/10', valueColor: 'text-red-600 dark:text-red-400', iconBg: 'bg-red-500/10', iconColor: 'text-red-600 dark:text-red-400' },
  muted: { ring: 'border-border bg-muted/30 dark:bg-muted/10', valueColor: 'text-muted-foreground', iconBg: 'bg-muted/60 dark:bg-muted/40', iconColor: 'text-muted-foreground' },
};

function StatTile({ icon: Icon, label, value, sub, tone }: { icon: React.ElementType; label: string; value: string; sub: string; tone: Tone }) {
  const t = TONE_MAP[tone];
  return (
    <div
      key={`${tone}-${value}`}
      className={cn('relative rounded-xl border p-3.5 transition-all duration-300 animate-fade-in-up', t.ring)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className={cn('text-2xl font-bold leading-none mt-1.5 tabular-nums', t.valueColor)}>{value}</div>
          <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
        </div>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', t.iconBg)}>
          <Icon className={cn('w-4 h-4', t.iconColor)} />
        </div>
      </div>
    </div>
  );
}
