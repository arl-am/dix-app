import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAgents } from '../hooks/useAgents';
import { useCreateDriver } from '../hooks/useCreateDriver';
import { calculatePDI } from '../lib/pdiRates';
import type { Driver } from '../lib/mockData';
import type { TestStatus } from './new-entry/Step3Testing';
import type { TransferItemKey } from './new-entry/Step4Transfers';
import StepProgress from './new-entry/StepProgress';
import Step1Setup from './new-entry/Step1Setup';
import Step2RecordDetails from './new-entry/Step2RecordDetails';
import Step3Testing from './new-entry/Step3Testing';
import Step4Transfers from './new-entry/Step4Transfers';
import Step5Deductions from './new-entry/Step5Deductions';
import Step6Review from './new-entry/Step6Review';
import { toast } from 'sonner';

export default function NewEntry() {
  const location = useLocation();
  const editDriver = (location.state as { driver?: Driver } | null)?.driver ?? null;

  const { data: agents = [] } = useAgents();
  const [step, setStep] = useState(editDriver ? 1 : 0);
  const [animating, setAnimating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const [selectedAgent, setSelectedAgent] = useState(editDriver?._cr6cd_dix_agent_value ?? '');
  const [actionType, setActionType] = useState(() => {
    if (!editDriver) return '';
    return editDriver.cr6cd_dix_actiontype === 100000000 ? 'new' : 'new';
  });
  const [contractType, setContractType] = useState<number | null>(editDriver?.cr6cd_dix_contracttype ?? null);
  const [startDate, setStartDate] = useState(editDriver?.cr6cd_dix_onboardingdate ?? new Date().toISOString().split('T')[0]);

  const [form, setForm] = useState<Record<string, string>>(() => {
    if (!editDriver) return {} as Record<string, string>;
    const nameParts = (editDriver.cr6cd_dix_name || '').split(' ');
    return {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: editDriver.cr6cd_dix_email || '',
      phone: editDriver.cr6cd_dix_phonenumber || '',
      ssn: editDriver.cr6cd_dix_ssn || '',
      driverCode: editDriver.cr6cd_dix_drivercode || '',
      licenseNumber: editDriver.cr6cd_dix_licensenumber || '',
      licenseState: editDriver.cr6cd_dix_licensestate || '',
      licenseExpDate: editDriver.cr6cd_dix_licenseexpdate || '',
      streetAddress: editDriver.cr6cd_dix_streetaddress || '',
      city: editDriver.cr6cd_dix_city || '',
      state: editDriver.cr6cd_dix_state || '',
      zipCode: editDriver.cr6cd_dix_zipcode || '',
      fuelCardNumber: editDriver.cr6cd_dix_fuelcardnumber || '',
    } as Record<string, string>;
  });
  const handleFormChange = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const [elpRequired, setElpRequired] = useState(editDriver?.cr6cd_dix_elprequired ?? true);
  const [hazmat, setHazmat] = useState(editDriver?.cr6cd_dix_hazmat ?? false);
  const [hazmatStatus, setHazmatStatus] = useState<TestStatus>('');
  const [homelandStatus, setHomelandStatus] = useState<TestStatus>('');

  const handleHazmatChange = (v: boolean) => {
    setHazmat(v);
    if (v) {
      if (!hazmatStatus) setHazmatStatus('');
      if (!homelandStatus) setHomelandStatus('');
    } else {
      setHazmatStatus('');
      setHomelandStatus('');
    }
  };

  const [transferOccAcc, setTransferOccAcc] = useState(editDriver?.cr6cd_dix_transferoccacc ?? false);
  const [transferEquipment, setTransferEquipment] = useState(editDriver?.cr6cd_dix_transferequipment ?? false);
  const [reactivateEquipment, setReactivateEquipment] = useState(editDriver?.cr6cd_dix_reactivateequipment ?? false);
  const [transferItems, setTransferItems] = useState<Record<TransferItemKey, boolean>>({
    security_deposit: false, eld: false, dashcam: false, plate: false,
  });
  const handleTransferItemChange = (key: TransferItemKey, v: boolean) =>
    setTransferItems((s) => ({ ...s, [key]: v }));
  const [reactivateItems, setReactivateItems] = useState<Record<TransferItemKey, boolean>>({
    security_deposit: false, eld: false, dashcam: false, plate: false,
  });
  const handleReactivateItemChange = (key: TransferItemKey, v: boolean) =>
    setReactivateItems((s) => ({ ...s, [key]: v }));

  const [deductionSelections, setDeductionSelections] = useState<Record<string, boolean>>({});
  const [iftaNumber, setIftaNumber] = useState('');
  const [maintenanceAmount, setMaintenanceAmount] = useState('');
  const toggleDeduction = (key: string) => setDeductionSelections((s) => ({ ...s, [key]: !s[key] }));

  const createDriver = useCreateDriver();

  const agent = agents.find((a) => a.cr6cd_agentsid === selectedAgent) || null;

  const pdi = useMemo(() => calculatePDI(parseFloat(form.truckValue || '0')), [form.truckValue]);

  const validateStep = (s: number): string | null => {
    switch (s) {
      case 0:
        if (!actionType) return 'Please select an action type';
        if (contractType === null) return 'Please select a contract type';
        if (!selectedAgent) return 'Please select a terminal';
        return null;
      case 1:
        if (!form.firstName?.trim()) return 'First Name is required';
        if (!form.lastName?.trim()) return 'Last Name is required';
        if (!form.email?.trim()) return 'Email is required';
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
    if (step === 2 && next > 2) {
      if (hazmat && agent?.cr6cd_hazmatrequired && !hazmatStatus) {
        setHazmatStatus('Queued');
        setHomelandStatus('Queued');
        toast.info('Saving and queuing tests...');
      }
    }
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 150);
  };

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const handleSubmit = () => {
    createDriver.mutate(
      {
        selectedAgent, actionType, contractType, startDate, form,
        elpRequired, hazmat,
        transferOccAcc, transferEquipment, reactivateEquipment,
        transferItems, reactivateItems,
        deductionSelections, iftaNumber, maintenanceAmount,
      },
      {
        onSuccess: () => toast.success('Driver record saved successfully!'),
        onError: (err) => toast.error(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`),
      },
    );
  };

  const animClass = animating
    ? 'opacity-0 translate-y-3 scale-[0.99]'
    : 'opacity-100 translate-y-0 scale-100';

  return (
    <div className="h-full flex flex-col animate-fade-in-up">
      <div className="flex-1 overflow-auto p-6 pb-4" ref={contentRef}>
        <div className="flex justify-center">
          <div className="w-full max-w-[1200px] bg-card border border-border rounded-xl shadow-sm">
            <div className="p-8">
              <StepProgress current={step} />

              <div className={`transition-all duration-200 ease-out ${animClass}`}>
                {step === 0 && (
                  <Step1Setup
                    agents={agents}
                    selectedAgent={selectedAgent}
                    onAgentChange={setSelectedAgent}
                    actionType={actionType}
                    onActionTypeChange={setActionType}
                    contractType={contractType}
                    onContractTypeChange={setContractType}
                    startDate={startDate}
                    onStartDateChange={setStartDate}
                  />
                )}
                {step === 1 && <Step2RecordDetails form={form} onChange={handleFormChange} />}
                {step === 2 && (
                  <Step3Testing
                    agent={agent}
                    elpRequired={elpRequired} onElpChange={setElpRequired}
                    hazmat={hazmat} onHazmatChange={handleHazmatChange}
                    hazmatStatus={hazmatStatus} homelandStatus={homelandStatus}
                  />
                )}
                {step === 3 && (
                  <Step4Transfers
                    transferOccAcc={transferOccAcc} onTransferOccAccChange={setTransferOccAcc}
                    transferEquipment={transferEquipment} onTransferEquipmentChange={setTransferEquipment}
                    reactivateEquipment={reactivateEquipment} onReactivateEquipmentChange={setReactivateEquipment}
                    transferItems={transferItems} onTransferItemChange={handleTransferItemChange}
                    reactivateItems={reactivateItems} onReactivateItemChange={handleReactivateItemChange}
                  />
                )}
                {step === 4 && (
                  <Step5Deductions
                    agent={agent}
                    selections={deductionSelections}
                    onToggle={toggleDeduction}
                    iftaNumber={iftaNumber}
                    onIftaNumberChange={setIftaNumber}
                    maintenanceAmount={maintenanceAmount}
                    onMaintenanceAmountChange={setMaintenanceAmount}
                    pdiMonthly={pdi.pdiMonthly}
                    pdiWeeklyDeposit={pdi.pdiWeeklyDeposit}
                  />
                )}
                {step === 5 && (
                  <Step6Review
                    form={form} agent={agent} actionType={actionType} contractType={contractType}
                    selections={deductionSelections}
                    elpRequired={elpRequired}
                    hazmatStatus={hazmatStatus} homelandStatus={homelandStatus}
                    transferOccAcc={transferOccAcc} transferEquipment={transferEquipment} reactivateEquipment={reactivateEquipment} transferItems={transferItems} reactivateItems={reactivateItems}
                    pdiMonthly={pdi.pdiMonthly} pdiWeeklyDeposit={pdi.pdiWeeklyDeposit}
                    maintenanceAmount={maintenanceAmount} iftaNumber={iftaNumber}
                    onSubmit={handleSubmit} isSaving={createDriver.isPending}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-border/60 bg-background/80 backdrop-blur-xl px-6 py-3">
        <div className="flex justify-center">
          <div className="w-full max-w-[1200px] flex items-center justify-between">
            <div>
              {step > 0 && (
                <button
                  onClick={() => goTo(step - 1)}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:-translate-x-0.5 active:scale-95 h-9 px-4 py-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {step < 5 ? (
                <button
                  onClick={() => goTo(step + 1)}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 text-primary-foreground h-9 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] hover:translate-x-0.5 hover:shadow-lg hover:shadow-primary/25 active:scale-95 min-w-[120px]"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={createDriver.isPending}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 text-primary-foreground h-9 px-6 py-2 bg-[#10B981] hover:bg-[#059669] hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95 min-w-[120px]"
                >
                  {createDriver.isPending ? 'Saving...' : 'Submit'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
