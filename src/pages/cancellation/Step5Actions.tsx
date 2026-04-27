import { CircleCheck, FileText, Mail, ShieldX, ArrowRight, RotateCcw } from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';
import {
  CXL_TYPE_LABELS,
  CXL_REASON_LABELS,
  CXL_STATUS,
  CXL_STATUS_LABELS,
  CXL_STATUS_COLORS,
  EQUIPMENT_LIFECYCLE,
  EQUIPMENT_LIFECYCLE_LABELS,
  EQUIPMENT_LIFECYCLE_COLORS,
  equipmentProgress,
  tentativeReleaseDate,
} from '../../lib/cancellationConstants';
import type { Cancellation, CxlEquipment } from '../../lib/mockData';

interface Props {
  cancellation: Cancellation;
  equipment: CxlEquipment[];
  terminalLabel: string;
  onSetStatus: (status: number) => void;
  onGeneratePdf: () => void;
  onCreateEmailDraft: () => void;
  pdfBusy: boolean;
}

function SummaryRow({ label, value }: { label: string; value: string | undefined | null }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right max-w-[60%] break-words">{value || '—'}</span>
    </div>
  );
}

const STATUS_ACTIONS = [
  { status: CXL_STATUS.IN_PROGRESS,        label: 'Mark In Progress',     icon: ArrowRight },
  { status: CXL_STATUS.AWAITING_RETURNS,   label: 'Mark Awaiting Returns', icon: ArrowRight },
  { status: CXL_STATUS.ALL_ITEMS_RECEIVED, label: 'Mark All Items Received', icon: CircleCheck },
  { status: CXL_STATUS.RELEASED,           label: 'Release',              icon: CircleCheck },
  { status: CXL_STATUS.FORFEIT,            label: 'Forfeit',              icon: ShieldX },
  { status: CXL_STATUS.TRANSFERRED,        label: 'Transferred',          icon: ArrowRight },
  { status: CXL_STATUS.REACTIVATED_NTL,    label: 'Reactivate (No Time Lost)', icon: RotateCcw },
];

export default function Step5Actions({ cancellation, equipment, terminalLabel, onSetStatus, onGeneratePdf, onCreateEmailDraft, pdfBusy }: Props) {
  const c = cancellation;
  const progress = equipmentProgress(equipment.map((e) => ({ lifecycleState: e.cr6cd_lifecyclestate })));
  const currentStatus = c.cr6cd_dix_status ?? CXL_STATUS.NOT_STARTED;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 animate-fade-in">
        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
          <CircleCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Cancellation saved</h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Review the summary, generate documents, and update status as the case moves through the pipeline.</p>
        </div>
        <span
          className="inline-flex items-center rounded-full border-transparent text-white px-3 py-1 text-xs font-bold"
          style={{ backgroundColor: CXL_STATUS_COLORS[currentStatus] }}
        >
          {CXL_STATUS_LABELS[currentStatus]}
        </span>
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
            <span className="text-xs font-bold" style={{ color: progress.percent === 100 ? '#10B981' : '#3B82F6' }}>{progress.percent}%</span>
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

      <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in-up" style={{ animationDelay: '80ms' }}>
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">Status Pipeline</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Move this cancellation through the lifecycle.</p>
        </div>
        <div className="p-6 flex flex-wrap gap-2">
          {STATUS_ACTIONS.map(({ status, label, icon: Icon }) => {
            const isCurrent = currentStatus === status;
            return (
              <button
                key={status}
                onClick={() => onSetStatus(status)}
                disabled={isCurrent}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium border transition-all duration-200',
                  isCurrent
                    ? 'bg-primary/15 border-primary/40 text-primary cursor-default'
                    : 'bg-background border-border text-foreground hover:bg-muted/50 hover:border-muted-foreground/40 active:scale-95',
                )}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl shadow-sm p-5 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Cancellation Letter</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Generate a formal cancellation letter PDF with the motor carrier letterhead.</p>
          <button
            onClick={onGeneratePdf}
            disabled={pdfBusy}
            className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-9 px-4 py-2 bg-[#2563EB] text-white transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-lg hover:shadow-primary/25 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pdfBusy ? 'Generating...' : 'Generate PDF'}
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-5 animate-fade-in-up" style={{ animationDelay: '40ms' }}>
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-5 h-5 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Cancellation Email</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Create a Front email draft for the terminal compliance contact (uses Power Automate flag pattern).</p>
          <button
            onClick={onCreateEmailDraft}
            className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-9 px-4 py-2 bg-blue-600 text-white transition-all duration-200 hover:bg-blue-700 active:scale-95"
          >
            Create Draft
          </button>
        </div>
      </div>
    </div>
  );
}
