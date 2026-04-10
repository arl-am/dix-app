import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAgents } from '../hooks/useAgents';
import { useSaveDetails, useSaveTesting, useSaveTransfers, useSaveDeductions } from '../hooks/useDriverMutation';
import { calculatePDI } from '../lib/pdiRates';
import { isLocal } from '../lib/utils';
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
  const locState = location.state as { driver?: Driver; startStep?: number } | null;
  const editDriver = locState?.driver ?? null;
  const initialStep = locState?.startStep ?? (editDriver ? 1 : 0);

  const { data: agents = [] } = useAgents();
  const [step, setStep] = useState(initialStep);
  const [animating, setAnimating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const [driverId, setDriverId] = useState<string | undefined>(editDriver?.cr6cd_dix_driverid);
  const [vendorId, setVendorId] = useState<string | undefined>(editDriver?._cr6cd_dix_vendor_value || undefined);
  const [unitId, setUnitId] = useState<string | undefined>(editDriver?._cr6cd_dix_unit_value || undefined);

  const { data: vendorData } = useQuery({
    queryKey: ['edit-vendor', vendorId],
    queryFn: async () => {
      if (!vendorId || isLocal) return null;
      const { Cr6cd_dix_vendorsService } = await import('../generated');
      const r = await Cr6cd_dix_vendorsService.get(vendorId);
      return r.data as Record<string, any> | null;
    },
    enabled: !!vendorId,
  });

  const { data: unitData } = useQuery({
    queryKey: ['edit-unit', unitId],
    queryFn: async () => {
      if (!unitId || isLocal) return null;
      const { Cr6cd_dix_unitsService } = await import('../generated');
      const r = await Cr6cd_dix_unitsService.get(unitId);
      return r.data as Record<string, any> | null;
    },
    enabled: !!unitId,
  });

  const { data: deductionData } = useQuery({
    queryKey: ['edit-deductions', driverId],
    queryFn: async () => {
      if (!driverId || !editDriver || isLocal) return null;
      const { Cr6cd_dix_driverdeductionsService } = await import('../generated');
      const r = await Cr6cd_dix_driverdeductionsService.getAll({
        filter: `_cr6cd_dix_deductiondriver_value eq '${driverId}'`,
        select: ['cr6cd_dix_deductionkey', 'cr6cd_dix_selected', 'cr6cd_dix_iftanumber', 'cr6cd_dix_customvalue'],
      });
      return (r.data || []) as Record<string, any>[];
    },
    enabled: !!driverId && !!editDriver,
  });

  useEffect(() => {
    if (!vendorData) return;
    setForm((f) => ({
      ...f,
      businessName: vendorData.cr6cd_dix_businessname || '',
      vendorCode: vendorData.cr6cd_dix_vendorcode || '',
      einNumber: vendorData.cr6cd_dix_einnumber || '',
      vendorPhone: vendorData.cr6cd_dix_phonenumber || '',
      vendorAddress: vendorData.cr6cd_dix_streetaddress || '',
      vendorCity: vendorData.cr6cd_dix_city || '',
      vendorState: vendorData.cr6cd_dix_state || '',
      vendorZipCode: vendorData.cr6cd_dix_zipcode || '',
    }));
  }, [vendorData]);

  useEffect(() => {
    if (!unitData) return;
    setForm((f) => ({
      ...f,
      unitNumber: unitData.cr6cd_dix_unitnumber || '',
      year: unitData.cr6cd_dix_year != null ? String(unitData.cr6cd_dix_year) : '',
      make: unitData.cr6cd_dix_make || '',
      model: unitData.cr6cd_dix_model || '',
      vin: unitData.cr6cd_dix_vin || '',
      color: unitData.cr6cd_dix_color || '',
      truckValue: unitData.cr6cd_dix_truckvalue != null ? String(unitData.cr6cd_dix_truckvalue) : '',
      unladenWeight: unitData.cr6cd_dix_unladenweight != null ? String(unitData.cr6cd_dix_unladenweight) : '',
      purchaseDate: unitData.cr6cd_dix_purchasedate ? unitData.cr6cd_dix_purchasedate.split('T')[0] : '',
    }));
  }, [unitData]);

  useEffect(() => {
    if (!deductionData || deductionData.length === 0) return;
    const selections: Record<string, boolean> = {};
    let ifta = '';
    let maintenance = '';
    const tItems: Record<TransferItemKey, boolean> = { security_deposit: false, eld: false, dashcam: false, plate: false };
    const rItems: Record<TransferItemKey, boolean> = { security_deposit: false, eld: false, dashcam: false, plate: false };
    for (const d of deductionData) {
      if (!d.cr6cd_dix_selected) continue;
      const key = d.cr6cd_dix_deductionkey as string;
      if (key.startsWith('transfer_')) {
        const k = key.replace('transfer_', '') as TransferItemKey;
        if (k in tItems) tItems[k] = true;
      } else if (key.startsWith('reactivate_')) {
        const k = key.replace('reactivate_', '') as TransferItemKey;
        if (k in rItems) rItems[k] = true;
      } else {
        selections[key] = true;
        if (key === 'ifta' && d.cr6cd_dix_iftanumber) ifta = d.cr6cd_dix_iftanumber;
        if (key === 'maintenance_fund' && d.cr6cd_dix_customvalue != null) maintenance = String(d.cr6cd_dix_customvalue);
      }
    }
    setDeductionSelections(selections);
    setTransferItems(tItems);
    setReactivateItems(rItems);
    if (ifta) setIftaNumber(ifta);
    if (maintenance) setMaintenanceAmount(maintenance);
  }, [deductionData]);

  const [selectedAgent, setSelectedAgent] = useState(editDriver?._cr6cd_dix_agent_value ?? '');
  const [actionType, setActionType] = useState(() => {
    if (!editDriver) return '';
    return editDriver.cr6cd_dix_actiontype === 100000000 ? 'new' : 'move';
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

  const saveDetailsMut = useSaveDetails();
  const saveTestingMut = useSaveTesting();
  const saveTransfersMut = useSaveTransfers();
  const saveDeductionsMut = useSaveDeductions();

  const isSaving = saveDetailsMut.isPending || saveTestingMut.isPending || saveTransfersMut.isPending || saveDeductionsMut.isPending;

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

  const animateStep = (next: number) => {
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 150);
  };

  const goTo = async (next: number) => {
    if (animating || isSaving) return;

    if (next > step) {
      const error = validateStep(step);
      if (error) { toast.error(error); return; }
    }

    if (next < step) {
      animateStep(next);
      return;
    }

    if (step === 1 && next === 2) {
      saveDetailsMut.mutate(
        { driverId, vendorId, unitId, selectedAgent, actionType, contractType, startDate, form },
        {
          onSuccess: (result) => {
            setDriverId(result.driverId);
            if (result.vendorId) setVendorId(result.vendorId);
            if (result.unitId) setUnitId(result.unitId);
            toast.success('Driver details saved');
            animateStep(next);
          },
          onError: (err) => toast.error(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`),
        },
      );
      return;
    }

    if (step === 2 && next === 3) {
      if (!driverId) { toast.error('Driver record not created yet'); return; }
      if (hazmat && agent?.cr6cd_hazmatrequired && !hazmatStatus) {
        setHazmatStatus('Queued');
        setHomelandStatus('Queued');
      }
      saveTestingMut.mutate(
        { driverId, elpRequired, hazmat },
        {
          onSuccess: () => {
            toast.success('Testing & compliance saved');
            animateStep(next);
          },
          onError: (err) => toast.error(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`),
        },
      );
      return;
    }

    if (step === 3 && next === 4) {
      if (!driverId) { toast.error('Driver record not created yet'); return; }
      saveTransfersMut.mutate(
        { driverId, transferOccAcc, transferEquipment, reactivateEquipment, transferItems, reactivateItems },
        {
          onSuccess: () => {
            toast.success('Transfers & reactivation saved');
            animateStep(next);
          },
          onError: (err) => toast.error(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`),
        },
      );
      return;
    }

    if (step === 4 && next === 5) {
      if (!driverId) { toast.error('Driver record not created yet'); return; }
      const hasDeductions = Object.values(deductionSelections).some(Boolean);
      if (hasDeductions) {
        saveDeductionsMut.mutate(
          { driverId, deductionSelections, iftaNumber, maintenanceAmount },
          {
            onSuccess: () => {
                toast.success('Deductions saved');
              animateStep(next);
            },
            onError: (err) => toast.error(`Save failed: ${err instanceof Error ? err.message : 'Unknown error'}`),
          },
        );
      } else {
        animateStep(next);
      }
      return;
    }

    animateStep(next);
  };

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const animClass = animating
    ? 'opacity-0 translate-y-2'
    : 'opacity-100 translate-y-0';

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
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={() => goTo(step - 1)}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:-translate-x-0.5 active:scale-95 h-9 px-4 py-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
              )}
              {step === 5 && (
                <button
                  onClick={() => {
                    setDriverId(undefined);
                    setVendorId(undefined);
                    setUnitId(undefined);
                    setSelectedAgent('');
                    setActionType('');
                    setContractType(null);
                    setStartDate(new Date().toISOString().split('T')[0]);
                    setForm({});
                    setElpRequired(true);
                    setHazmat(false);
                    setHazmatStatus('');
                    setHomelandStatus('');
                    setTransferOccAcc(false);
                    setTransferEquipment(false);
                    setReactivateEquipment(false);
                    setTransferItems({ security_deposit: false, eld: false, dashcam: false, plate: false });
                    setReactivateItems({ security_deposit: false, eld: false, dashcam: false, plate: false });
                    setDeductionSelections({});
                    setIftaNumber('');
                    setMaintenanceAmount('');
                    setStep(0);
                  }}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 text-primary-foreground h-9 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] hover:shadow-lg hover:shadow-primary/25 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  New Entry
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {step < 5 ? (
                <button
                  onClick={() => goTo(step + 1)}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 text-primary-foreground h-9 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] hover:translate-x-0.5 hover:shadow-lg hover:shadow-primary/25 active:scale-95 min-w-[120px] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSaving ? 'Saving...' : 'Next'}
                  {!isSaving && <ArrowRight className="w-4 h-4" />}
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
