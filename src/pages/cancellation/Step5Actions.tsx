import { useState, type ReactNode } from 'react';
import { CircleCheck, FileText, Mail, FileSignature, Download, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatDate } from '../../lib/utils';
import {
  CXL_TYPE_LABELS,
  CXL_REASON_LABELS,
  EQUIPMENT_LIFECYCLE_LABELS,
  EQUIPMENT_LIFECYCLE_COLORS,
  EQUIPMENT_LIFECYCLE,
  equipmentProgress,
  tentativeReleaseDate,
} from '../../lib/cancellationConstants';
import { generateCancellationLetter } from '../../lib/generateCancellationLetter';
import { usePresenceContext } from '../../hooks/usePresence';
import FinalReleaseModal from './FinalReleaseModal';
import type { Cancellation, CxlEquipment, Agent } from '../../lib/mockData';

interface Props {
  cancellation: Cancellation;
  equipment: CxlEquipment[];
  agent: Agent | null;
  terminalLabel: string;
}

function CollapsibleSection({ title, count, defaultOpen, children }: { title: string; count: number; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="rounded-xl border border-border/80 bg-card overflow-hidden transition-all duration-200 hover:shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-3.5 flex items-center justify-between group"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span className="text-[11px] font-medium text-muted-foreground bg-muted/80 rounded-full px-2 py-0.5">{count}</span>
        </div>
        <div className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center bg-muted/60 group-hover:bg-muted transition-all duration-300',
          open && 'rotate-180',
        )}>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </button>
      <div className={cn(
        'grid transition-all duration-300 ease-out',
        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
      )}>
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

function DocumentCard({ name, icon: Icon, downloaded, loading, onClick }: { name: string; icon: React.ElementType; downloaded?: boolean; loading?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        'group relative flex flex-col items-center gap-2 rounded-xl border p-4 pt-5 text-left',
        'transition-all duration-500 ease-out',
        loading
          ? 'border-primary/30 bg-primary/5 cursor-wait'
          : downloaded
            ? 'border-emerald-500/30 bg-emerald-500/5 shadow-sm shadow-emerald-500/10'
            : 'border-border/80 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 active:scale-[0.97]',
      )}
    >
      <div className={cn(
        'absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500',
        loading ? 'bg-primary/20 text-primary'
        : downloaded ? 'bg-emerald-500 text-white scale-100'
        : 'bg-muted/60 text-muted-foreground scale-90 group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-100',
      )}>
        {loading
          ? <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          : downloaded ? <CircleCheck className="w-3.5 h-3.5" />
          : <Download className="w-3 h-3 transition-transform duration-300 group-hover:translate-y-0.5" />}
      </div>
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500',
        loading ? 'bg-primary/10 text-primary animate-pulse'
        : downloaded ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        : 'bg-muted/40 text-primary group-hover:scale-110',
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <span className={cn(
        'text-xs font-medium text-center leading-tight min-h-[2rem] flex items-center transition-colors duration-500',
        loading ? 'text-primary' : downloaded ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground',
      )}>
        {loading ? 'Generating...' : name}
      </span>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string | undefined | null }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right max-w-[60%] break-words">{value || '—'}</span>
    </div>
  );
}

export default function Step5Actions({ cancellation, equipment, agent, terminalLabel }: Props) {
  const c = cancellation;
  const { currentUser } = usePresenceContext();
  const progress = equipmentProgress(equipment.map((e) => ({ lifecycleState: e.cr6cd_lifecyclestate })));
  const [pdfBusy, setPdfBusy] = useState(false);
  const [letterDone, setLetterDone] = useState(false);
  const [emailDone, setEmailDone] = useState(false);
  const [finalReleaseOpen, setFinalReleaseOpen] = useState(false);

  const handleGeneratePdf = async () => {
    setPdfBusy(true);
    try {
      generateCancellationLetter({
        cancellation: c,
        agent,
        equipment,
        sentBy: currentUser?.userName || 'Operations',
      });
      setLetterDone(true);
      toast.success('Cancellation letter downloaded');
    } catch (e) {
      toast.error('PDF failed: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setPdfBusy(false);
    }
  };

  const handleCreateEmailDraft = () => {
    setEmailDone(true);
    toast.info('Email draft flow not yet wired. Coming soon.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 animate-fade-in">
        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
          <CircleCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Cancellation saved</h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            Review the summary, then generate documents and (when items are returned) finalize the release.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm animate-fade-in-up">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">Summary</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div>
              <SummaryRow label="Type" value={c.cr6cd_dix_canceltype != null ? CXL_TYPE_LABELS[c.cr6cd_dix_canceltype] : ''} />
              <SummaryRow label="Reason" value={c.cr6cd_dix_cancelreason != null ? CXL_REASON_LABELS[c.cr6cd_dix_cancelreason] : ''} />
              <SummaryRow label="Terminal" value={terminalLabel} />
              <SummaryRow label="Cancel Date" value={formatDate(c.cr6cd_dix_canceldate)} />
              <SummaryRow label="Start Date" value={formatDate(c.cr6cd_dix_startdate)} />
              <SummaryRow label="Submitted By" value={c.cr6cd_dix_submittedby} />
            </div>
            <div>
              <SummaryRow label="Driver" value={c.cr6cd_dix_drivername} />
              <SummaryRow label="Driver Code" value={c.cr6cd_dix_drivercode} />
              <SummaryRow label="Vendor" value={c.cr6cd_dix_vendorname || c.cr6cd_dix_vendorcode} />
              <SummaryRow label="Unit" value={c.cr6cd_dix_unitnumber} />
              <SummaryRow label="Tracking" value={c.cr6cd_dix_rltrackingnumber} />
              <SummaryRow label="Tentative Release" value={formatDate(tentativeReleaseDate(c.cr6cd_dix_lastitemreceived))} />
            </div>
          </div>
          {c.cr6cd_dix_reasondetails && (
            <div className="px-6 pb-6">
              <p className="text-xs text-muted-foreground mb-1">Reason details</p>
              <p className="text-sm text-foreground bg-muted/40 rounded-lg p-3">{c.cr6cd_dix_reasondetails}</p>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in-up" style={{ animationDelay: '40ms' }}>
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Equipment</h3>
            <span
              className="text-xs font-bold"
              style={{ color: progress.percent === 100 ? '#10B981' : '#3B82F6' }}
            >
              {progress.percent}%
            </span>
          </div>
          <div className="p-3 max-h-[280px] overflow-y-auto">
            {equipment.map((e) => (
              <div key={e.cr6cd_dixcxlequipmentid} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/30">
                <span className="text-sm text-foreground">{e.cr6cd_displayname}</span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold text-white',
                    e.cr6cd_lifecyclestate === EQUIPMENT_LIFECYCLE.NA && 'opacity-60',
                  )}
                  style={{ backgroundColor: EQUIPMENT_LIFECYCLE_COLORS[e.cr6cd_lifecyclestate] }}
                >
                  {EQUIPMENT_LIFECYCLE_LABELS[e.cr6cd_lifecyclestate]}
                </span>
              </div>
            ))}
            {equipment.length === 0 && <p className="text-xs text-muted-foreground p-4 text-center">No equipment recorded.</p>}
          </div>
        </div>
      </div>

      <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Download className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Generate Documents</h4>
            <p className="text-[11px] text-muted-foreground">Letters, emails, and the final-release workflow live here.</p>
          </div>
        </div>

        <CollapsibleSection title="Cancellation" count={2} defaultOpen>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <DocumentCard
              name="Cancellation Letter"
              icon={FileText}
              loading={pdfBusy}
              downloaded={letterDone}
              onClick={handleGeneratePdf}
            />
            <DocumentCard
              name="Cancellation Email"
              icon={Mail}
              downloaded={emailDone}
              onClick={handleCreateEmailDraft}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Final Release" count={1}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <DocumentCard
              name="Final Release"
              icon={FileSignature}
              downloaded={!!c.cr6cd_dix_lastitemreceived}
              onClick={() => setFinalReleaseOpen(true)}
            />
          </div>
        </CollapsibleSection>
      </div>

      <FinalReleaseModal
        cancellation={finalReleaseOpen ? cancellation : null}
        onClose={() => setFinalReleaseOpen(false)}
      />
    </div>
  );
}
