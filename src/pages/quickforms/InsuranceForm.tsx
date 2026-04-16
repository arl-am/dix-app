import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileDown, Shield, Sparkles, Truck, Zap } from 'lucide-react';
import { useAgents } from '../../hooks/useAgents';
import { formatCurrency } from '../../lib/utils';
import { calculatePDI } from '../../lib/pdiRates';
import { toast } from 'sonner';
import CustomSelect from '../../components/CustomSelect';
import { US_STATES } from '../../lib/mockData';
import { cn } from '../../lib/utils';
import { generateInsuranceForm, type CoverageChoice } from '../../lib/generateInsuranceForm';

export default function InsuranceForm() {
  const { data: agents = [] } = useAgents();
  const [form, setForm] = useState<Record<string, string>>({});
  const [bobtail, setBobtail] = useState<CoverageChoice>('add');
  const [physicalDamage, setPhysicalDamage] = useState<CoverageChoice>('add');
  const [bobtailPulse, setBobtailPulse] = useState(0);
  const [pdiPulse, setPdiPulse] = useState(0);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const truckValueNum = parseFloat(form.truckValue || '0');
  const pdi = useMemo(() => calculatePDI(truckValueNum), [truckValueNum]);
  const showPdiCard = truckValueNum > 0;

  const field = (name: string, label: string, opts?: { type?: string; placeholder?: string; required?: boolean }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground">
        {label}
        {opts?.required && <span className="text-destructive"> *</span>}
      </label>
      <input
        type={opts?.type || 'text'}
        placeholder={opts?.placeholder || `Enter ${label.toLowerCase()}`}
        value={form[name] || ''}
        onChange={(e) => set(name, e.target.value)}
        className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground hover:border-muted-foreground/40"
      />
    </div>
  );

  const CoverageRow = ({
    icon: Icon,
    title,
    description,
    value,
    onChange,
    pulseKey,
    onSelect,
  }: {
    icon: React.ElementType;
    title: string;
    description: string;
    value: CoverageChoice;
    onChange: (v: CoverageChoice) => void;
    pulseKey: number;
    onSelect: (v: CoverageChoice) => void;
  }) => {
    const isAdd = value === 'add';
    const handle = (choice: CoverageChoice) => {
      if (choice !== value) onSelect(choice);
      onChange(choice);
    };
    return (
      <div
        className={cn(
          'group relative flex items-center gap-4 rounded-xl border p-4 overflow-hidden',
          'transition-[background,border-color,box-shadow,transform] duration-500 ease-out',
          isAdd
            ? 'border-[#10B981]/50 bg-gradient-to-br from-emerald-500/[0.08] via-emerald-500/[0.03] to-transparent shadow-md shadow-emerald-500/10'
            : 'border-border bg-card hover:border-muted-foreground/30',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl transition-opacity duration-700',
            isAdd ? 'opacity-100 bg-emerald-500/15' : 'opacity-0',
          )}
        />
        <div className="relative">
          <span
            key={`ring-${pulseKey}`}
            aria-hidden
            className={cn(
              'absolute inset-0 rounded-xl',
              isAdd ? 'bg-[#10B981]/35' : 'bg-slate-400/30',
            )}
            style={{ animation: 'pulse-ring 0.65s ease-out' }}
          />
          <div
            key={`icon-${pulseKey}`}
            className={cn(
              'relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500',
              isAdd
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/40 scale-100'
                : 'bg-muted text-muted-foreground shadow-none scale-95',
            )}
            style={{ animation: 'pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            <Icon className="w-5 h-5" strokeWidth={2.2} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div
          role="radiogroup"
          aria-label={title}
          className="relative inline-flex h-10 items-center rounded-xl bg-muted/80 p-1 shadow-inner backdrop-blur-sm"
        >
          <span
            aria-hidden
            className={cn(
              'absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg shadow-md will-change-transform',
              isAdd
                ? 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 shadow-emerald-500/40'
                : 'bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 shadow-slate-500/30',
            )}
            style={{
              left: '4px',
              transform: isAdd ? 'translateX(0)' : 'translateX(calc(100% + 0px))',
              transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease-out, box-shadow 0.3s ease-out',
            }}
          />
          {(['add', 'decline'] as const).map((choice) => {
            const active = value === choice;
            return (
              <button
                key={choice}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => handle(choice)}
                className={cn(
                  'relative z-10 w-20 h-8 text-xs font-semibold rounded-lg transition-all duration-200 active:scale-[0.93]',
                  active ? 'text-white' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {choice === 'add' ? 'Add' : 'Decline'}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const handleGenerate = () => {
    if (!form.terminal) { toast.error('Please select a terminal'); return; }
    if (!form.driverName?.trim()) { toast.error('Driver Name is required'); return; }
    if (!form.businessName?.trim()) { toast.error('Business Name is required'); return; }
    if (!form.truckValue?.trim() || truckValueNum <= 0) { toast.error('Truck Value is required'); return; }

    const cityStateZip = [
      form.city?.trim(),
      [form.state?.trim(), form.zip?.trim()].filter(Boolean).join(' '),
    ].filter(Boolean).join(', ');

    generateInsuranceForm({
      terminalNumber: form.terminal,
      driverName: form.driverName.trim(),
      businessName: form.businessName.trim(),
      address: form.address?.trim() || '',
      cityStateZip,
      truckYear: form.year?.trim() || '',
      truckModel: form.model?.trim() || '',
      truckVin: form.vin?.trim() || '',
      statedValue: form.truckValue.trim(),
      lienholderName: form.lienholderName?.trim() || 'N/A',
      lienholderAddress: form.lienholderAddress?.trim() || 'N/A',
      bobtail,
      physicalDamage,
    });
    toast.success('Insurance Form PDF generated!');
  };

  return (
    <div className="p-6 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/documents" className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-input bg-background shadow-sm transition-all duration-200 hover:bg-accent active:scale-95">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#F59E0B]/10 dark:bg-[#F59E0B]/20 dark:ring-1 dark:ring-[#F59E0B]/20">
            <Shield className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Insurance Form</h1>
            <p className="text-sm text-muted-foreground">Request Bobtail and/or Physical Damage Insurance</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '55ms' }}>
          <h3 className="text-base font-semibold text-foreground">Driver & Terminal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Terminal <span className="text-destructive">*</span></label>
              <CustomSelect
                options={agents.map((a) => ({ value: a.cr6cd_terminal, label: a.cr6cd_title }))}
                value={form.terminal || ''}
                onChange={(v) => set('terminal', v)}
                placeholder="Select terminal..."
              />
            </div>
            {field('driverName', "Driver's Full Name", { required: true })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '90ms' }}>
          <h3 className="text-base font-semibold text-foreground">Business Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field('businessName', 'Business Name', { required: true })}
            {field('address', 'Address')}
            {field('city', 'City')}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">State</label>
              <CustomSelect
                options={US_STATES.map((s) => ({ value: s, label: s }))}
                value={form.state || ''}
                onChange={(v) => set('state', v)}
                placeholder="Select state..."
              />
            </div>
            {field('zip', 'Zip Code', { placeholder: '12345' })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '125ms' }}>
          <h3 className="text-base font-semibold text-foreground">Coverage Selection</h3>
          <div className="space-y-3">
            <CoverageRow
              icon={Truck}
              title="Bobtail Insurance"
              description="Liability coverage when driving the tractor without a trailer."
              value={bobtail}
              onChange={setBobtail}
              pulseKey={bobtailPulse}
              onSelect={() => setBobtailPulse((k) => k + 1)}
            />
            <CoverageRow
              icon={Zap}
              title="Physical Damage Insurance"
              description="Covers damage to the tractor itself (collision, fire, theft)."
              value={physicalDamage}
              onChange={setPhysicalDamage}
              pulseKey={pdiPulse}
              onSelect={() => setPdiPulse((k) => k + 1)}
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '160ms' }}>
          <h3 className="text-base font-semibold text-foreground">Tractor</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {field('year', 'Year', { placeholder: 'e.g. 2022' })}
            {field('model', 'Model', { placeholder: 'e.g. Conventional' })}
            {field('vin', 'VIN', { placeholder: '17-character VIN' })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Stated Value ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.truckValue || ''}
                  onChange={(e) => set('truckValue', e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background pl-7 pr-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground hover:border-muted-foreground/40"
                />
              </div>
            </div>
          </div>

          <div
            className={cn(
              'overflow-hidden transition-all duration-500 ease-out',
              showPdiCard ? 'max-h-96 opacity-100 translate-y-0 mt-2' : 'max-h-0 opacity-0 -translate-y-2',
            )}
            aria-hidden={!showPdiCard}
          >
            {pdi.pdiMonthly > 0 ? (
              <div className="relative rounded-xl p-[1px] bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 shadow-lg shadow-amber-500/10">
                <div className="relative rounded-[11px] bg-card p-5 overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
                  <div className="relative flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm shadow-amber-500/30">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monthly PDI</p>
                      <p className="text-3xl font-bold text-foreground tabular-nums leading-tight">{formatCurrency(pdi.pdiMonthly)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                Truck value is outside the supported PDI range.
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '195ms' }}>
          <div>
            <h3 className="text-base font-semibold text-foreground">Tractor Lienholder</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Leave blank for N/A.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field('lienholderName', 'Lienholder Name', { placeholder: 'N/A' })}
            {field('lienholderAddress', 'Lienholder Address', { placeholder: 'N/A' })}
          </div>
        </div>

        <div className="flex justify-end gap-3 animate-fade-in-up" style={{ animationDelay: '230ms' }}>
          <Link to="/documents" className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-9 px-4 py-2 border border-input bg-background shadow-sm transition-all duration-200 hover:bg-accent active:scale-95">Cancel</Link>
          <button onClick={handleGenerate} className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-9 px-4 py-2 bg-[#F59E0B] text-white transition-all duration-200 hover:bg-[#D97706] hover:shadow-lg hover:shadow-amber-500/25 active:scale-95">
            <FileDown className="w-4 h-4" /> Generate PDF
          </button>
        </div>
      </div>
    </div>
  );
}
