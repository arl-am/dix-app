import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Search, Plus, LayoutGrid, Table } from 'lucide-react';
import { toast } from 'sonner';
import { useAgents } from '../hooks/useAgents';
import { useCancellations, useCancellation } from '../hooks/useCancellations';
import { useCxlEquipment } from '../hooks/useCxlEquipment';
import {
  useSaveSubmit,
  useSeedEquipment,
  useUpdateEquipment,
  useSaveFinalRelease,
  useSetStatus,
} from '../hooks/useCancellationMutation';
import { usePresenceContext } from '../hooks/usePresence';
import CustomSelect from '../components/CustomSelect';
import CancelStepProgress from './cancellation/CancelStepProgress';
import Step1Details, { type Step1Form } from './cancellation/Step1Details';
import Step2Equipment from './cancellation/Step2Equipment';
import Step4FinalRelease, { type Step3Form } from './cancellation/Step4FinalRelease';
import Step5Actions from './cancellation/Step5Actions';
import CancellationKanban from './cancellation/CancellationKanban';
import CancellationTable from './cancellation/CancellationTable';
import TrackingModal from './cancellation/TrackingModal';
import { cn } from '../lib/utils';
import {
  CXL_TYPE_LABELS,
  CXL_TYPE_OPTIONS,
  CXL_STATUS,
  typeNeedsDriver,
  typeNeedsVendor,
  typeNeedsUnit,
  typeNeedsTrailer,
} from '../lib/cancellationConstants';
import { generateCancellationLetter } from '../lib/generateCancellationLetter';
import type { Cancellation } from '../lib/mockData';

const STEP_NEXT_LABELS = ['Next: Equipment', 'Next: Final Release', 'Next: Review', ''];

// ─────────────────────── Listing ───────────────────────
function CancellationListing({ onNew, onEdit }: { onNew: () => void; onEdit: (c: Cancellation) => void }) {
  const { data: cancellations = [], isLoading } = useCancellations();
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const trackingCancellation = useMemo(
    () => cancellations.find((c) => c.cr6cd_dix_cancellationid === trackingId) ?? null,
    [cancellations, trackingId],
  );
  const [search, setSearch] = useState('');
  const [terminalFilter, setTerminalFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [view, setView] = useState<'kanban' | 'table'>('kanban');

  const filtered = cancellations.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      (c.cr6cd_dix_name || '').toLowerCase().includes(q) ||
      (c.cr6cd_dix_drivername || '').toLowerCase().includes(q) ||
      (c.cr6cd_dix_drivercode || '').toLowerCase().includes(q) ||
      (c.cr6cd_dix_unitnumber || '').toLowerCase().includes(q) ||
      (c.cr6cd_dix_vendorname || '').toLowerCase().includes(q);
    const matchesTerminal = terminalFilter === 'all' || c.terminal === terminalFilter;
    const matchesType = typeFilter === 'all' || String(c.cr6cd_dix_canceltype) === typeFilter;
    return matchesSearch && matchesTerminal && matchesType;
  });

  const terminals = [...new Set(cancellations.map((c) => c.terminal).filter((t): t is string => !!t))].sort();

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Cancellations</h1>
          <p className="text-muted-foreground mt-1">Track driver, vendor, and unit cancellations through the full return lifecycle.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
            <button
              onClick={() => setView('kanban')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200',
                view === 'kanban' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban
            </button>
            <button
              onClick={() => setView('table')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200',
                view === 'table' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Table className="w-3.5 h-3.5" /> Table
            </button>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search name, driver, unit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-[260px] rounded-full bg-muted/50 border-transparent h-10 pl-10 px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <CustomSelect
            options={[{ value: 'all', label: 'All Terminals' }, ...terminals.map((t) => ({ value: t, label: t }))]}
            value={terminalFilter}
            onChange={setTerminalFilter}
            className="w-[170px]"
          />
          <CustomSelect
            options={[{ value: 'all', label: 'All Types' }, ...CXL_TYPE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))]}
            value={typeFilter}
            onChange={setTypeFilter}
            className="w-[170px]"
          />
          <button
            onClick={onNew}
            className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-10 px-4 py-2 bg-[#2563EB] text-white transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-lg hover:shadow-primary/25 active:scale-95"
          >
            <Plus className="w-4 h-4" /> New Cancellation
          </button>
        </div>
      </div>

      {view === 'kanban' ? (
        <CancellationKanban
          cancellations={filtered}
          onSelect={(c, isPending) => isPending ? onEdit(c) : setTrackingId(c.cr6cd_dix_cancellationid)}
        />
      ) : (
        <CancellationTable
          cancellations={filtered}
          isLoading={isLoading}
          onTrack={(c, isPending) => isPending ? onEdit(c) : setTrackingId(c.cr6cd_dix_cancellationid)}
          onEdit={onEdit}
        />
      )}

      <TrackingModal
        cancellation={trackingCancellation}
        onClose={() => setTrackingId(null)}
        onOpenWizard={(c) => { setTrackingId(null); onEdit(c); }}
      />
    </div>
  );
}

// ─────────────────────── Wizard ───────────────────────
function CancellationWizard({ cancellationId, onBack }: { cancellationId: string | null; onBack: () => void }) {
  const { data: agents = [] } = useAgents();
  const { currentUser } = usePresenceContext();

  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [cxlId, setCxlId] = useState<string | null>(cancellationId);
  const [pdfBusy, setPdfBusy] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: existing } = useCancellation(cxlId);
  const { data: equipment = [], isLoading: loadingEquipment } = useCxlEquipment(cxlId);

  const saveSubmit = useSaveSubmit();
  const seedEquipment = useSeedEquipment();
  const updateEquipment = useUpdateEquipment();
  const saveFinalRelease = useSaveFinalRelease();
  const setStatus = useSetStatus();

  const [step1, setStep1] = useState<Step1Form>({
    canceltype: null,
    agentId: '',
    canceldate: '',
    startdate: '',
    cancelreason: null,
    reasondetails: '',
    unitnumber: '',
    vendorcode: '',
    vendorname: '',
    drivercode: '',
    drivername: '',
    driverphone: '',
    trailercode: '',
    submittedby: currentUser?.userName || '',
  });

  const [step3, setStep3] = useState<Step3Form>({
    lastitemreceived: '',
    forfeit: false,
    elddeposit: '',
    dashcamdeposit: '',
    pdideposit: '',
    notes: '',
    requestreturnlabel: false,
    rltrackingnumber: '',
    returnlabelurl: '',
  });

  // Hydrate when editing an existing record.
  useEffect(() => {
    if (!existing) return;
    setStep1({
      canceltype: existing.cr6cd_dix_canceltype ?? null,
      agentId: existing._cr6cd_dix_cancagent_value || '',
      canceldate: existing.cr6cd_dix_canceldate || '',
      startdate: existing.cr6cd_dix_startdate || '',
      cancelreason: existing.cr6cd_dix_cancelreason ?? null,
      reasondetails: existing.cr6cd_dix_reasondetails || '',
      unitnumber: existing.cr6cd_dix_unitnumber || '',
      vendorcode: existing.cr6cd_dix_vendorcode || '',
      vendorname: existing.cr6cd_dix_vendorname || '',
      drivercode: existing.cr6cd_dix_drivercode || '',
      drivername: existing.cr6cd_dix_drivername || '',
      driverphone: existing.cr6cd_dix_driverphone || '',
      trailercode: existing.cr6cd_dix_trailercode || '',
      submittedby: existing.cr6cd_dix_submittedby || currentUser?.userName || '',
    });
    setStep3({
      lastitemreceived: existing.cr6cd_dix_lastitemreceived || '',
      forfeit: !!existing.cr6cd_dix_forfeit,
      elddeposit: existing.cr6cd_dix_elddeposit != null ? String(existing.cr6cd_dix_elddeposit) : '',
      dashcamdeposit: existing.cr6cd_dix_dashcamdeposit != null ? String(existing.cr6cd_dix_dashcamdeposit) : '',
      pdideposit: existing.cr6cd_dix_pdideposit != null ? String(existing.cr6cd_dix_pdideposit) : '',
      notes: existing.cr6cd_dix_notes || '',
      requestreturnlabel: !!existing.cr6cd_dix_requestreturnlabel,
      rltrackingnumber: existing.cr6cd_dix_rltrackingnumber || '',
      returnlabelurl: existing.cr6cd_dix_returnlabelurl || '',
    });
  }, [existing, currentUser]);

  useEffect(() => { contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  const selectedAgent = useMemo(() => agents.find((a) => a.cr6cd_agentsid === step1.agentId) || null, [agents, step1.agentId]);
  const terminalLabel = selectedAgent ? `${selectedAgent.cr6cd_terminal} — ${selectedAgent.cr6cd_title}` : '';
  const cancellationName = existing?.cr6cd_dix_name || step1.unitnumber || step1.drivername || step1.vendorname || 'New Cancellation';

  const validateStep1 = (): string | null => {
    if (step1.canceltype == null) return 'Cancellation Type is required';
    if (!step1.agentId) return 'Terminal is required';
    if (!step1.canceldate) return 'Cancel Date is required';
    if (step1.cancelreason == null) return 'Cancel Reason is required';
    if (typeNeedsVendor(step1.canceltype) && !step1.vendorcode.trim()) return 'Vendor Code is required';
    if (typeNeedsDriver(step1.canceltype) && !step1.drivername.trim()) return 'Driver Name is required';
    if (typeNeedsUnit(step1.canceltype) && !step1.unitnumber.trim()) return 'Unit Number is required';
    if (typeNeedsTrailer(step1.canceltype) && !step1.trailercode.trim()) return 'Trailer Number is required';
    return null;
  };

  const goNext = async () => {
    if (animating) return;
    if (step === 0) {
      const err = validateStep1();
      if (err) { toast.error(err); return; }
      try {
        const result = await saveSubmit.mutateAsync({
          cancellationId: cxlId || undefined,
          agentId: step1.agentId,
          canceltype: step1.canceltype!,
          cancelreason: step1.cancelreason!,
          reasondetails: step1.reasondetails,
          unitnumber: step1.unitnumber,
          vendorcode: step1.vendorcode,
          vendorname: step1.vendorname,
          drivercode: step1.drivercode,
          drivername: step1.drivername,
          driverphone: step1.driverphone,
          trailercode: step1.trailercode,
          startdate: step1.startdate,
          canceldate: step1.canceldate,
          submittedby: step1.submittedby,
        });
        if (!cxlId) {
          setCxlId(result.cancellationId);
          await seedEquipment.mutateAsync({
            cancellationId: result.cancellationId,
            canceltype: step1.canceltype!,
          });
        }
        toast.success('Saved.');
      } catch (e) {
        toast.error('Failed to save: ' + (e instanceof Error ? e.message : String(e)));
        return;
      }
    } else if (step === 2 && cxlId) {
      try {
        await saveFinalRelease.mutateAsync({
          cancellationId: cxlId,
          lastitemreceived: step3.lastitemreceived || undefined,
          forfeit: step3.forfeit,
          elddeposit: step3.elddeposit ? parseFloat(step3.elddeposit) : undefined,
          dashcamdeposit: step3.dashcamdeposit ? parseFloat(step3.dashcamdeposit) : undefined,
          pdideposit: step3.pdideposit ? parseFloat(step3.pdideposit) : undefined,
          notes: step3.notes || undefined,
          requestreturnlabel: step3.requestreturnlabel,
          rltrackingnumber: step3.rltrackingnumber || undefined,
          returnlabelurl: step3.returnlabelurl || undefined,
          allitemsrcvddate: step3.lastitemreceived || undefined,
        });
        toast.success('Final release saved.');
      } catch (e) {
        toast.error('Failed to save: ' + (e instanceof Error ? e.message : String(e)));
        return;
      }
    }
    setAnimating(true);
    setTimeout(() => { setStep((s) => Math.min(s + 1, 3)); setAnimating(false); }, 150);
  };

  const goBack = () => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => { setStep((s) => Math.max(s - 1, 0)); setAnimating(false); }, 150);
  };

  const onUpdateEquipmentRow = (id: string, patch: Partial<{ lifecycleState: number; returneddate: string; notes: string }>) => {
    if (!cxlId) return;
    const current = equipment.find((e) => e.cr6cd_dixcxlequipmentid === id);
    const newLifecycle = patch.lifecycleState ?? current?.cr6cd_lifecyclestate ?? 100000000;
    updateEquipment.mutate({
      cancellationId: cxlId,
      equipmentId: id,
      lifecycleState: newLifecycle,
      returneddate: patch.returneddate,
      notes: patch.notes,
    });
  };

  const handleGeneratePdf = async () => {
    if (!existing) return;
    setPdfBusy(true);
    try {
      generateCancellationLetter({
        cancellation: existing,
        agent: selectedAgent,
        equipment,
        sentBy: currentUser?.userName || 'Operations',
      });
    } catch (e) {
      toast.error('PDF failed: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setPdfBusy(false);
    }
  };

  const handleCreateEmailDraft = () => {
    toast.info('Email draft flow not yet wired. Coming soon.');
  };

  const handleSetStatus = (status: number) => {
    if (!cxlId) return;
    setStatus.mutate({ cancellationId: cxlId, status }, {
      onSuccess: () => {
        toast.success(`Status updated.`);
        if (status === CXL_STATUS.RELEASED) toast.success('Cancellation released.');
      },
      onError: () => toast.error('Failed to update status'),
    });
  };

  const animClass = animating ? 'opacity-0 translate-y-3 scale-[0.99]' : 'opacity-100 translate-y-0 scale-100';

  return (
    <div className="p-6 animate-fade-in-up">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-input bg-background shadow-sm transition-all duration-200 hover:bg-accent active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          {cancellationId || cxlId ? 'Edit Cancellation' : 'New Cancellation'}
        </h1>
        {cancellationName && (
          <span className="ml-2 inline-flex items-center rounded-md bg-primary/10 text-primary px-2.5 py-1 text-xs font-bold">
            {cancellationName}
          </span>
        )}
      </div>

      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-[1280px] bg-card border border-border rounded-xl shadow-sm">
          <div className="p-8" ref={contentRef}>
            <CancelStepProgress current={step} />

            <div className={`transition-all duration-200 ease-out ${animClass}`}>
              {step === 0 && (
                <Step1Details
                  form={step1}
                  onChange={(field, value) => setStep1((f) => ({ ...f, [field]: value }))}
                  agents={agents}
                />
              )}
              {step === 1 && (
                <Step2Equipment
                  equipment={equipment}
                  isLoading={loadingEquipment}
                  onUpdate={onUpdateEquipmentRow}
                  cancellationName={cancellationName}
                  terminalLabel={terminalLabel}
                />
              )}
              {step === 2 && (
                <Step4FinalRelease
                  form={step3}
                  onChange={(field, value) => setStep3((f) => ({ ...f, [field]: value }))}
                  cancellationName={cancellationName}
                  terminalLabel={terminalLabel}
                  driverName={step1.drivername}
                />
              )}
              {step === 3 && existing && (
                <Step5Actions
                  cancellation={existing}
                  equipment={equipment}
                  terminalLabel={terminalLabel}
                  onSetStatus={handleSetStatus}
                  onGeneratePdf={handleGeneratePdf}
                  onCreateEmailDraft={handleCreateEmailDraft}
                  pdfBusy={pdfBusy}
                />
              )}
              {step === 3 && !existing && (
                <p className="text-sm text-muted-foreground p-8 text-center">Loading record...</p>
              )}
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <div>
                {step > 0 && (
                  <button
                    onClick={goBack}
                    className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent active:scale-95 h-9 px-4 py-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {step < 3 ? (
                  <button
                    onClick={goNext}
                    disabled={saveSubmit.isPending || saveFinalRelease.isPending}
                    className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium text-white h-9 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-95 min-w-[160px] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saveSubmit.isPending || saveFinalRelease.isPending ? 'Saving...' : STEP_NEXT_LABELS[step]} {!saveSubmit.isPending && <ArrowRight className="w-4 h-4" />}
                  </button>
                ) : (
                  <button
                    onClick={onBack}
                    className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium text-white h-9 px-4 py-2 bg-[#10B981] hover:bg-[#059669] active:scale-95"
                  >
                    Back to Cancellations
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────── Page ───────────────────────
export default function NewCancellation() {
  const [mode, setMode] = useState<'list' | 'wizard'>('list');
  const [editId, setEditId] = useState<string | null>(null);

  const handleNew = () => { setEditId(null); setMode('wizard'); };
  const handleEdit = (c: Cancellation) => { setEditId(c.cr6cd_dix_cancellationid); setMode('wizard'); };
  const handleBack = () => setMode('list');

  if (mode === 'list') return <CancellationListing onNew={handleNew} onEdit={handleEdit} />;
  return <CancellationWizard cancellationId={editId} onBack={handleBack} />;
}

// Keep export to satisfy referenced symbols list
export const _CXL_TYPE_LABELS = CXL_TYPE_LABELS;
