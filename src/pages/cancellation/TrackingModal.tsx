import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Truck, ShieldX, Package, MessageSquare, ArrowLeft, ArrowRightLeft, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '../../components/Modal';
import DatePicker from '../../components/DatePicker';
import EquipmentCard from './EquipmentCard';
import NotesPanel from './NotesPanel';
import { cn, formatDate } from '../../lib/utils';
import {
  CXL_TYPE_LABELS,
  EQUIPMENT_LIFECYCLE,
  equipmentProgress,
  deriveTags,
  tentativeReleaseDate,
} from '../../lib/cancellationConstants';
import { useCxlEquipment } from '../../hooks/useCxlEquipment';
import { useCxlNotes } from '../../hooks/useCxlNotes';
import {
  useUpdateEquipment,
  useSaveFinalRelease,
} from '../../hooks/useCancellationMutation';
import type { Cancellation } from '../../lib/mockData';

interface Props {
  cancellation: Cancellation | null;
  onClose: () => void;
  onOpenWizard: (c: Cancellation) => void;
}

type View = 'tracking' | 'notes';

export default function TrackingModal({ cancellation, onClose, onOpenWizard }: Props) {
  const isOpen = cancellation != null;
  const cxlId = cancellation?.cr6cd_dix_cancellationid || null;
  const typeLabel = cancellation?.cr6cd_dix_canceltype != null ? CXL_TYPE_LABELS[cancellation.cr6cd_dix_canceltype] : null;
  const isForfeit = !!cancellation?.cr6cd_dix_forfeit;

  const [view, setView] = useState<View>('tracking');
  // Reset to tracking view whenever a new cancellation is loaded.
  useEffect(() => { if (isOpen) setView('tracking'); }, [cxlId, isOpen]);

  const { data: equipment = [], isLoading } = useCxlEquipment(cxlId);
  const { data: notes = [] } = useCxlNotes(cxlId);
  const updateEquipment = useUpdateEquipment();
  const saveFinalRelease = useSaveFinalRelease();

  const sorted = useMemo(
    () => [...equipment].sort((a, b) => a.cr6cd_displayname.localeCompare(b.cr6cd_displayname)),
    [equipment],
  );
  const progress = useMemo(
    () => equipmentProgress(sorted.map((e) => ({ lifecycleState: e.cr6cd_lifecyclestate }))),
    [sorted],
  );
  const tags = useMemo(() => {
    if (!cancellation) return [];
    return deriveTags({
      status: cancellation.cr6cd_dix_status,
      forfeit: isForfeit,
      equipment: sorted.map((e) => ({
        lifecycleState: e.cr6cd_lifecyclestate,
        istransferred: e.cr6cd_istransferred,
        isreactivated: e.cr6cd_isreactivated,
      })),
    });
  }, [cancellation, isForfeit, sorted]);

  const handleEqUpdate = (
    id: string,
    patch: Partial<{
      lifecycleState: number;
      returneddate: string;
      notes: string;
      istransferred: boolean;
      isreactivated: boolean;
    }>,
  ) => {
    if (!cxlId) return;
    const current = equipment.find((e) => e.cr6cd_dixcxlequipmentid === id);
    const isLifecycleChange = patch.lifecycleState !== undefined;
    const newLifecycle = patch.lifecycleState ?? current?.cr6cd_lifecyclestate ?? EQUIPMENT_LIFECYCLE.NEED;
    const autoStampReturned =
      isLifecycleChange &&
      newLifecycle === EQUIPMENT_LIFECYCLE.RETURNED &&
      !current?.cr6cd_returneddate;
    const clearQualifiers = isLifecycleChange && newLifecycle === EQUIPMENT_LIFECYCLE.NA;
    updateEquipment.mutate({
      cancellationId: cxlId,
      equipmentId: id,
      lifecycleState: isLifecycleChange ? newLifecycle : undefined,
      returneddate: patch.returneddate ?? (autoStampReturned ? new Date().toISOString().slice(0, 10) : undefined),
      notes: patch.notes,
      istransferred: clearQualifiers ? false : patch.istransferred,
      isreactivated: clearQualifiers ? false : patch.isreactivated,
    });
  };

  const handleLastItemReceived = (date: string) => {
    if (!cxlId || !cancellation) return;
    saveFinalRelease.mutate({
      cancellationId: cxlId,
      lastitemreceived: date || undefined,
      allitemsrcvddate: date || undefined,
      forfeit: isForfeit,
      requestreturnlabel: !!cancellation.cr6cd_dix_requestreturnlabel,
    });
  };

  const handleTrackingNumber = (value: string) => {
    if (!cxlId || !cancellation) return;
    saveFinalRelease.mutate({
      cancellationId: cxlId,
      forfeit: isForfeit,
      requestreturnlabel: !!cancellation.cr6cd_dix_requestreturnlabel,
      rltrackingnumber: value || undefined,
    });
  };

  const handleMarkAll = (key: 'transferred' | 'reactivated') => {
    if (!cxlId) return;
    const targets = sorted.filter((e) =>
      key === 'transferred' ? !e.cr6cd_istransferred : !e.cr6cd_isreactivated,
    );
    if (targets.length === 0) {
      toast.info(`All items are already marked as ${key === 'transferred' ? 'Transferred' : 'Reactivated'}.`);
      return;
    }
    targets.forEach((e) => {
      updateEquipment.mutate({
        cancellationId: cxlId,
        equipmentId: e.cr6cd_dixcxlequipmentid,
        ...(key === 'transferred' ? { istransferred: true } : { isreactivated: true }),
      });
    });
    toast.success(`Marked ${targets.length} item${targets.length === 1 ? '' : 's'} as ${key === 'transferred' ? 'Transferred' : 'Reactivated'}.`);
  };

  const handleToggleForfeit = () => {
    if (!cxlId || !cancellation) return;
    const next = !isForfeit;
    saveFinalRelease.mutate(
      {
        cancellationId: cxlId,
        forfeit: next,
        requestreturnlabel: !!cancellation.cr6cd_dix_requestreturnlabel,
      },
      {
        onSuccess: () => toast.success(next ? 'Marked as Forfeit' : 'Forfeit cleared'),
      },
    );
  };

  const tentative = cancellation ? tentativeReleaseDate(cancellation.cr6cd_dix_lastitemreceived) : null;
  const subtitle = cancellation
    ? [typeLabel, cancellation.terminal && `Term ${cancellation.terminal}`, cancellation.cr6cd_dix_drivername]
        .filter(Boolean).join(' · ')
    : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {cancellation && (
        <>
          <div className="px-6 pt-6 pb-5 border-b border-border">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                {view === 'notes' ? (
                  <MessageSquare className="w-6 h-6 text-primary" />
                ) : (
                  <Truck className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {view === 'notes' && (
                    <button
                      onClick={() => setView('tracking')}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-150"
                    >
                      <ArrowLeft className="w-3 h-3" /> Back
                    </button>
                  )}
                  <h2 className="text-xl font-bold text-foreground tracking-tight truncate">
                    {cancellation.cr6cd_dix_name}
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  {tags.map((t) =>
                    t.variant === 'primary' ? (
                      <span
                        key={t.key}
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white"
                        style={{ backgroundColor: t.color }}
                      >
                        {t.label}
                      </span>
                    ) : (
                      <span
                        key={t.key}
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border"
                        style={{ color: t.color, borderColor: t.color, backgroundColor: t.color + '1A' }}
                      >
                        {t.label}
                      </span>
                    ),
                  )}
                  {subtitle && <span className="text-xs text-muted-foreground ml-1">· {subtitle}</span>}
                </div>
              </div>
              {view === 'tracking' && (
                <button
                  onClick={() => onOpenWizard(cancellation)}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-all duration-200 mr-9"
                >
                  <ExternalLink className="w-3 h-3" /> Edit
                </button>
              )}
            </div>

            {view === 'tracking' && (
              <div className="mt-5 flex items-center gap-3">
                <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-muted-foreground font-medium">Equipment progress</span>
                    <span className="font-bold text-foreground">{progress.returned} of {progress.total} returned</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-[#10B981] transition-all duration-500 ease-out rounded-full"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </div>
                <span className={cn(
                  'text-2xl font-bold tabular-nums min-w-[60px] text-right',
                  progress.percent === 100 ? 'text-[#10B981]' : 'text-foreground',
                )}>
                  {progress.percent}%
                </span>
              </div>
            )}
          </div>

          {view === 'tracking' ? (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 min-h-0">
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Equipment</h3>
                {isLoading ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">Loading equipment…</div>
                ) : sorted.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
                    No equipment recorded yet. Open the wizard to seed the catalog.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {sorted.map((item, idx) => (
                      <EquipmentCard
                        key={item.cr6cd_dixcxlequipmentid}
                        item={item}
                        onUpdate={(patch) => handleEqUpdate(item.cr6cd_dixcxlequipmentid, patch)}
                        delayMs={idx * 25}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-1">
                <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Final Release</h3>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Last Item Received</label>
                    <DatePicker
                      value={cancellation.cr6cd_dix_lastitemreceived || ''}
                      onChange={handleLastItemReceived}
                      placeholder="Pick a date"
                    />
                    {tentative && (
                      <p className="text-[11px] text-muted-foreground">
                        Tentative release <span className="font-medium text-foreground">{formatDate(tentative)}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Return Label</h3>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Tracking #</label>
                    <input
                      type="text"
                      defaultValue={cancellation.cr6cd_dix_rltrackingnumber || ''}
                      onBlur={(e) => {
                        if (e.target.value !== (cancellation.cr6cd_dix_rltrackingnumber || '')) {
                          handleTrackingNumber(e.target.value);
                        }
                      }}
                      placeholder="Optional"
                      className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <NotesPanel cancellationId={cxlId!} />
          )}

          {view === 'tracking' && (
            <div className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView('notes')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> View Notes
                  {notes.length > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[10px] font-bold px-1">
                      {notes.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleToggleForfeit}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95',
                    isForfeit
                      ? 'bg-red-500 border-red-500 text-white shadow-sm hover:bg-red-600'
                      : 'border-border bg-background text-foreground hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 hover:text-red-700 hover:-translate-y-0.5',
                  )}
                >
                  <ShieldX className="w-3.5 h-3.5" />
                  {isForfeit ? 'Forfeit ✓' : 'Mark as Forfeit'}
                </button>
                <button
                  onClick={() => handleMarkAll('reactivated')}
                  disabled={sorted.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:border-sky-300 hover:text-sky-700 hover:-translate-y-0.5 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Mark all as Reactivated
                </button>
                <button
                  onClick={() => handleMarkAll('transferred')}
                  disabled={sorted.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:border-purple-300 hover:text-purple-700 hover:-translate-y-0.5 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Mark all as Transferred
                </button>
              </div>
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-9 px-5 bg-[#2563EB] text-white transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-lg hover:shadow-primary/25 active:scale-95"
              >
                Done
              </button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
