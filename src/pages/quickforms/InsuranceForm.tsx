import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileDown, Shield, Calculator } from 'lucide-react';
import { useAgents } from '../../hooks/useAgents';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';
import CustomSelect from '../../components/CustomSelect';
import DatePicker from '../../components/DatePicker';

export default function InsuranceForm() {
  const { data: agents = [] } = useAgents();
  const [form, setForm] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const selectedAgent = agents.find((a) => a.cr6cd_terminal === form.terminal);

  const pdiCalc = useMemo(() => {
    const truckValue = parseFloat(form.truckValue || '0');
    if (!truckValue) return { monthly: 0, deposit: 0, weekly: 0 };
    const rate = 0.012;
    const monthly = truckValue * rate;
    const deposit = monthly;
    const weekly = deposit / 4;
    return { monthly, deposit, weekly };
  }, [form.truckValue]);

  const field = (name: string, label: string, opts?: { type?: string; placeholder?: string }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <input type={opts?.type || 'text'} placeholder={opts?.placeholder || `Enter ${label.toLowerCase()}`} value={form[name] || ''} onChange={(e) => set(name, e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground hover:border-muted-foreground/40" />
    </div>
  );

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
            <p className="text-sm text-muted-foreground">Generate insurance enrollment forms with PDI calculation</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '55ms' }}>
              <h3 className="text-base font-semibold text-foreground">Driver & Terminal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Terminal</label>
                  <CustomSelect
                    options={agents.map((a) => ({ value: a.cr6cd_terminal, label: `${a.cr6cd_terminal} — ${a.cr6cd_title}` }))}
                    value={form.terminal || ''}
                    onChange={(v) => set('terminal', v)}
                    placeholder="Select terminal..."
                  />
                </div>
                {field('driverName', 'Driver Name')}
                {field('driverCode', 'Driver Code')}
                {field('unitNumber', 'Unit Number')}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '110ms' }}>
              <h3 className="text-base font-semibold text-foreground">Vehicle & Insurance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {field('truckValue', 'Truck Value ($)', { type: 'number', placeholder: '0.00' })}
                {field('vin', 'VIN', { placeholder: '17-character VIN' })}
                {field('year', 'Year')}
                {field('make', 'Make')}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '140ms' }}>
              <h3 className="text-base font-semibold text-foreground">Coverage Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Coverage Type</label>
                  <CustomSelect
                    options={[
                      { value: 'Full Coverage', label: 'Full Coverage' },
                      { value: 'Liability Only', label: 'Liability Only' },
                      { value: 'PDI Only', label: 'PDI Only' },
                    ]}
                    value={form.coverageType || ''}
                    onChange={(v) => set('coverageType', v)}
                    placeholder="Select coverage..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">Effective Date</label>
                  <DatePicker value={form.effectiveDate || ''} onChange={(v) => set('effectiveDate', v)} placeholder="Select date" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 animate-fade-in-up" style={{ animationDelay: '170ms' }}>
              <Link to="/documents" className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-9 px-4 py-2 border border-input bg-background shadow-sm transition-all duration-200 hover:bg-accent active:scale-95">Cancel</Link>
              <button onClick={() => toast.success('Insurance Form PDF generated!')} className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-9 px-4 py-2 bg-[#F59E0B] text-white transition-all duration-200 hover:bg-[#D97706] hover:shadow-lg hover:shadow-amber-500/25 active:scale-95">
                <FileDown className="w-4 h-4" /> Generate PDF
              </button>
            </div>
          </div>

          <div className="lg:sticky lg:top-4 self-start animate-fade-in-up" style={{ animationDelay: '110ms' }}>
            <div className="bg-card border border-border/60 shadow-xl rounded-xl overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-amber-600 to-amber-500">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-white" />
                  <h3 className="text-base font-bold text-white">PDI Calculator</h3>
                </div>
                <p className="text-sm text-amber-100 mt-0.5">Based on truck value</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Truck Value</span>
                  <span className="text-sm font-semibold tabular-nums">{form.truckValue ? formatCurrency(parseFloat(form.truckValue)) : '—'}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monthly PDI</span>
                  <span className="text-sm font-semibold tabular-nums">{formatCurrency(pdiCalc.monthly)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">PDI Deposit (4x)</span>
                  <span className="text-sm font-semibold tabular-nums">{formatCurrency(pdiCalc.deposit)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Weekly Deduction</span>
                  <span className="text-sm font-semibold tabular-nums">{formatCurrency(pdiCalc.weekly)}</span>
                </div>
                {selectedAgent && (
                  <>
                    <div className="h-px bg-border" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Occ/Acc Monthly</span>
                      <span className="text-sm font-semibold tabular-nums">{formatCurrency(selectedAgent.cr6cd_occaccmonthly)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Bobtail Monthly</span>
                      <span className="text-sm font-semibold tabular-nums">{formatCurrency(selectedAgent.cr6cd_bobtailvalue)}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="px-5 py-4 bg-gradient-to-r from-amber-600 to-amber-500">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-amber-100">Est. Monthly Total</span>
                  <span className="text-xl font-bold text-white tabular-nums">
                    {formatCurrency(pdiCalc.monthly + (selectedAgent?.cr6cd_occaccmonthly || 0) + (selectedAgent?.cr6cd_bobtailvalue || 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
