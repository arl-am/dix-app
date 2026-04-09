import { useState } from 'react';
import { CircleCheck, ChevronDown, User, Building2, FileText, ClipboardList, Star, Minus, Clock, Mail, CheckCircle, XCircle } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { CONTRACT_TYPE_LABELS, type Agent } from '../../lib/mockData';
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
  pdiMonthly: number;
  pdiWeeklyDeposit: number;
  maintenanceAmount: string;
  onSubmit: () => void;
  isSaving: boolean;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; classes: string; label: string }> = {
  notRequired: { icon: Star, classes: 'bg-muted/80 dark:bg-muted/50 text-muted-foreground border-border', label: 'Not Required' },
  notSent: { icon: Minus, classes: 'bg-muted/80 dark:bg-muted/50 text-muted-foreground border-border', label: 'Not Sent Yet' },
  Queued: { icon: Clock, classes: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20', label: 'Queued' },
  Sent: { icon: Mail, classes: 'bg-primary/10 text-primary border-primary/20', label: 'Sent' },
  Passed: { icon: CheckCircle, classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', label: 'Passed' },
  Failed: { icon: XCircle, classes: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', label: 'Failed' },
};

function TestStatusBadge({ label, status, required }: { label: string; status: TestStatus; required: boolean }) {
  const key = !required ? 'notRequired' : (!status ? 'notSent' : status);
  const cfg = STATUS_CONFIG[key];
  const Icon = cfg.icon;
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className={cn('inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium', cfg.classes)}>
        <Icon className="w-3 h-3" /> {cfg.label}
      </span>
    </div>
  );
}

function Section({ title, icon: Icon, children, defaultOpen = false }: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md hover:border-border/80">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <Icon className={cn('w-5 h-5 transition-colors duration-200', open ? 'text-primary' : 'text-muted-foreground')} />
          <span className="font-medium text-foreground">{title}</span>
        </div>
        <div className={cn('transition-transform duration-200', open && 'rotate-180')}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </button>
      <div className={cn(
        'grid transition-all duration-200 ease-out',
        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
      )}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4 border-t border-border">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <p className="text-sm font-medium text-foreground mt-0.5">{value || '—'}</p>
    </div>
  );
}

const CONTRACT_MAP = CONTRACT_TYPE_LABELS;

const DEDUCTION_LABELS: Record<string, string> = {
  occacc: 'Occ/Acc Insurance',
  bobtail: 'Bobtail Insurance',
  pdi: 'Physical Damage Ins (PDI)',
  security_deposit: 'Security Deposit',
  eld_deposit: 'ELD Deposit',
  dashcam_deposit: 'DashCam Deposit',
  buydown: 'Buy-Down Program',
  ifta: 'IFTA',
  irp_plate_prepaid: 'IRP Plate: PrePaid',
  irp_plate_settlements: 'IRP Plate: Settlements',
  prepass_tolls_bypass: 'PrePass: Tolls & Bypass',
  prepass_bypass: 'PrePass: Bypass',
  maintenance_fund: 'Maintenance Fund',
  chassis_usage: 'Chassis Usage',
  rfid: 'RFID Tag',
};

export default function Step6Review({
  form, agent, actionType, contractType, selections,
  elpRequired,
  hazmatStatus, homelandStatus,
  transferOccAcc, transferEquipment, reactivateEquipment, transferItems,
  pdiMonthly, pdiWeeklyDeposit, maintenanceAmount,
  onSubmit, isSaving,
}: Step6Props) {
  const selectedDeductions = Object.entries(selections).filter(([, v]) => v).map(([k]) => k);

  return (
    <div className="w-full max-w-[1000px] mx-auto space-y-6">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 animate-fade-in-up">
        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
          <CircleCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Ready for review</h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Please review all information before submitting</p>
        </div>
      </div>

      <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border animate-fade-in-up" style={{ animationDelay: '55ms' }}>
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-muted-foreground" />
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Driver</span>
            <p className="text-sm font-semibold text-foreground">{form.firstName} {form.lastName}</p>
          </div>
        </div>
        <div className="w-px h-10 bg-border" />
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-muted-foreground" />
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Terminal</span>
            <p className="text-sm font-semibold text-foreground">{agent?.cr6cd_terminal || '—'}</p>
          </div>
        </div>
        {agent?.cr6cd_hazmatrequired && (
          <>
            <div className="w-px h-10 bg-border" />
            <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">Hazmat Terminal</span>
          </>
        )}
      </div>

      <div className="space-y-4">
        <Section title="Driver Information" icon={User} defaultOpen>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6">
            <Field label="Name" value={`${form.firstName || ''} ${form.lastName || ''}`} />
            <Field label="Email" value={form.email} />
            <Field label="Phone" value={form.phone} />
            <Field label="SSN" value={form.ssn ? '***-**-****' : ''} />
            <Field label="Driver Code" value={form.driverCode} />
            <Field label="License #" value={form.licenseNumber} />
            <Field label="Action Type" value={actionType === 'new' ? 'New' : 'Move'} />
            <Field label="Contract Type" value={contractType !== null ? (CONTRACT_MAP[contractType] || String(contractType)) : ''} />
          </div>
        </Section>

        <Section title="Testing & Compliance" icon={ClipboardList}>
          <div className="space-y-1">
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">ELP Required</span>
              <span className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium',
                elpRequired
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'bg-muted dark:bg-white/[0.06] text-muted-foreground border-border',
              )}>
                {elpRequired ? 'Yes' : 'No'}
              </span>
            </div>
            <TestStatusBadge label="Hazmat Endorsement" status={hazmatStatus} required={agent?.cr6cd_hazmatrequired ?? false} />
            <TestStatusBadge label="Homeland Security" status={homelandStatus} required={agent?.cr6cd_hazmatrequired ?? false} />
          </div>
        </Section>

        <Section title="Transfers & Reactivation" icon={FileText}>
          <div className="space-y-1">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6">
              <Field label="Transfer Occ/Acc" value={transferOccAcc ? 'Yes' : 'No'} />
              <Field label="Transfer Equipment" value={transferEquipment ? 'Yes' : 'No'} />
              <Field label="Reactivate Equipment" value={reactivateEquipment ? 'Yes' : 'No'} />
            </div>
            {(transferEquipment || reactivateEquipment) && (
              <div className="pt-2 mt-1 border-t border-border">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Equipment Items</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(Object.entries(transferItems) as [TransferItemKey, boolean][])
                    .filter(([, v]) => v)
                    .map(([k]) => (
                      <span key={k} className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary border-primary/20">
                        {TRANSFER_ITEM_LABELS[k]}
                      </span>
                    ))}
                  {Object.values(transferItems).every((v) => !v) && (
                    <span className="text-sm text-muted-foreground">None selected</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </Section>

        <Section title={`Deductions (${selectedDeductions.length} selected)`} icon={FileText}>
          {selectedDeductions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No deductions selected</p>
          ) : (
            <div className="space-y-1 py-2">
              {selectedDeductions.map((k) => {
                let detail = '';
                if (k === 'pdi') detail = `Monthly: ${formatCurrency(pdiMonthly)} | Weekly deposit: ${formatCurrency(pdiWeeklyDeposit)}`;
                else if (k === 'maintenance_fund' && maintenanceAmount) detail = `${formatCurrency(parseFloat(maintenanceAmount))}/week`;
                return (
                  <div key={k} className="flex items-center justify-between py-1.5">
                    <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary border-primary/20">
                      {DEDUCTION_LABELS[k] || k.replace(/_/g, ' ')}
                    </span>
                    {detail && <span className="text-xs text-muted-foreground tabular-nums">{detail}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          onClick={onSubmit}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 text-primary-foreground h-9 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] hover:shadow-lg hover:shadow-primary/25 active:scale-95 min-w-[120px]"
        >
          {isSaving ? 'Saving...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
