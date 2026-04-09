import { CircleCheck, User, Building2, FileText, Shield, Star, Minus, Clock, Mail, CheckCircle, XCircle, Download, FileSignature, BadgeCheck, Truck, ClipboardList, Send } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { CONTRACT_TYPE_LABELS, type Agent } from '../../lib/mockData';
import { generateAgentConfirmation } from '../../lib/generateAgentConfirmation';
import { generateFleetCommitment } from '../../lib/generateFleetCommitment';
import { toast } from 'sonner';
import type { TestStatus } from './Step3Testing';
import type { TransferItemKey } from './Step4Transfers';

const TRANSFER_ITEM_LABELS: Record<TransferItemKey, string> = {
  security_deposit: 'Security Deposit',
  eld: 'ELD',
  dashcam: 'DashCam',
  plate: 'Plate',
};

interface Step6Props {
  form: Record<string, string>;
  agent: Agent | null;
  actionType: string;
  contractType: number | null;
  selections: Record<string, boolean>;
  elpRequired: boolean;
  hazmatStatus: TestStatus;
  homelandStatus: TestStatus;
  transferOccAcc: boolean;
  transferEquipment: boolean;
  reactivateEquipment: boolean;
  transferItems: Record<TransferItemKey, boolean>;
  reactivateItems: Record<TransferItemKey, boolean>;
  pdiMonthly: number;
  pdiWeeklyDeposit: number;
  maintenanceAmount: string;
  iftaNumber: string;
  onSubmit?: () => void;
  isSaving?: boolean;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; classes: string; label: string }> = {
  notRequired: { icon: Star, classes: 'bg-muted/60 text-muted-foreground border-border', label: 'Not Required' },
  notSent: { icon: Minus, classes: 'bg-muted/60 text-muted-foreground border-border', label: 'Not Sent' },
  Queued: { icon: Clock, classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', label: 'Queued' },
  Sent: { icon: Mail, classes: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20', label: 'Sent' },
  Passed: { icon: CheckCircle, classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', label: 'Passed' },
  Failed: { icon: XCircle, classes: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', label: 'Failed' },
};

const CONTRACT_MAP = CONTRACT_TYPE_LABELS;

const STARTUP_DOCUMENTS = [
  { id: 'lease_agreement', name: 'Lease Agreement', icon: FileSignature },
  { id: 'agent_confirmation', name: 'Agent Confirmation', icon: BadgeCheck },
  { id: 'fleet_commitment', name: 'Fleet Commitment', icon: Truck },
  { id: 'road_test_ibe', name: 'Road Test & IBE Data Sheet', icon: ClipboardList },
  { id: 'welcome_letter', name: 'Welcome Letter', icon: Send },
];

const DEDUCTION_LABELS: Record<string, string> = {
  occacc: 'Occ/Acc Insurance', bobtail: 'Bobtail Insurance', pdi: 'Physical Damage Ins (PDI)',
  security_deposit: 'Security Deposit', eld_deposit: 'ELD Deposit', dashcam_deposit: 'DashCam Deposit',
  buydown: 'Buy-Down Program', ifta: 'IFTA', irp_plate_prepaid: 'IRP Plate: PrePaid',
  irp_plate_settlements: 'IRP Plate: Settlements', prepass_tolls_bypass: 'PrePass: Tolls & Bypass',
  prepass_bypass: 'PrePass: Bypass', maintenance_fund: 'Maintenance Fund',
  chassis_usage: 'Chassis Usage', rfid: 'RFID Tag',
};

export default function Step6Review({
  form, agent, actionType, contractType, selections,
  elpRequired, hazmatStatus, homelandStatus,
  transferOccAcc, transferEquipment, reactivateEquipment, transferItems, reactivateItems,
  pdiMonthly, pdiWeeklyDeposit, maintenanceAmount, iftaNumber,
}: Step6Props) {
  const selectedDeductions = Object.entries(selections).filter(([, v]) => v).map(([k]) => k);
  const transferItemsList = (Object.entries(transferItems) as [TransferItemKey, boolean][]).filter(([, v]) => v).map(([k]) => k);
  const reactivateItemsList = (Object.entries(reactivateItems) as [TransferItemKey, boolean][]).filter(([, v]) => v).map(([k]) => k);

  return (
    <div className="w-full max-w-[1100px] mx-auto space-y-4">
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-fade-in-up">
        <CircleCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Review all details before submitting</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 animate-fade-in-up" style={{ animationDelay: '40ms' }}>
        <SummaryChip icon={User} label={`${form.firstName || ''} ${form.lastName || ''}`.trim() || '—'} />
        <SummaryChip icon={Building2} label={`Terminal ${agent?.cr6cd_terminal || '—'}`} />
        <SummaryChip icon={FileText} label={actionType === 'new' ? 'New Entry' : actionType === 'move' ? 'Move' : actionType || '—'} />
        <SummaryChip icon={Shield} label={contractType !== null ? (CONTRACT_MAP[contractType] || '—') : '—'} />
        {agent?.cr6cd_hazmatrequired && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
            Hazmat Terminal
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Driver Information" accent="sky" delay={80}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
            <CompactField label="Email" value={form.email} />
            <CompactField label="Phone" value={form.phone} />
            <CompactField label="SSN" value={form.ssn ? '***-**-****' : ''} />
            <CompactField label="Driver Code" value={form.driverCode} />
            <CompactField label="License #" value={form.licenseNumber} />
            <CompactField label="License State" value={form.licenseState} />
          </div>
        </SectionCard>

        <SectionCard title="Testing & Compliance" accent="amber" delay={120}>
          <div className="space-y-2.5">
            <StatusRow label="ELP Required">
              <YesNoPill value={elpRequired} />
            </StatusRow>
            <StatusRow label="Hazmat Endorsement">
              <TestBadge status={hazmatStatus} required={agent?.cr6cd_hazmatrequired ?? false} />
            </StatusRow>
            <StatusRow label="Homeland Security">
              <TestBadge status={homelandStatus} required={agent?.cr6cd_hazmatrequired ?? false} />
            </StatusRow>
          </div>
        </SectionCard>

        <SectionCard title="Transfers & Reactivation" accent="violet" delay={160}>
          <div className="space-y-3">
            <StatusRow label="Transfer Occ/Acc">
              <YesNoPill value={transferOccAcc} />
            </StatusRow>
            <div>
              <StatusRow label="Transfer Equipment">
                <YesNoPill value={transferEquipment} />
              </StatusRow>
              {transferEquipment && transferItemsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5 ml-1">
                  {transferItemsList.map((k) => (
                    <span key={k} className="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                      {TRANSFER_ITEM_LABELS[k]}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <StatusRow label="Reactivate Equipment">
                <YesNoPill value={reactivateEquipment} />
              </StatusRow>
              {reactivateEquipment && reactivateItemsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5 ml-1">
                  {reactivateItemsList.map((k) => (
                    <span key={k} className="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20">
                      {TRANSFER_ITEM_LABELS[k]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard title={`Deductions · ${selectedDeductions.length} selected`} accent="blue" delay={200}>
          {selectedDeductions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">None selected</p>
          ) : (
            <div className="space-y-2.5">
              <div className="flex flex-wrap gap-1.5">
                {selectedDeductions.map((k) => (
                  <span key={k} className="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20">
                    {DEDUCTION_LABELS[k] || k}
                  </span>
                ))}
              </div>
              {(selectedDeductions.includes('pdi') || (selectedDeductions.includes('maintenance_fund') && maintenanceAmount)) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground border-t border-border/60 pt-2">
                  {selectedDeductions.includes('pdi') && (
                    <span>PDI: {formatCurrency(pdiMonthly)}/mo · {formatCurrency(pdiWeeklyDeposit)}/wk deposit</span>
                  )}
                  {selectedDeductions.includes('maintenance_fund') && maintenanceAmount && (
                    <span>Maintenance: {formatCurrency(parseFloat(maintenanceAmount))}/wk</span>
                  )}
                </div>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="rounded-xl border border-border/80 bg-card overflow-hidden animate-fade-in-up" style={{ animationDelay: '260ms' }}>
        <div className="px-5 py-4 border-b border-border/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Download className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Generate Documents</h4>
            <p className="text-[11px] text-muted-foreground">Download driver onboarding documents</p>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Start-up</span>
            <div className="flex-1 h-px bg-border/60" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {STARTUP_DOCUMENTS.map((doc, i) => (
              <DocumentCard
                key={doc.id}
                name={doc.name}
                icon={doc.icon}
                delay={i * 50}
                onClick={() => {
                  try {
                    if (doc.id === 'agent_confirmation') {
                      generateAgentConfirmation({ form, agent, selections, transferEquipment, reactivateEquipment, transferItems, reactivateItems, pdiMonthly, iftaNumber });
                      toast.success(`${doc.name} downloaded`);
                    } else if (doc.id === 'fleet_commitment') {
                      generateFleetCommitment({ form, agent });
                      toast.success(`${doc.name} downloaded`);
                    } else {
                      toast.info(`Generating ${doc.name}...`, { description: 'Power Automate flow will be connected soon.' });
                    }
                  } catch (err) {
                    toast.error(`Failed to generate ${doc.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
                  }
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryChip({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg bg-muted/60 border border-border/60 px-3 py-1.5">
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  );
}

function SectionCard({ title, accent, delay, children }: { title: string; accent: string; delay: number; children: React.ReactNode }) {
  const accentColor: Record<string, string> = { sky: 'bg-sky-500', amber: 'bg-amber-500', violet: 'bg-violet-500', blue: 'bg-blue-500' };
  return (
    <div className="relative rounded-xl border border-border/80 bg-card overflow-hidden animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <div className={cn('absolute left-0 top-0 bottom-0 w-1', accentColor[accent])} />
      <div className="p-4 pl-5">
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</h4>
        {children}
      </div>
    </div>
  );
}

function CompactField({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-1">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <p className="text-sm font-medium text-foreground leading-tight">{value || '—'}</p>
    </div>
  );
}

function StatusRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function YesNoPill({ value }: { value: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
      value ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-muted/60 text-muted-foreground border-border',
    )}>
      {value ? 'Yes' : 'No'}
    </span>
  );
}

function TestBadge({ status, required }: { status: TestStatus; required: boolean }) {
  const key = !required ? 'notRequired' : (!status ? 'notSent' : status);
  const cfg = STATUS_CONFIG[key];
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium', cfg.classes)}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

function DocumentCard({ name, icon: Icon, delay, onClick }: { name: string; icon: React.ElementType; delay: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-center gap-2.5 rounded-xl border border-border/80 bg-card p-4 pt-5 text-left',
        'transition-all duration-300 ease-out',
        'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5',
        'active:scale-[0.97] active:shadow-sm',
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center',
        'bg-primary/8 text-primary',
        'transition-all duration-300',
        'group-hover:bg-primary/15 group-hover:scale-110',
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[11px] font-medium text-foreground text-center leading-tight min-h-[2rem] flex items-center">{name}</span>
      <div className={cn(
        'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold',
        'border-primary/20 bg-primary/5 text-primary',
        'transition-all duration-300',
        'group-hover:bg-primary group-hover:text-white group-hover:border-transparent group-hover:shadow-md group-hover:shadow-primary/25',
      )}>
        <Download className="w-3 h-3 transition-transform duration-300 group-hover:translate-y-0.5" />
        Download
      </div>
    </button>
  );
}
