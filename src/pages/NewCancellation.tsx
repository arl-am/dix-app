import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Search, Plus, LayoutGrid, Table } from 'lucide-react';
import { toast } from 'sonner';
import { useAgents } from '../hooks/useAgents';
import { useCancellations, useCancellation } from '../hooks/useCancellations';
import { useCxlEquipment } from '../hooks/useCxlEquipment';
import {
  useSaveSubmit,
  useSeedEquipment,
  useUpdateEquipment,
  useSaveIntakeExtras,
  useSaveBypass,
} from '../hooks/useCancellationMutation';
import { usePresenceContext } from '../hooks/usePresence';
import CustomSelect from '../components/CustomSelect';
import CancelStepProgress from './cancellation/CancelStepProgress';
import Step1Details, { type Step1Form } from './cancellation/Step1Details';
import Step2Equipment, { type IntakeExtras } from './cancellation/Step2Equipment';
import Step3ReturnAddress from './cancellation/Step3ReturnAddress';
import Step5Actions from './cancellation/Step5Actions';
import CancellationKanban from './cancellation/CancellationKanban';
import CancellationTable from './cancellation/CancellationTable';
import TrackingModal from './cancellation/TrackingModal';
import { cn } from '../lib/utils';
import {
  CXL_TYPE_OPTIONS,
  EQUIPMENT_LIFECYCLE,
  typeNeedsDriver,
  typeNeedsVendor,
  typeNeedsUnit,
  typeNeedsTrailer,
} from '../lib/cancellationConstants';
import type { Cancellation } from '../lib/mockData';

// ─────────────────────── Listing ───────────────────────
function CancellationListing({ onNew, onEdit }: { onNew: () => void; onEdit: (c: Cancellation) => void }) {
  const { data: cancellations = [], isLoading } = useCancellations();
  const [search, setSearch] = useState('');
  const [terminalFilter, setTerminalFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [view, setView] = useState<'kanban' | 'table'>('table');
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const trackingCancellation = useMemo(
    () => cancellations.find((c) => c.cr6cd_dix_cancellationid === trackingId) ?? null,
    [cancellations, trackingId],
  );

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
    <div className="p-6 animate-fade-in-up">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
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
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: existing } = useCancellation(cxlId);
  const { data: equipment = [], isLoading: loadingEquipment } = useCxlEquipment(cxlId);

  const saveSubmit = useSaveSubmit();
  const seedEquipment = useSeedEquipment();
  const updateEquipment = useUpdateEquipment();
  const saveIntakeExtras = useSaveIntakeExtras();
  const saveBypass = useSaveBypass();

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

  const [extras, setExtras] = useState<IntakeExtras>({
    transferredtounit: '',
    prepassnumber: '',
    rfidnumber: '',
    platenumber: '',
    fleetnumber: '',
    logsfromdate: '',
    logstodate: '',
  });

  const [bypass, setBypass] = useState(false);

  // Hydrate from existing record.
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
    setExtras({
      transferredtounit: existing.cr6cd_dix_transferredtounit || '',
      prepassnumber: existing.cr6cd_dix_prepassnumber || '',
      rfidnumber: existing.cr6cd_dix_rfidnumber || '',
      platenumber: existing.cr6cd_dix_platenumber || '',
      fleetnumber: existing.cr6cd_dix_fleetnumber || '',
      logsfromdate: existing.cr6cd_dix_logsfromdate || '',
      logstodate: existing.cr6cd_dix_logstodate || '',
    });
    setBypass(!!existing.cr6cd_dix_bypassagentaddress);
  }, [existing, currentUser]);

  useEffect(() => { contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  const selectedAgent = useMemo(() => agents.find((a) => a.cr6cd_agentsid === step1.agentId) || null, [agents, step1.agentId]);
  const terminalLabel = selectedAgent ? `${selectedAgent.cr6cd_terminal} · ${selectedAgent.cr6cd_title}` : '';
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

  const isSaving = saveSubmit.isPending || seedEquipment.isPending || saveIntakeExtras.isPending || saveBypass.isPending;

  const goNext = async () => {
    if (animating || isSaving) return;
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
    } else if (step === 1 && cxlId) {
      try {
        await saveIntakeExtras.mutateAsync({ cancellationId: cxlId, ...extras });
      } catch (e) {
        toast.error('Failed to save: ' + (e instanceof Error ? e.message : String(e)));
        return;
      }
    } else if (step === 2 && cxlId) {
      try {
        await saveBypass.mutateAsync({ cancellationId: cxlId, bypass });
      } catch (e) {
        toast.error('Failed to save: ' + (e instanceof Error ? e.message : String(e)));
        return;
      }
    }
    setAnimating(true);
    setTimeout(() => { setStep((s) => Math.min(s + 1, 3)); setAnimating(false); }, 150);
  };

  const goPrev = () => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => { setStep((s) => Math.max(s - 1, 0)); setAnimating(false); }, 150);
  };

  const onPrimaryChange = (id: string, lifecycleState: number) => {
    if (!cxlId) return;
    const clearQualifiers = lifecycleState === EQUIPMENT_LIFECYCLE.NA;
    updateEquipment.mutate({
      cancellationId: cxlId,
      equipmentId: id,
      lifecycleState,
      ...(clearQualifiers ? { istransferred: false, isreactivated: false } : {}),
    });
  };

  const onQualifierToggle = (id: string, key: 'transferred' | 'reactivated', value: boolean) => {
    if (!cxlId) return;
    const patch = key === 'transferred' ? { istransferred: value } : { isreactivated: value };
    updateEquipment.mutate({ cancellationId: cxlId, equipmentId: id, ...patch });
  };

  const animClass = animating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0';

  return (
    <div className="h-full flex flex-col animate-fade-in-up">
      <div className="flex-1 overflow-auto p-6 pb-4" ref={contentRef}>
        <div className="flex justify-center">
          <div className="w-full max-w-[1280px] bg-card border border-border rounded-xl shadow-sm overflow-hidden">

            <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-card via-card to-primary/[0.04]">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={onBack}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-input bg-background shadow-sm transition-all duration-200 hover:bg-accent active:scale-95"
                  aria-label="Back to listing"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h1 className="text-lg font-bold text-foreground tracking-tight">
                    {cancellationId || cxlId ? 'Edit Cancellation' : 'New Cancellation'}
                  </h1>
                  <p className="text-[11px] text-muted-foreground">
                    {cxlId ? `Updating ${cancellationName}` : 'Capture intake details, requirements, and return address.'}
                  </p>
                </div>
                <div className="flex-1" />
                <div className="flex items-center gap-2 flex-wrap">
                  {step1.unitnumber && <InfoChip label="Unit" value={step1.unitnumber} />}
                  {selectedAgent && <InfoChip label="Terminal" value={selectedAgent.cr6cd_terminal} />}
                  {step1.drivername && <InfoChip label="Driver" value={step1.drivername} />}
                  {step1.vendorname && <InfoChip label="Vendor" value={step1.vendorname} />}
                </div>
              </div>
            </div>

            <div className="p-8">
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
                    onPrimaryChange={onPrimaryChange}
                    onQualifierToggle={onQualifierToggle}
                    extras={extras}
                    onExtraChange={(field, value) => setExtras((e) => ({ ...e, [field]: value }))}
                  />
                )}
                {step === 2 && (
                  <Step3ReturnAddress
                    agent={selectedAgent}
                    bypass={bypass}
                    onBypassChange={setBypass}
                  />
                )}
                {step === 3 && existing && (
                  <Step5Actions
                    cancellation={existing}
                    equipment={equipment}
                    agent={selectedAgent}
                    terminalLabel={terminalLabel}
                  />
                )}
                {step === 3 && !existing && (
                  <p className="text-sm text-muted-foreground p-8 text-center">Loading record...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-border/60 bg-background/80 backdrop-blur-xl px-6 py-3">
        <div className="flex justify-center">
          <div className="w-full max-w-[1280px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={goPrev}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:-translate-x-0.5 transition-all duration-200 active:scale-95 h-9 px-4 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ArrowLeft className="w-4 h-4" /> Previous
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {step < 3 ? (
                <button
                  onClick={goNext}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium text-white h-9 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] hover:translate-x-0.5 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 active:scale-95 min-w-[120px] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSaving ? 'Saving…' : 'Next'} {!isSaving && <ArrowRight className="w-4 h-4" />}
                </button>
              ) : (
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  All sections saved
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 border border-border/60 px-2.5 py-0.5 text-[11px]">
      <span className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
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
