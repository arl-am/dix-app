import { useState } from 'react';
import { CircleCheck, ChevronDown, User, Building2, FileText, ClipboardList } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CONTRACT_TYPE_LABELS, type Agent } from '../../lib/mockData';

interface Step6Props {
  form: Record<string, string>;
  agent: Agent | null;
  actionType: string;
  contractType: number | null;
  selections: Record<string, boolean>;
  elpRequired: boolean;
  hazmat: boolean;
  homelandSecurity: boolean;
  transferOccAcc: boolean;
  transferEquipment: boolean;
  reactivateEquipment: boolean;
  onSubmit: () => void;
  isSaving: boolean;
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

export default function Step6Review({
  form, agent, actionType, contractType, selections,
  elpRequired, hazmat, homelandSecurity,
  transferOccAcc, transferEquipment, reactivateEquipment,
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6">
            <Field label="ELP Required" value={elpRequired ? 'Yes' : 'No'} />
            <Field label="Hazmat" value={hazmat ? 'Yes' : 'No'} />
            <Field label="Homeland Security" value={homelandSecurity ? 'Yes' : 'No'} />
          </div>
        </Section>

        <Section title="Transfers & Reactivation" icon={FileText}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6">
            <Field label="Transfer Occ/Acc" value={transferOccAcc ? 'Yes' : 'No'} />
            <Field label="Transfer Equipment" value={transferEquipment ? 'Yes' : 'No'} />
            <Field label="Reactivate Equipment" value={reactivateEquipment ? 'Yes' : 'No'} />
          </div>
        </Section>

        <Section title={`Deductions (${selectedDeductions.length} selected)`} icon={FileText}>
          {selectedDeductions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No deductions selected</p>
          ) : (
            <div className="flex flex-wrap gap-2 py-2">
              {selectedDeductions.map((k) => (
                <span key={k} className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary border-primary/20">
                  {k.replace(/_/g, ' ')}
                </span>
              ))}
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
