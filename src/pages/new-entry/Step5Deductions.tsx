import { useMemo } from 'react';
import {
  Shield, Car, Zap, CreditCard, HardDrive, Camera, TrendingDown,
  Fuel, Wrench, Container, Radio, Calendar, DollarSign, Building2,
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import type { Agent } from '../../lib/mockData';
import Toggle from '../../components/Toggle';

interface DeductionDef {
  key: string;
  label: string;
  icon: React.ElementType;
  category: 'weekly' | 'monthly' | 'onetime';
  getValueFromAgent: (a: Agent) => number | null;
  hasConditionalInput?: 'ifta' | 'maintenance';
}

const DEDUCTIONS: DeductionDef[] = [
  { key: 'occacc', label: 'Occ/Acc Insurance', icon: Shield, category: 'monthly', getValueFromAgent: (a) => a.cr6cd_occaccmonthly },
  { key: 'bobtail', label: 'Bobtail Insurance', icon: Car, category: 'monthly', getValueFromAgent: (a) => a.cr6cd_bobtailvalue },
  { key: 'pdi', label: 'Physical Damage Insurance - PDI', icon: Zap, category: 'monthly', getValueFromAgent: () => 95.60 },
  { key: 'security_deposit', label: 'Security Deposit', icon: CreditCard, category: 'weekly', getValueFromAgent: (a) => a.cr6cd_securitydepositweeklyvalue },
  { key: 'eld_deposit', label: 'ELD Deposit', icon: HardDrive, category: 'weekly', getValueFromAgent: (a) => a.cr6cd_elddepositvalue },
  { key: 'dashcam_deposit', label: 'DashCam Deposit', icon: Camera, category: 'weekly', getValueFromAgent: (a) => a.cr6cd_dashcamdepositvalue },
  { key: 'buydown', label: 'Buy-Down Program', icon: TrendingDown, category: 'weekly', getValueFromAgent: (a) => a.cr6cd_buydownvalue },
  { key: 'ifta', label: 'IFTA', icon: Fuel, category: 'weekly', getValueFromAgent: (a) => a.cr6cd_iftavalue, hasConditionalInput: 'ifta' },
  { key: 'irp_plate_prepaid', label: 'IRP Plate: PrePaid', icon: CreditCard, category: 'weekly', getValueFromAgent: () => null },
  { key: 'irp_plate_settlements', label: 'IRP Plate: Settlements', icon: CreditCard, category: 'weekly', getValueFromAgent: (a) => a.cr6cd_plateweeklyvalue },
  { key: 'prepass_tolls_bypass', label: 'PrePass: Tolls & Bypass', icon: Radio, category: 'weekly', getValueFromAgent: (a) => a.cr6cd_prepasstollsbypass },
  { key: 'prepass_bypass', label: 'PrePass: Bypass', icon: Radio, category: 'weekly', getValueFromAgent: (a) => a.cr6cd_prepassbypass },
  { key: 'maintenance_fund', label: 'Maintenance Fund', icon: Wrench, category: 'weekly', getValueFromAgent: () => null, hasConditionalInput: 'maintenance' },
  { key: 'chassis_usage', label: 'Chassis Usage', icon: Container, category: 'weekly', getValueFromAgent: (a) => a.cr6cd_trailerusagevalue },
  { key: 'rfid', label: 'RFID Tag', icon: Radio, category: 'onetime', getValueFromAgent: (a) => a.cr6cd_rfidvalue },
];

interface Step5Props {
  agent: Agent | null;
  selections: Record<string, boolean>;
  onToggle: (key: string) => void;
  iftaNumber: string;
  onIftaNumberChange: (v: string) => void;
  maintenanceAmount: string;
  onMaintenanceAmountChange: (v: string) => void;
}

export default function Step5Deductions({ agent, selections, onToggle, iftaNumber, onIftaNumberChange, maintenanceAmount, onMaintenanceAmountChange }: Step5Props) {
  const handleToggle = (key: string) => {
    if (key === 'irp_plate_prepaid' && !selections['irp_plate_prepaid'] && selections['irp_plate_settlements']) onToggle('irp_plate_settlements');
    if (key === 'irp_plate_settlements' && !selections['irp_plate_settlements'] && selections['irp_plate_prepaid']) onToggle('irp_plate_prepaid');
    if (key === 'prepass_tolls_bypass' && !selections['prepass_tolls_bypass'] && selections['prepass_bypass']) onToggle('prepass_bypass');
    if (key === 'prepass_bypass' && !selections['prepass_bypass'] && selections['prepass_tolls_bypass']) onToggle('prepass_tolls_bypass');
    onToggle(key);
  };

  const summary = useMemo(() => {
    if (!agent) return { weekly: [] as { label: string; value: number; subtitle?: string }[], monthly: [] as { label: string; value: number; subtitle?: string }[], onetime: [] as { label: string; value: number }[] };
    const weekly: { label: string; value: number; subtitle?: string }[] = [];
    const monthly: { label: string; value: number; subtitle?: string }[] = [];
    const onetime: { label: string; value: number }[] = [];

    for (const d of DEDUCTIONS) {
      if (!selections[d.key]) continue;
      const val = d.getValueFromAgent(agent) || 0;

      if (d.key === 'security_deposit') {
        weekly.push({ label: 'Security Deposit', value: val, subtitle: `Full value ${formatCurrency(agent.cr6cd_securitydepositfullvalue)}` });
      } else if (d.key === 'eld_deposit') {
        weekly.push({ label: 'ELD Deposit', value: val, subtitle: `Full value ${formatCurrency(agent.cr6cd_elddepositfullvalue)}` });
        if (agent.cr6cd_elddatafeerequired) weekly.push({ label: 'ELD Data Fee', value: agent.cr6cd_elddatafeevalue });
      } else if (d.key === 'dashcam_deposit') {
        weekly.push({ label: 'DashCam Deposit', value: val, subtitle: 'Full value $100' });
      } else if (d.key === 'irp_plate_settlements') {
        weekly.push({ label: 'IRP Plate Usage', value: val });
        weekly.push({ label: 'IRP Plate Deposit', value: agent.cr6cd_platedepositvalue, subtitle: `Full value ${formatCurrency(agent.cr6cd_platedepositfullvalue)}` });
        onetime.push({ label: 'IRP Plate Admin Fee', value: agent.cr6cd_plateadminfee });
      } else if (d.key === 'pdi') {
        weekly.push({ label: 'PDI Deposit', value: val / 4, subtitle: 'Collected in 4 payments' });
        monthly.push({ label: 'Physical Damage Ins (PDI)', value: val });
      } else if (d.key === 'occacc') {
        monthly.push({ label: 'Occ/Acc Insurance', value: val, subtitle: `(Billed bi-weekly at ${formatCurrency(agent.cr6cd_occaccbiweekly)})` });
      } else if (d.key === 'maintenance_fund') {
        const amt = parseFloat(maintenanceAmount) || 0;
        weekly.push({ label: 'Maintenance Fund', value: amt });
      } else if (d.category === 'weekly') {
        weekly.push({ label: d.label, value: val });
      } else if (d.category === 'monthly') {
        monthly.push({ label: d.label, value: val });
      } else if (d.category === 'onetime') {
        onetime.push({ label: d.label, value: val });
      }
    }
    return { weekly, monthly, onetime };
  }, [agent, selections, maintenanceAmount]);

  const weeklyTotal = summary.weekly.reduce((s, i) => s + i.value, 0);
  const monthlyTotal = summary.monthly.reduce((s, i) => s + i.value, 0);
  const onetimeTotal = summary.onetime.reduce((s, i) => s + i.value, 0);
  const estimatedMonthly = weeklyTotal * 4 + monthlyTotal + onetimeTotal;

  const chassisDisabled = !agent?.cr6cd_trailerusagerequired && agent !== null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-8">
      <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in-up">
        <div className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-1">Select Deductions</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Values auto-populated from {agent?.cr6cd_terminal || '—'} agent configuration
          </p>
          <div className="space-y-1">
            {DEDUCTIONS.map((d, idx) => {
              const Icon = d.icon;
              const val = agent ? d.getValueFromAgent(agent) : null;
              const isDisabled = d.key === 'chassis_usage' && chassisDisabled;
              return (
                <div key={d.key}>
                  <div className={cn(
                    'flex items-center justify-between py-3 px-4 rounded-lg',
                    'transition-all duration-200 ease-out',
                    selections[d.key] ? 'bg-primary/5 border border-primary/10 shadow-sm' : (idx % 2 === 0 ? 'bg-muted/40' : 'bg-transparent'),
                    isDisabled && 'opacity-50',
                    !isDisabled && 'hover:bg-muted/60',
                  )}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Icon className={cn('w-5 h-5 flex-shrink-0 transition-colors duration-200', selections[d.key] ? 'text-primary' : 'text-muted-foreground')} />
                      <span className={cn('text-sm font-medium truncate transition-colors duration-200', selections[d.key] ? 'text-foreground' : 'text-muted-foreground')}>{d.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono text-muted-foreground w-20 text-right">
                        {val !== null ? formatCurrency(val) : d.key === 'maintenance_fund' ? '—' : d.key === 'irp_plate_prepaid' ? 'Toggle' : '—'}
                      </span>
                      <Toggle checked={!!selections[d.key]} onChange={() => handleToggle(d.key)} disabled={isDisabled} />
                    </div>
                  </div>
                  {d.hasConditionalInput === 'ifta' && selections['ifta'] && (
                    <div className="px-12 pb-2">
                      <input
                        type="text"
                        placeholder="Enter IFTA Number"
                        value={iftaNumber}
                        onChange={(e) => onIftaNumberChange(e.target.value)}
                        className="h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:border-ring focus:ring-ring/50 focus:ring-2 placeholder:text-muted-foreground"
                      />
                    </div>
                  )}
                  {d.hasConditionalInput === 'maintenance' && selections['maintenance_fund'] && (
                    <div className="px-12 pb-2">
                      <input
                        type="number"
                        placeholder="Enter weekly amount"
                        value={maintenanceAmount}
                        onChange={(e) => onMaintenanceAmountChange(e.target.value)}
                        className="h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none focus:border-ring focus:ring-ring/50 focus:ring-2 placeholder:text-muted-foreground"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-4 self-start animate-fade-in-up" style={{ animationDelay: '70ms' }}>
        <div className="bg-card border border-border/60 shadow-xl rounded-xl overflow-hidden p-0">
          <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800">
            <h3 className="text-lg font-bold text-white tracking-tight">Cost Summary</h3>
            <p className="text-sm text-slate-300 mt-0.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Terminal {agent?.cr6cd_terminal || '—'}
            </p>
          </div>

          <div className="p-5 space-y-6">
            <SummarySection
              icon={Calendar}
              iconBg="bg-sky-100"
              iconColor="text-sky-600"
              title="Weekly Settlement Deductions"
              items={summary.weekly}
            />
            <SummarySection
              icon={DollarSign}
              iconBg="bg-violet-100"
              iconColor="text-violet-600"
              title="Monthly Charges"
              items={summary.monthly}
            />
            {summary.onetime.length > 0 && (
              <SummarySection
                icon={CreditCard}
                iconBg="bg-amber-100"
                iconColor="text-amber-600"
                title="One-Time Charges"
                items={summary.onetime}
              />
            )}
          </div>

          <div className="px-6 py-5 bg-gradient-to-r from-slate-800 to-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-300">Estimated Monthly Total</span>
              <span className="text-2xl font-bold text-white tabular-nums">{formatCurrency(estimatedMonthly)}</span>
            </div>
            <div className="space-y-1 mt-3 pt-3 border-t border-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Weekly settlements:</span>
                <span className="text-xs font-medium text-slate-300 tabular-nums">{formatCurrency(weeklyTotal)}/week</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">After deposits end:</span>
                <span className="text-xs font-medium text-slate-300 tabular-nums">{formatCurrency(monthlyTotal)}/month</span>
              </div>
              {onetimeTotal > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">One-time charges:</span>
                  <span className="text-xs font-medium text-slate-300 tabular-nums">{formatCurrency(onetimeTotal)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummarySection({ icon: Icon, iconBg, iconColor, title, items }: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  items: { label: string; value: number; subtitle?: string }[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className={cn('w-6 h-6 rounded-md flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-3.5 h-3.5', iconColor)} />
        </div>
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <div className="rounded-xl border border-border/60 overflow-hidden bg-muted/30">
        {items.length === 0 ? (
          <div className="px-4 py-4 text-center bg-card">
            <p className="text-sm text-muted-foreground italic">No {title.toLowerCase()} selected</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {items.map((item, i) => (
              <div key={`${item.label}-${i}`} className="flex items-center justify-between px-4 py-2.5 bg-card">
                <div>
                  <span className="text-sm text-foreground">{item.label}</span>
                  {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                </div>
                <span className="text-sm font-semibold tabular-nums">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
