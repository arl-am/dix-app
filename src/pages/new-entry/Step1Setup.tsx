import { CirclePlus, ArrowRightLeft, Users, UserRound, Briefcase, Truck, Car, Package, Container, Building2, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import CustomSelect from '../../components/CustomSelect';
import DatePicker from '../../components/DatePicker';
import type { Agent } from '../../lib/mockData';

const actionTypes = [
  { key: 'new', label: 'New', desc: 'Onboard a new record to the system', icon: CirclePlus, color: '#2563EB' },
  { key: 'move', label: 'Move', desc: 'Transfer an existing record between terminals', icon: ArrowRightLeft, color: '#7C3AED' },
];

const contractTypes = [
  { key: 100000000, label: 'Owner Operator', icon: Users },
  { key: 100000001, label: 'Company Driver', icon: UserRound },
  { key: 100000002, label: 'Driver for IBE', icon: Briefcase },
  { key: 100000003, label: 'Driver & Unit', icon: Truck },
  { key: 100000004, label: 'Truck Only', icon: Car },
  { key: 100000005, label: 'Rental Only', icon: Package },
  { key: 100000006, label: 'Trailer Only', icon: Container },
];

interface Step1Props {
  agents: Agent[];
  selectedAgent: string;
  onAgentChange: (id: string) => void;
  actionType: string;
  onActionTypeChange: (t: string) => void;
  contractType: number | null;
  onContractTypeChange: (t: number) => void;
  startDate: string;
  onStartDateChange: (d: string) => void;
}

export default function Step1Setup({
  agents, selectedAgent, onAgentChange,
  actionType, onActionTypeChange,
  contractType, onContractTypeChange,
  startDate, onStartDateChange,
}: Step1Props) {
  return (
    <div className="min-h-[420px]">
      <div className="space-y-8">
        <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
          <h3 className="text-base font-semibold text-foreground mb-4">What type of record is this?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[600px]">
            {actionTypes.map((a, idx) => {
              const Icon = a.icon;
              const isSelected = actionType === a.key;
              return (
                <button
                  key={a.key}
                  onClick={() => onActionTypeChange(a.key)}
                  className={cn(
                    'relative p-6 rounded-xl border-2 text-left group',
                    'transition-all duration-200 ease-out',
                    'hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1',
                    'active:scale-[0.98] active:shadow-md',
                    isSelected
                      ? '-translate-y-0.5 shadow-lg'
                      : 'border-border bg-card hover:border-primary/30',
                  )}
                  style={{
                    animationDelay: `${idx * 80}ms`,
                    ...(isSelected ? { borderColor: a.color, backgroundColor: `${a.color}0d`, boxShadow: `0 10px 15px -3px ${a.color}1a` } : {}),
                  }}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center animate-pop" style={{ backgroundColor: a.color }}>
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-200',
                      isSelected
                        ? 'scale-110'
                        : 'bg-muted dark:bg-white/[0.08] text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary/70 group-hover:scale-105',
                    )}
                    style={isSelected ? { backgroundColor: `${a.color}1a`, color: a.color } : {}}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <h4 className="text-lg font-semibold mb-1 text-foreground">{a.label}</h4>
                  <p className="text-sm text-muted-foreground">{a.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '70ms' }}>
          <h3 className="text-base font-semibold text-foreground mb-4">Select Contract Type</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {contractTypes.map((c, idx) => {
              const Icon = c.icon;
              const isSelected = contractType === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => onContractTypeChange(c.key)}
                  className={cn(
                    'relative p-4 rounded-xl border-2 text-left group',
                    'transition-all duration-200 ease-out',
                    'hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5',
                    'active:scale-[0.97]',
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 -translate-y-0.5'
                      : 'border-border bg-card hover:border-primary/30',
                  )}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center animate-pop">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-all duration-200',
                    isSelected
                      ? 'bg-primary/10 text-primary scale-110'
                      : 'bg-muted dark:bg-white/[0.08] text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary/70 group-hover:scale-105',
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className={cn(
                    'text-sm font-medium transition-colors duration-200',
                    isSelected ? 'text-primary' : 'text-foreground',
                  )}>{c.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '140ms' }}>
          <h3 className="text-base font-semibold text-foreground mb-4">Terminal & Start Date</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[600px] items-start">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Terminal <span className="text-destructive">*</span>
              </label>
              <CustomSelect
                options={agents.map((a) => ({ value: a.cr6cd_agentsid, label: `${a.cr6cd_terminal} — ${a.cr6cd_title}` }))}
                value={selectedAgent}
                onChange={onAgentChange}
                placeholder="Select terminal"
                icon={<Building2 className="w-4 h-4" />}
                triggerClassName="h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Start Date</label>
              <DatePicker
                value={startDate}
                onChange={onStartDateChange}
                placeholder="Select start date"
                triggerClassName="h-11"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
