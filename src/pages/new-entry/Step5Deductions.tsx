import { useMemo, useRef } from 'react';
import {
  Shield, Car, Zap, CreditCard, HardDrive, Camera, TrendingDown,
  Fuel, Wrench, Container, Radio, Calendar, DollarSign, Building2, Check,
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import type { Agent } from '../../lib/mockData';

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
  { key: 'pdi', label: 'Physical Damage Insurance - PDI', icon: Zap, category: 'monthly', getValueFromAgent: () => 0 },
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
  pdiMonthly: number;
  pdiWeeklyDeposit: number;
}

export default function Step5Deductions({ agent, selections, onToggle, iftaNumber, onIftaNumberChange, maintenanceAmount, onMaintenanceAmountChange, pdiMonthly, pdiWeeklyDeposit }: Step5Props) {
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
        weekly.push({ label: 'PDI Deposit', value: pdiWeeklyDeposit, subtitle: 'Collected in 4 payments' });
        monthly.push({ label: 'Physical Damage Ins (PDI)', value: pdiMonthly });
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
  }, [agent, selections, maintenanceAmount, pdiMonthly, pdiWeeklyDeposit]);

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
          <div className="space-y-2">
            {DEDUCTIONS.map((d) => {
              const Icon = d.icon;
              const val = d.key === 'pdi' ? pdiMonthly : (agent ? d.getValueFromAgent(agent) : null);
              const isDisabled = d.key === 'chassis_usage' && chassisDisabled;
              const isSelected = !!selections[d.key];
              return (
                <div key={d.key}>
                  <div
                    onClick={() => !isDisabled && handleToggle(d.key)}
                    className={cn(
                      'group flex items-center gap-3 py-3 px-4 rounded-xl',
                      'transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
                      'select-none',
                      isSelected
                        ? 'bg-primary/[0.04] dark:bg-primary/10 border border-primary/20 shadow-[0_2px_12px_rgba(37,99,235,0.06)]'
                        : 'border border-border/40 hover:border-border/70 hover:bg-muted/30',
                      isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-[0.995]',
                    )}
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                      'transition-all duration-300',
                      isSelected ? 'bg-primary/10 text-primary' : 'bg-muted/70 text-muted-foreground',
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        'text-[0.8125rem] font-medium leading-tight block transition-colors duration-300',
                        isSelected ? 'text-foreground' : 'text-muted-foreground',
                      )}>{d.label}</span>
                      {d.key === 'pdi' && pdiMonthly === 0 && (
                        <span className="text-xs text-amber-500 mt-0.5 block">Enter truck value in Step 2</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={cn(
                        'text-[0.8125rem] tabular-nums tracking-tight text-right min-w-[4.5rem]',
                        'transition-all duration-300',
                        isSelected ? 'text-foreground font-semibold' : 'text-muted-foreground/70',
                      )}>
                        {d.key === 'pdi' ? formatCurrency(pdiMonthly) : val !== null ? formatCurrency(val) : d.key === 'irp_plate_prepaid' ? '' : '—'}
                      </span>
                      <div className={cn(
                        'w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0',
                        'transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
                        isSelected
                          ? 'bg-primary text-white shadow-[0_0_8px_rgba(37,99,235,0.3)] scale-100'
                          : 'border-2 border-muted-foreground/20 scale-[0.85] group-hover:border-muted-foreground/40',
                      )}>
                        <Check className={cn(
                          'w-3 h-3 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
                          isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-50',
                        )} strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                  {d.hasConditionalInput === 'ifta' && selections['ifta'] && (
                    <div className="ml-12 mr-4 mt-1.5 mb-0.5 animate-fade-in-down">
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
                    <div className="ml-12 mr-4 mt-1.5 mb-0.5 animate-fade-in-down">
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
  const prevCountRef = useRef(items.length);
  const isGrowing = items.length > prevCountRef.current;
  prevCountRef.current = items.length;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className={cn('w-6 h-6 rounded-md flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-3.5 h-3.5', iconColor)} />
        </div>
        <span className="text-sm font-semibold text-foreground">{title}</span>
        {items.length > 0 && (
          <span className="ml-auto text-xs font-medium text-muted-foreground tabular-nums">{items.length} item{items.length !== 1 && 's'}</span>
        )}
      </div>
      <div className="rounded-xl border border-border/60 overflow-hidden bg-muted/30 transition-all duration-300">
        {items.length === 0 ? (
          <div className="px-4 py-4 text-center bg-card animate-fade-in">
            <p className="text-sm text-muted-foreground italic">No {title.toLowerCase()} selected</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {items.map((item, i) => (
              <div
                key={item.label}
                className="flex items-center justify-between px-4 py-2.5 bg-card animate-summary-item-enter"
                style={isGrowing ? { animationDelay: `${i * 40}ms` } : undefined}
              >
                <div>
                  <span className="text-sm text-foreground">{item.label}</span>
                  {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                </div>
                <span className="text-sm font-semibold tabular-nums text-foreground">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
