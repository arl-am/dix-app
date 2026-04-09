import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Home, Download, Search, Plus, Pencil, ChevronUp, ChevronDown } from 'lucide-react';
import { useAgents } from '../hooks/useAgents';
import { useCancellations } from '../hooks/useCancellations';
import { toast } from 'sonner';
import { formatDate, cn } from '../lib/utils';
import Spinner from '../components/Spinner';
import CustomSelect from '../components/CustomSelect';
import CancelStepProgress from './cancellation/CancelStepProgress';
import Step1Details from './cancellation/Step1Details';
import Step2Equipment from './cancellation/Step2Equipment';
import Step3TruckBoxes from './cancellation/Step3TruckBoxes';
import Step4FinalRelease from './cancellation/Step4FinalRelease';
import Step5Actions from './cancellation/Step5Actions';
import type { Cancellation } from '../lib/mockData';

const CXL_BADGE: Record<string, string> = {
  'Equipment Return': 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20',
  'Contract End': 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20',
  'Medical': 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
  'Voluntary': 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20',
};

type SortField = 'terminal' | 'driverName' | 'driverCode' | 'unitNumber' | 'cr6cd_dix_requestdate' | 'cr6cd_dix_reason';

// ─────────────────────── LISTING VIEW ───────────────────────
function CancellationListing({ onNew, onEdit }: { onNew: () => void; onEdit: (c: Cancellation) => void }) {
  const { data: cancellations = [], isLoading } = useCancellations();
  const [search, setSearch] = useState('');
  const [terminalFilter, setTerminalFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('cr6cd_dix_requestdate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const filtered = cancellations.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      (c.driverName || '').toLowerCase().includes(q) ||
      (c.driverCode || '').toLowerCase().includes(q) ||
      (c.unitNumber || '').toLowerCase().includes(q);
    const matchesTerminal = terminalFilter === 'all' || c.terminal === terminalFilter;
    const matchesType = typeFilter === 'all' || c.cr6cd_dix_reason === typeFilter;
    return matchesSearch && matchesTerminal && matchesType;
  });

  const sorted = [...filtered].sort((a, b) => {
    const av = (a[sortField] || '') as string;
    const bv = (b[sortField] || '') as string;
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const terminals = [...new Set(cancellations.map((c) => c.terminal).filter((t): t is string => !!t))];
  const types = [...new Set(cancellations.map((c) => c.cr6cd_dix_reason).filter((t): t is string => !!t))];

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className={cn('transition-all duration-200', sortField === field ? 'opacity-100' : 'opacity-30')}>
      {sortField === field && sortDir === 'asc'
        ? <ChevronUp className="w-3.5 h-3.5" />
        : <ChevronDown className="w-3.5 h-3.5" />}
    </span>
  );

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">New Cancellation</h1>
          <p className="text-muted-foreground mt-1">Manage driver cancellations and equipment returns</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" />
            <input
              type="text"
              placeholder="Search by name, code, or unit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-[240px] rounded-full bg-muted/50 border-transparent h-10 pl-10 px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20 focus:shadow-md placeholder:text-muted-foreground"
            />
          </div>
          <CustomSelect
            options={[{ value: 'all', label: 'All Terminals' }, ...terminals.map((t) => ({ value: t, label: t }))]}
            value={terminalFilter}
            onChange={setTerminalFilter}
            className="w-[160px]"
          />
          <CustomSelect
            options={[{ value: 'all', label: 'All CXL Types' }, ...types.map((t) => ({ value: t, label: t }))]}
            value={typeFilter}
            onChange={setTypeFilter}
            className="w-[160px]"
          />
          <button
            onClick={onNew}
            className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-10 px-4 py-2 bg-[#2563EB] text-white transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-lg hover:shadow-primary/25 active:scale-95"
          >
            <Plus className="w-4 h-4" /> New Cancellation
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden animate-fade-in-up transition-all duration-200 hover:shadow-md" style={{ animationDelay: '55ms' }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
            <tr className="border-b">
              {([
                ['terminal', 'Terminal'],
                ['cr6cd_dix_reason', 'CXL Type'],
                ['unitNumber', 'Unit #'],
                ['driverName', 'Driver Name'],
                ['driverCode', 'Driver Code'],
                ['cr6cd_dix_requestdate', 'Cancel Date'],
              ] as [SortField, string][]).map(([field, label]) => (
                <th
                  key={label}
                  className="h-10 px-4 text-left font-semibold text-foreground cursor-pointer select-none transition-colors duration-200 hover:text-primary"
                  onClick={() => toggleSort(field)}
                >
                  <span className="flex items-center gap-1">
                    {label} <SortIcon field={field} />
                  </span>
                </th>
              ))}
              <th className="h-10 px-4 text-left font-semibold text-foreground w-16" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7}><Spinner label="Loading cancellations..." /></td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={7}><Spinner label="No cancellations found" className="[&>div:first-child]:hidden" /></td></tr>
            ) : (
              sorted.map((c, idx) => (
                <tr
                  key={c.cr6cd_dix_cancellationid}
                  className={cn(
                    'border-b cursor-pointer transition-all duration-200 hover:bg-primary/5 active:bg-primary/10',
                    idx % 2 === 0 ? 'bg-card' : 'bg-muted/30',
                  )}
                >
                  <td className="px-4 py-4 whitespace-nowrap font-medium">{c.terminal}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={cn(
                      'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-transform duration-200 hover:scale-105',
                      CXL_BADGE[c.cr6cd_dix_reason] || 'bg-muted text-muted-foreground',
                    )}>
                      {c.cr6cd_dix_reason || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">{c.unitNumber}</td>
                  <td className="px-4 py-4 whitespace-nowrap font-medium">{c.driverName}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">{c.driverCode}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">{formatDate(c.cr6cd_dix_requestdate)}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(c); }}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200 active:scale-90"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!isLoading && sorted.length > 0 && (
          <div className="px-4 py-3 border-t border-border text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">1</span> to <span className="font-medium text-foreground">{sorted.length}</span> of <span className="font-medium text-foreground">{sorted.length}</span> cancellations
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────── WIZARD VIEW ───────────────────────
const NEXT_LABELS = ['Next: Equipment', 'Next: Truck Box', 'Next: Final Release', 'Next: Actions'];

function CancellationWizard({ initialData, onBack }: { initialData?: Record<string, string>; onBack: () => void }) {
  const { data: agents = [] } = useAgents();
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<Record<string, string>>(initialData || {});
  const handleChange = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const [equipment, setEquipment] = useState<Record<string, boolean>>({});
  const toggleEquipment = (key: string) => setEquipment((e) => ({ ...e, [key]: !e[key] }));
  const [plateOption, setPlateOption] = useState('No Fleet');
  const [transferEquipment, setTransferEquipment] = useState(false);

  const [boxContents, setBoxContents] = useState<Record<string, boolean>>({});
  const toggleBox = (item: string) => setBoxContents((b) => ({ ...b, [item]: !b[item] }));
  const [sameAsDriver, setSameAsDriver] = useState(false);

  const [forfeit, setForfeit] = useState(false);

  const validateStep = (s: number): string | null => {
    switch (s) {
      case 0:
        if (!form.cancellationType?.trim()) return 'Please select a cancellation type';
        if (!form.terminal?.trim()) return 'Please select a terminal';
        if (!form.cancellationDate?.trim()) return 'Please select a cancellation date';
        if (!form.cxlFirstName?.trim()) return 'First Name is required';
        if (!form.cxlLastName?.trim()) return 'Last Name is required';
        return null;
      default:
        return null;
    }
  };

  const goTo = (next: number) => {
    if (animating) return;
    if (next > step) {
      const error = validateStep(step);
      if (error) { toast.error(error); return; }
    }
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 150);
  };

  useEffect(() => { contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  const handleComplete = () => {
    toast.success('Cancellation completed!');
    onBack();
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
          {initialData ? 'Edit Cancellation' : 'New Cancellation'}
        </h1>
      </div>
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-[1200px] bg-card border border-border rounded-xl shadow-sm">
          <div className="p-8" ref={contentRef}>
            <CancelStepProgress current={step} />

            <div className={`transition-all duration-200 ease-out ${animClass}`}>
              {step === 0 && <Step1Details form={form} onChange={handleChange} agents={agents} />}
              {step === 1 && <Step2Equipment equipment={equipment} onToggle={toggleEquipment} plateOption={plateOption} onPlateChange={setPlateOption} transferEquipment={transferEquipment} onTransferChange={setTransferEquipment} form={form} />}
              {step === 2 && <Step3TruckBoxes form={form} onChange={handleChange} boxContents={boxContents} onBoxToggle={toggleBox} sameAsDriver={sameAsDriver} onSameAsDriverChange={setSameAsDriver} />}
              {step === 3 && <Step4FinalRelease form={form} onChange={handleChange} forfeit={forfeit} onForfeitChange={setForfeit} />}
              {step === 4 && <Step5Actions form={form} equipment={equipment} />}
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <div className="flex items-center gap-3">
                {step > 0 && (
                  <button onClick={() => goTo(step - 1)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:-translate-x-0.5 active:scale-95 h-9 px-4 py-2">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                )}
                {step === 3 && (
                  <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 border border-input bg-background shadow-sm hover:bg-accent active:scale-95 h-9 px-4 py-2">
                    <Home className="w-4 h-4" /> Home
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {step === 0 && (
                  <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 border border-input bg-background shadow-sm hover:bg-accent active:scale-95 h-9 px-4 py-2">
                    Save
                  </button>
                )}
                {step === 2 && (
                  <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 border border-input bg-background shadow-sm hover:bg-accent active:scale-95 h-9 px-4 py-2">
                    <Download className="w-4 h-4" /> Download
                  </button>
                )}
                {step === 3 && (
                  <>
                    <button className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-9 px-4 py-2 bg-[#2563EB] text-white transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-lg hover:shadow-primary/25 active:scale-95">
                      Generate Final Release PDF
                    </button>
                    <button className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-8 px-3 bg-blue-600 text-white transition-all duration-200 hover:bg-blue-700 active:scale-95">
                      Create Email Draft
                    </button>
                  </>
                )}
                {step === 4 && (
                  <>
                    <button onClick={onBack} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 border border-input bg-background shadow-sm hover:bg-accent active:scale-95 h-9 px-4 py-2">
                      Back to Cancellations
                    </button>
                    <button onClick={handleComplete} className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-9 px-4 py-2 bg-[#2563EB] text-white transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-lg hover:shadow-primary/25 active:scale-95 min-w-[120px]">
                      Complete
                    </button>
                  </>
                )}
                {step < 4 && (
                  <button onClick={() => goTo(step + 1)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 text-primary-foreground h-9 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] hover:translate-x-0.5 hover:shadow-lg hover:shadow-primary/25 active:scale-95 min-w-[120px]">
                    {NEXT_LABELS[step]} <ArrowRight className="w-4 h-4" />
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

// ─────────────────────── MAIN PAGE ───────────────────────
export default function NewCancellation() {
  const [mode, setMode] = useState<'list' | 'new' | 'edit'>('list');
  const [editData, setEditData] = useState<Record<string, string> | undefined>();

  const handleNew = () => {
    setEditData(undefined);
    setMode('new');
  };

  const handleEdit = (c: Cancellation) => {
    setEditData({
      cancellationType: c.cr6cd_dix_reason || '',
      terminal: c.terminal || '',
      cancellationDate: c.cr6cd_dix_requestdate || '',
      cxlFirstName: (c.driverName || '').split(' ')[0] || '',
      cxlLastName: (c.driverName || '').split(' ').slice(1).join(' ') || '',
      cxlDriverCode: c.driverCode || '',
      cxlUnitNumber: c.unitNumber || '',
      cancellationReason: c.cr6cd_dix_cancellationreason || '',
      corporateNotes: c.cr6cd_dix_notes || '',
    });
    setMode('edit');
  };

  const handleBack = () => setMode('list');

  if (mode === 'list') {
    return <CancellationListing onNew={handleNew} onEdit={handleEdit} />;
  }

  return <CancellationWizard initialData={editData} onBack={handleBack} />;
}
