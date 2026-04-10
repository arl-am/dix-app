import { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, Building2, FileText, Shield, Star, Minus, Clock, Mail, CheckCircle, XCircle, Download, FileSignature, BadgeCheck, Truck, ClipboardList, Send, X, ChevronDown, Check, ListChecks, FileSpreadsheet, PackageOpen } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { CONTRACT_TYPE_LABELS, US_STATES, type Agent } from '../../lib/mockData';
import { generateAgentConfirmation } from '../../lib/generateAgentConfirmation';
import { generateFleetCommitment } from '../../lib/generateFleetCommitment';
import { generateRoadTest } from '../../lib/generateRoadTest';
import { generateWelcomeLetter, type WelcomeLetterData } from '../../lib/generateWelcomeLetter';
import { generateRecruitingChecklist } from '../../lib/generateRecruitingChecklist';
import { generateIrpLease, type IrpLeaseModalData } from '../../lib/generateIrpLease';
import { generateTruckBoxForms, type TruckBoxFormData, type BoxItems } from '../../lib/generateTruckBox';
import CustomSelect from '../../components/CustomSelect';
import Toggle from '../../components/Toggle';
import { toast } from 'sonner';
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
  reactivateItems: Record<TransferItemKey, boolean>;
  pdiMonthly: number;
  pdiWeeklyDeposit: number;
  maintenanceAmount: string;
  iftaNumber: string;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; classes: string; label: string }> = {
  notRequired: { icon: Star, classes: 'bg-muted/60 text-muted-foreground border-border', label: 'Not Required' },
  notSent: { icon: Minus, classes: 'bg-muted/60 text-muted-foreground border-border', label: 'Not Sent' },
  Queued: { icon: Clock, classes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', label: 'Queued' },
  Sent: { icon: Mail, classes: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20', label: 'Sent' },
  Passed: { icon: CheckCircle, classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', label: 'Passed' },
  Failed: { icon: XCircle, classes: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', label: 'Failed' },
};

const CONTRACT_MAP = CONTRACT_TYPE_LABELS;

const STARTUP_DOCUMENTS = [
  { id: 'lease_agreement', name: 'Lease Agreement', icon: FileSignature },
  { id: 'agent_confirmation', name: 'Agent Confirmation', icon: BadgeCheck },
  { id: 'fleet_commitment', name: 'Fleet Commitment', icon: Truck },
  { id: 'road_test_ibe', name: 'Road Test & IBE Data Sheet', icon: ClipboardList },
  { id: 'welcome_letter', name: 'Welcome Letter', icon: Send },
];

const RECRUITING_DOCUMENTS = [
  { id: 'deductions_checklist', name: 'Deductions Checklist', icon: ListChecks },
  { id: 'irp_lease', name: 'IRP Lease', icon: FileSpreadsheet },
];

const EQUIPMENT_DOCUMENTS = [
  { id: 'truck_box', name: 'Truck Box Forms', icon: PackageOpen },
];

const DEDUCTION_LABELS: Record<string, string> = {
  occacc: 'Occ/Acc Insurance', bobtail: 'Bobtail Insurance', pdi: 'Physical Damage Ins (PDI)',
  security_deposit: 'Security Deposit', eld_deposit: 'ELD Deposit', dashcam_deposit: 'DashCam Deposit',
  buydown: 'Buy-Down Program', ifta: 'IFTA', irp_plate_prepaid: 'IRP Plate: PrePaid',
  irp_plate_settlements: 'IRP Plate: Settlements', prepass_tolls_bypass: 'PrePass: Tolls & Bypass',
  prepass_bypass: 'PrePass: Bypass', maintenance_fund: 'Maintenance Fund',
  chassis_usage: 'Chassis Usage', rfid: 'RFID Tag',
};

export default function Step6Review({
  form, agent, actionType, contractType, selections,
  elpRequired, hazmatStatus, homelandStatus,
  transferOccAcc, transferEquipment, reactivateEquipment, transferItems, reactivateItems,
  pdiMonthly, pdiWeeklyDeposit, maintenanceAmount, iftaNumber,
}: Step6Props) {
  const selectedDeductions = Object.entries(selections).filter(([, v]) => v).map(([k]) => k);
  const transferItemsList = (Object.entries(transferItems) as [TransferItemKey, boolean][]).filter(([, v]) => v).map(([k]) => k);
  const reactivateItemsList = (Object.entries(reactivateItems) as [TransferItemKey, boolean][]).filter(([, v]) => v).map(([k]) => k);

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeClosing, setWelcomeClosing] = useState(false);
  const [welcomeData, setWelcomeData] = useState<WelcomeLetterData>({
    uiiaPinCode: '',
    enteredInEModal: false,
    dualScac: false,
    scacCode: '',
    scacPin: '',
  });
  const [welcomeGenerating, setWelcomeGenerating] = useState(false);

  const [showIrpModal, setShowIrpModal] = useState(false);
  const [irpClosing, setIrpClosing] = useState(false);
  const [irpData, setIrpData] = useState<IrpLeaseModalData>({
    vendorName: '', vendorStreet: '', vendorCity: '', vendorState: '', vendorZip: '',
    truckOwnerName: '', year: '', make: '', vin: '', lesseeName: '',
  });
  const [irpGenerating, setIrpGenerating] = useState(false);

  const openIrpModal = () => {
    setIrpData({
      vendorName: form.businessName || '',
      vendorStreet: form.vendorAddress || '',
      vendorCity: form.vendorCity || '',
      vendorState: form.vendorState || '',
      vendorZip: form.vendorZipCode || '',
      truckOwnerName: '',
      year: form.year || '',
      make: form.make || '',
      vin: form.vin || '',
      lesseeName: '',
    });
    setShowIrpModal(true);
  };

  const closeIrpModal = () => {
    setIrpClosing(true);
    setTimeout(() => { setShowIrpModal(false); setIrpClosing(false); }, 200);
  };

  const handleIrpGenerate = async () => {
    setIrpGenerating(true);
    try {
      await generateIrpLease({ data: irpData });
      toast.success('IRP Lease downloaded');
      closeIrpModal();
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIrpGenerating(false);
    }
  };

  const [showTruckBoxModal, setShowTruckBoxModal] = useState(false);
  const [truckBoxClosing, setTruckBoxClosing] = useState(false);
  const [tbSameAddr, setTbSameAddr] = useState(false);
  const defaultOnItems: BoxItems = { bols: true, logBook: true, insuranceCard: true, greenRegulationBook: true, zipTies: true, doorStrap: true, doorSigns: true, iftaStickers: true, fuelCard: false, rfidTag: false, prePass: false, hazmatBooks: false, eld: false, dashCam: false, mdLiquor: false };
  const [truckBoxData, setTruckBoxData] = useState<TruckBoxFormData>({
    terminal: '', date: new Date().toISOString().split('T')[0], sendingTo: '', receiverName: '',
    street: '', city: '', state: '', zipCode: '', receiverPhone: '', sentBy: 'Anderson Marquez',
    deliveryType: 'Priority Overnight (By 10:00 AM)', billingInfo: 'ARL Transport LLC', unitNumber: '', boxItems: { ...defaultOnItems },
    truckColor: '', motorCarrierName: '', cableType: '', recruiterName: 'Anderson Marquez',
  });

  const openTruckBoxModal = () => {
    setTbSameAddr(false);
    setTruckBoxData((d) => ({
      ...d,
      terminal: agent?.cr6cd_terminal || '',
      unitNumber: form.unitNumber || '',
      truckColor: form.color || '',
      motorCarrierName: agent?.cr6cd_motorcarrier || '',
      receiverName: `${form.firstName || ''} ${form.lastName || ''}`.trim(),
      street: '', city: '', state: '', zipCode: '',
      boxItems: { ...defaultOnItems },
    }));
    setShowTruckBoxModal(true);
  };

  const handleTbSameAddr = (v: boolean) => {
    setTbSameAddr(v);
    if (v) {
      setTruckBoxData((d) => ({ ...d, street: form.streetAddress || '', city: form.city || '', state: form.state || '', zipCode: form.zipCode || '' }));
    }
  };

  const closeTruckBoxModal = () => { setTruckBoxClosing(true); setTimeout(() => { setShowTruckBoxModal(false); setTruckBoxClosing(false); }, 200); };

  const handleTruckBoxGenerate = async () => {
    try { await generateTruckBoxForms(truckBoxData); toast.success('Truck Box Forms downloaded'); closeTruckBoxModal(); }
    catch (err) { toast.error(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`); }
  };

  const tbField = (key: keyof TruckBoxFormData, label: string, opts?: { type?: string }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input type={opts?.type || 'text'} value={(truckBoxData[key] as string) || ''} onChange={(e) => setTruckBoxData((d) => ({ ...d, [key]: e.target.value }))}
        className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground" />
    </div>
  );

  const BOX_ITEM_LABELS: [keyof BoxItems, string][] = [
    ['bols', 'BOLs'], ['logBook', 'Log Book'], ['insuranceCard', 'Insurance Card'],
    ['greenRegulationBook', 'Green Regulation Book'], ['zipTies', 'Zip Ties'], ['doorStrap', 'Door Strap'],
    ['doorSigns', 'Door Signs'], ['iftaStickers', 'IFTA Stickers'], ['fuelCard', 'Fuel Card'],
    ['rfidTag', 'RFID Tag'], ['prePass', 'Pre-Pass'], ['hazmatBooks', 'Hazmat Books'],
    ['eld', 'ELD'], ['dashCam', 'Dash Cam'], ['mdLiquor', 'MD Liquor'],
  ];

  const closeWelcomeModal = () => {
    setWelcomeClosing(true);
    setTimeout(() => { setShowWelcomeModal(false); setWelcomeClosing(false); }, 200);
  };

  const handleWelcomeGenerate = async () => {
    setWelcomeGenerating(true);
    try {
      await generateWelcomeLetter({ form, agent, welcomeLetterData: welcomeData });
      toast.success('Welcome Letter downloaded');
      closeWelcomeModal();
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setWelcomeGenerating(false);
    }
  };

  return (
    <>
    {showWelcomeModal && createPortal(
      <div className={cn(
        'fixed inset-0 z-50 flex items-center justify-center transition-all duration-200',
        welcomeClosing ? 'opacity-0' : 'opacity-100',
      )}>
        <div
          className={cn('absolute inset-0 transition-all duration-200', welcomeClosing ? 'bg-transparent' : 'bg-black/40 backdrop-blur-sm')}
          onClick={closeWelcomeModal}
        />
        <div className={cn(
          'relative w-full max-w-md mx-4 bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200',
          welcomeClosing ? 'opacity-0 scale-95 translate-y-3' : 'opacity-100 scale-100 translate-y-0 animate-fade-in-up',
        )}>
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-amber-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Send className="w-4.5 h-4.5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Welcome Letter</h3>
                <p className="text-[11px] text-muted-foreground">Fill in the details below</p>
              </div>
            </div>
            <button onClick={closeWelcomeModal} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 hover:rotate-90">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">UIIA Pin Code</label>
              <input
                type="text"
                value={welcomeData.uiiaPinCode}
                onChange={(e) => setWelcomeData((d) => ({ ...d, uiiaPinCode: e.target.value }))}
                placeholder="Enter UIIA pin code"
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-border/60 bg-muted/30">
              <span className="text-sm font-medium text-foreground">Entered in EModal</span>
              <Toggle checked={welcomeData.enteredInEModal} onChange={(v) => setWelcomeData((d) => ({ ...d, enteredInEModal: v }))} />
            </div>

            <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-border/60 bg-muted/30">
              <span className="text-sm font-medium text-foreground">Dual SCAC</span>
              <Toggle checked={welcomeData.dualScac} onChange={(v) => setWelcomeData((d) => ({ ...d, dualScac: v }))} />
            </div>

            {welcomeData.dualScac && (
              <div className="grid grid-cols-2 gap-3 animate-fade-in-up">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">SCAC Code</label>
                  <input
                    type="text"
                    value={welcomeData.scacCode}
                    onChange={(e) => setWelcomeData((d) => ({ ...d, scacCode: e.target.value }))}
                    placeholder="Enter code"
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">SCAC Pin</label>
                  <input
                    type="text"
                    value={welcomeData.scacPin}
                    onChange={(e) => setWelcomeData((d) => ({ ...d, scacPin: e.target.value }))}
                    placeholder="Enter pin"
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
            <button
              onClick={closeWelcomeModal}
              className="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent h-9 px-4 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleWelcomeGenerate}
              disabled={welcomeGenerating}
              className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium text-white h-9 px-5 bg-[#2563EB] hover:bg-[#1D4ED8] shadow-sm hover:shadow-lg hover:shadow-primary/25 active:scale-95 transition-all duration-200 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {welcomeGenerating ? 'Generating...' : 'Generate PDF'}
            </button>
          </div>
        </div>
      </div>
    , document.body)}
    {showIrpModal && createPortal(
      <div className={cn(
        'fixed inset-0 z-50 flex items-center justify-center transition-all duration-200',
        irpClosing ? 'opacity-0' : 'opacity-100',
      )}>
        <div className={cn('absolute inset-0 transition-all duration-200', irpClosing ? 'bg-transparent' : 'bg-black/40 backdrop-blur-sm')} onClick={closeIrpModal} />
        <div className={cn(
          'relative w-full max-w-lg mx-4 bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200',
          irpClosing ? 'opacity-0 scale-95 translate-y-3' : 'opacity-100 scale-100 translate-y-0 animate-fade-in-up',
        )}>
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-indigo-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <FileSignature className="w-4.5 h-4.5 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">IRP Lease</h3>
                <p className="text-[11px] text-muted-foreground">Verify details before generating</p>
              </div>
            </div>
            <button onClick={closeIrpModal} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 hover:rotate-90">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[60vh] overflow-auto">
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Vendor Information</span>
              <div className="mt-2 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Business Name</label>
                  <input type="text" value={irpData.vendorName} onChange={(e) => setIrpData((d) => ({ ...d, vendorName: e.target.value }))} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Street Address</label>
                    <input type="text" value={irpData.vendorStreet} onChange={(e) => setIrpData((d) => ({ ...d, vendorStreet: e.target.value }))} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">City</label>
                    <input type="text" value={irpData.vendorCity} onChange={(e) => setIrpData((d) => ({ ...d, vendorCity: e.target.value }))} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">State</label>
                    <input type="text" value={irpData.vendorState} onChange={(e) => setIrpData((d) => ({ ...d, vendorState: e.target.value }))} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Zip Code</label>
                    <input type="text" value={irpData.vendorZip} onChange={(e) => setIrpData((d) => ({ ...d, vendorZip: e.target.value }))} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border/40 pt-4">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Truck Information</span>
              <div className="mt-2 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Truck Owner Name</label>
                  <input type="text" placeholder="Enter truck owner name" value={irpData.truckOwnerName} onChange={(e) => setIrpData((d) => ({ ...d, truckOwnerName: e.target.value }))} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Year</label>
                    <input type="text" value={irpData.year} onChange={(e) => setIrpData((d) => ({ ...d, year: e.target.value }))} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Make</label>
                    <input type="text" value={irpData.make} onChange={(e) => setIrpData((d) => ({ ...d, make: e.target.value }))} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">VIN</label>
                    <input type="text" value={irpData.vin} onChange={(e) => setIrpData((d) => ({ ...d, vin: e.target.value }))} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border/40 pt-4">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Lessee</span>
              <div className="mt-2 space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Lessee Name</label>
                <input type="text" placeholder="Enter lessee name" value={irpData.lesseeName} onChange={(e) => setIrpData((d) => ({ ...d, lesseeName: e.target.value }))} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
            <button onClick={closeIrpModal} className="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent h-9 px-4 transition-all duration-200">Cancel</button>
            <button onClick={handleIrpGenerate} disabled={irpGenerating} className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium text-white h-9 px-5 bg-[#2563EB] hover:bg-[#1D4ED8] shadow-sm hover:shadow-lg hover:shadow-primary/25 active:scale-95 transition-all duration-200 disabled:opacity-50">
              <Download className="w-3.5 h-3.5" />
              {irpGenerating ? 'Generating...' : 'Generate PDF'}
            </button>
          </div>
        </div>
      </div>
    , document.body)}
    {showTruckBoxModal && createPortal(
      <div className={cn('fixed inset-0 z-50 flex items-center justify-center transition-all duration-200', truckBoxClosing ? 'opacity-0' : 'opacity-100')}>
        <div className={cn('absolute inset-0 transition-all duration-200', truckBoxClosing ? 'bg-transparent' : 'bg-black/40 backdrop-blur-sm')} onClick={closeTruckBoxModal} />
        <div className={cn('relative w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200', truckBoxClosing ? 'opacity-0 scale-95 translate-y-3' : 'opacity-100 scale-100 translate-y-0 animate-fade-in-up')}>
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-orange-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center"><PackageOpen className="w-4.5 h-4.5 text-orange-500" /></div>
              <div><h3 className="text-sm font-bold text-foreground">Truck Box Forms</h3><p className="text-[11px] text-muted-foreground">Shipping details & box contents</p></div>
            </div>
            <button onClick={closeTruckBoxModal} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 hover:rotate-90"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-auto p-6 space-y-5">
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Shipping Details</span>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {tbField('terminal', 'Terminal')}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Sending To</label>
                  <CustomSelect options={[{ value: 'Terminal', label: 'Terminal' }, { value: 'Driver', label: 'Driver' }, { value: 'Vendor/Truck Owner', label: 'Vendor/Truck Owner' }]} value={truckBoxData.sendingTo} onChange={(v) => setTruckBoxData((d) => ({ ...d, sendingTo: v }))} placeholder="Select..." />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {tbField('receiverName', 'Receiver Name')}
                {tbField('receiverPhone', 'Phone')}
              </div>
            </div>
            <div className="border-t border-border/40 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Delivery Address</span>
                <label className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer text-xs font-medium transition-all duration-200', tbSameAddr ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/40 border-border text-muted-foreground')}>
                  <input type="checkbox" checked={tbSameAddr} onChange={(e) => handleTbSameAddr(e.target.checked)} className="accent-primary w-3.5 h-3.5" />
                  Same as driver address
                </label>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Street</label>
                  <input type="text" disabled={tbSameAddr} value={truckBoxData.street} onChange={(e) => setTruckBoxData((d) => ({ ...d, street: e.target.value }))} className={cn('w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20', tbSameAddr && 'opacity-50 cursor-not-allowed bg-muted')} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">City</label>
                  <input type="text" disabled={tbSameAddr} value={truckBoxData.city} onChange={(e) => setTruckBoxData((d) => ({ ...d, city: e.target.value }))} className={cn('w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20', tbSameAddr && 'opacity-50 cursor-not-allowed bg-muted')} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">State</label>
                  <CustomSelect options={US_STATES.map((s) => ({ value: s, label: s }))} value={truckBoxData.state} onChange={(v) => { if (!tbSameAddr) setTruckBoxData((d) => ({ ...d, state: v })); }} placeholder="State..." disabled={tbSameAddr} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Zip Code</label>
                  <input type="text" disabled={tbSameAddr} value={truckBoxData.zipCode} onChange={(e) => setTruckBoxData((d) => ({ ...d, zipCode: e.target.value }))} className={cn('w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20', tbSameAddr && 'opacity-50 cursor-not-allowed bg-muted')} />
                </div>
              </div>
            </div>
            <div className="border-t border-border/40 pt-4">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Delivery & Billing</span>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Delivery Type</label>
                  <CustomSelect options={[
                    { value: 'Priority Overnight (By 10:00 AM)', label: 'Priority Overnight (By 10:00 AM)' },
                    { value: 'Standard Overnight (By 9:00 PM)', label: 'Standard Overnight (By 9:00 PM)' },
                    { value: 'First Overnight (8:00 AM or 8:30 AM)', label: 'First Overnight (8:00/8:30 AM)' },
                    { value: '2 Day (By 4:30 PM)', label: '2 Day (By 4:30 PM)' },
                    { value: 'Express Saver (By 4:30 PM In 3 Business Days)', label: 'Express Saver (3 Business Days)' },
                    { value: 'Saturday', label: 'Saturday' },
                    { value: 'Ground', label: 'Ground' },
                  ]} value={truckBoxData.deliveryType} onChange={(v) => setTruckBoxData((d) => ({ ...d, deliveryType: v }))} placeholder="Select..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Billing</label>
                  <CustomSelect options={[
                    { value: 'ARL Transport LLC', label: 'ARL Transport LLC' },
                    { value: 'ARL Logistics', label: 'ARL Logistics' },
                    { value: 'Agent', label: 'Agent' },
                    { value: 'Deduct from vendor code', label: 'Deduct from vendor code' },
                    { value: 'First Out', label: 'First Out' },
                    { value: 'MIA', label: 'MIA' },
                    { value: 'Bill', label: 'Bill' },
                  ]} value={truckBoxData.billingInfo} onChange={(v) => setTruckBoxData((d) => ({ ...d, billingInfo: v }))} placeholder="Select..." />
                </div>
                {tbField('truckColor', 'Truck Color')}
              </div>
            </div>
            <div className="border-t border-border/40 pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Box Contents</span>
                <span className="text-[10px] font-medium text-primary">{Object.values(truckBoxData.boxItems).filter(Boolean).length} selected</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                {BOX_ITEM_LABELS.map(([key, label]) => {
                  const on = truckBoxData.boxItems[key];
                  const isDefault = defaultOnItems[key];
                  return (
                    <button key={key} type="button" onClick={() => setTruckBoxData((d) => ({ ...d, boxItems: { ...d.boxItems, [key]: !d.boxItems[key] } }))}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all duration-200 text-left min-h-[38px]',
                        on && isDefault && 'bg-primary/10 border-primary/30 text-primary shadow-sm shadow-primary/10 -translate-y-0.5',
                        on && !isDefault && 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-sm shadow-amber-500/10 -translate-y-0.5',
                        !on && 'bg-background border-border text-foreground hover:border-muted-foreground/30 hover:bg-muted/30 hover:shadow-sm hover:-translate-y-0.5',
                      )}
                    >
                      <div className={cn('w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all duration-200',
                        on && isDefault && 'bg-primary text-white',
                        on && !isDefault && 'bg-amber-500 text-white',
                        !on && 'border border-muted-foreground/30',
                      )}>
                        {on && <Check className="w-2.5 h-2.5" />}
                      </div>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-border/40 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Cable Type</label>
                <CustomSelect options={['6 Pin', '9 Pin', 'Volvo 13', 'Mack 13', 'OBD2'].map((v) => ({ value: v, label: v }))} value={truckBoxData.cableType} onChange={(v) => setTruckBoxData((d) => ({ ...d, cableType: v }))} placeholder="Select..." />
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
            <button onClick={closeTruckBoxModal} className="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent h-9 px-4 transition-all duration-200">Cancel</button>
            <button onClick={handleTruckBoxGenerate} className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium text-white h-9 px-5 bg-[#2563EB] hover:bg-[#1D4ED8] shadow-sm hover:shadow-lg hover:shadow-primary/25 active:scale-95 transition-all duration-200">
              <Download className="w-3.5 h-3.5" /> Generate PDF
            </button>
          </div>
        </div>
      </div>
    , document.body)}
    <div className="w-full max-w-[1100px] mx-auto space-y-4">
      <div className="flex flex-wrap items-center gap-2 animate-fade-in-up" style={{ animationDelay: '40ms' }}>
        <SummaryChip icon={User} label={`${form.firstName || ''} ${form.lastName || ''}`.trim() || '—'} />
        <SummaryChip icon={Building2} label={`Terminal ${agent?.cr6cd_terminal || '—'}`} />
        <SummaryChip icon={FileText} label={actionType === 'new' ? 'New Entry' : actionType === 'move' ? 'Move' : actionType || '—'} />
        <SummaryChip icon={Shield} label={contractType !== null ? (CONTRACT_MAP[contractType] || '—') : '—'} />
        {agent?.cr6cd_hazmatrequired && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
            Hazmat Terminal
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Driver Information" accent="sky" delay={80}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
            <CompactField label="Email" value={form.email} />
            <CompactField label="Phone" value={form.phone} />
            <CompactField label="SSN" value={form.ssn ? '***-**-****' : ''} />
            <CompactField label="Driver Code" value={form.driverCode} />
            <CompactField label="License #" value={form.licenseNumber} />
            <CompactField label="License State" value={form.licenseState} />
          </div>
        </SectionCard>

        <SectionCard title="Testing & Compliance" accent="amber" delay={120}>
          <div className="space-y-2.5">
            <StatusRow label="ELP Required">
              <YesNoPill value={elpRequired} />
            </StatusRow>
            <StatusRow label="Hazmat Endorsement">
              <TestBadge status={hazmatStatus} required={agent?.cr6cd_hazmatrequired ?? false} />
            </StatusRow>
            <StatusRow label="Homeland Security">
              <TestBadge status={homelandStatus} required={agent?.cr6cd_hazmatrequired ?? false} />
            </StatusRow>
          </div>
        </SectionCard>

        <SectionCard title="Transfers & Reactivation" accent="violet" delay={160}>
          <div className="space-y-3">
            <StatusRow label="Transfer Occ/Acc">
              <YesNoPill value={transferOccAcc} />
            </StatusRow>
            <div>
              <StatusRow label="Transfer Equipment">
                <YesNoPill value={transferEquipment} />
              </StatusRow>
              {transferEquipment && transferItemsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5 ml-1">
                  {transferItemsList.map((k) => (
                    <span key={k} className="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                      {TRANSFER_ITEM_LABELS[k]}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <StatusRow label="Reactivate Equipment">
                <YesNoPill value={reactivateEquipment} />
              </StatusRow>
              {reactivateEquipment && reactivateItemsList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5 ml-1">
                  {reactivateItemsList.map((k) => (
                    <span key={k} className="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20">
                      {TRANSFER_ITEM_LABELS[k]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard title={`Deductions · ${selectedDeductions.length} selected`} accent="blue" delay={200}>
          {selectedDeductions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">None selected</p>
          ) : (
            <div className="space-y-2.5">
              <div className="flex flex-wrap gap-1.5">
                {selectedDeductions.map((k) => (
                  <span key={k} className="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20">
                    {DEDUCTION_LABELS[k] || k}
                  </span>
                ))}
              </div>
              {(selectedDeductions.includes('pdi') || (selectedDeductions.includes('maintenance_fund') && maintenanceAmount)) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground border-t border-border/60 pt-2">
                  {selectedDeductions.includes('pdi') && (
                    <span>PDI: {formatCurrency(pdiMonthly)}/mo · {formatCurrency(pdiWeeklyDeposit)}/wk deposit</span>
                  )}
                  {selectedDeductions.includes('maintenance_fund') && maintenanceAmount && (
                    <span>Maintenance: {formatCurrency(parseFloat(maintenanceAmount))}/wk</span>
                  )}
                </div>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <div className="flex-1 h-px bg-border/60" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Documents</span>
        <div className="flex-1 h-px bg-border/60" />
      </div>

      <DocumentSections
        form={form}
        agent={agent}
        selections={selections}
        transferEquipment={transferEquipment}
        reactivateEquipment={reactivateEquipment}
        transferItems={transferItems}
        reactivateItems={reactivateItems}
        pdiMonthly={pdiMonthly}
        iftaNumber={iftaNumber}
        maintenanceAmount={maintenanceAmount}
        onOpenWelcomeModal={() => setShowWelcomeModal(true)}
        onOpenIrpModal={openIrpModal}
        onOpenTruckBoxModal={openTruckBoxModal}
      />

    </div>
    </>
  );
}

function SummaryChip({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg bg-muted/60 border border-border/60 px-3 py-1.5">
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  );
}

function SectionCard({ title, delay, children }: { title: string; accent?: string; delay: number; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden animate-fade-in-up shadow-sm hover:shadow-md transition-shadow duration-200" style={{ animationDelay: `${delay}ms` }}>
      <div className="px-4 py-2.5 border-b border-border/40 bg-muted/30">
        <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

function CompactField({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-1">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <p className="text-sm font-medium text-foreground leading-tight">{value || '—'}</p>
    </div>
  );
}

function StatusRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function YesNoPill({ value }: { value: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
      value ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-muted/60 text-muted-foreground border-border',
    )}>
      {value ? 'Yes' : 'No'}
    </span>
  );
}

function TestBadge({ status, required }: { status: TestStatus; required: boolean }) {
  const key = !required ? 'notRequired' : (!status ? 'notSent' : status);
  const cfg = STATUS_CONFIG[key];
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium', cfg.classes)}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

function DocumentCard({ name, icon: Icon, downloaded, onClick }: { name: string; icon: React.ElementType; downloaded: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-center gap-2 rounded-xl border p-4 pt-5 text-left',
        'transition-all duration-500 ease-out',
        downloaded
          ? 'border-emerald-500/30 bg-emerald-500/5 shadow-sm shadow-emerald-500/10'
          : 'border-border/80 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 active:scale-[0.97]',
      )}
    >
      <div className={cn(
        'absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500',
        downloaded
          ? 'bg-emerald-500 text-white scale-100 rotate-0'
          : 'bg-muted/60 text-muted-foreground scale-90 group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-100',
      )}>
        {downloaded ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3 h-3 transition-transform duration-300 group-hover:translate-y-0.5" />}
      </div>
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500',
        downloaded
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'text-primary group-hover:scale-110',
      )} style={!downloaded ? { backgroundColor: '#EEF2F7' } : undefined}>
        <Icon className="w-5 h-5" />
      </div>
      <span className={cn(
        'text-[11px] font-medium text-center leading-tight min-h-[2rem] flex items-center transition-colors duration-500',
        downloaded ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground',
      )}>{name}</span>
    </button>
  );
}

function CollapsibleSection({ title, count, defaultOpen, children }: { title: string; count: number; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  return (
    <div className="rounded-xl border border-border/80 bg-card overflow-hidden transition-all duration-200 hover:shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-5 py-3.5 flex items-center justify-between group"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span className="text-[10px] font-medium text-muted-foreground bg-muted/80 rounded-full px-2 py-0.5">{count}</span>
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
          <div className="px-5 pb-5 pt-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentSections({ form, agent, selections, transferEquipment, reactivateEquipment, transferItems, reactivateItems, pdiMonthly, iftaNumber, maintenanceAmount, onOpenWelcomeModal, onOpenIrpModal, onOpenTruckBoxModal }: {
  form: Record<string, string>;
  agent: Agent | null;
  selections: Record<string, boolean>;
  transferEquipment: boolean;
  reactivateEquipment: boolean;
  transferItems: Record<TransferItemKey, boolean>;
  reactivateItems: Record<TransferItemKey, boolean>;
  pdiMonthly: number;
  iftaNumber: string;
  maintenanceAmount: string;
  onOpenWelcomeModal: () => void;
  onOpenIrpModal: () => void;
  onOpenTruckBoxModal: () => void;
}) {
  const [downloaded, setDownloaded] = useState<Record<string, boolean>>({});

  const markDownloaded = (id: string) => {
    setDownloaded((s) => ({ ...s, [id]: true }));
  };

  const handleClick = async (docId: string) => {
    try {
      if (docId === 'agent_confirmation') {
        generateAgentConfirmation({ form, agent, selections, transferEquipment, reactivateEquipment, transferItems, reactivateItems, pdiMonthly, iftaNumber });
        markDownloaded(docId);
        toast.success('Agent Confirmation downloaded');
      } else if (docId === 'fleet_commitment') {
        generateFleetCommitment({ form, agent });
        markDownloaded(docId);
        toast.success('Fleet Commitment downloaded');
      } else if (docId === 'road_test_ibe') {
        generateRoadTest({ form, agent });
        markDownloaded(docId);
        toast.success('Road Test downloaded');
      } else if (docId === 'welcome_letter') {
        onOpenWelcomeModal();
      } else if (docId === 'lease_agreement') {
        toast.info('Lease Agreement will be connected via Power Automate.');
      } else if (docId === 'deductions_checklist') {
        await generateRecruitingChecklist({ form, agent, selections, transferItems, reactivateItems, pdiMonthly, iftaNumber, maintenanceAmount });
        markDownloaded(docId);
        toast.success('Deductions Checklist downloaded');
      } else if (docId === 'irp_lease') {
        onOpenIrpModal();
      } else if (docId === 'truck_box') {
        onOpenTruckBoxModal();
      }
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '260ms' }}>
      <div className="flex items-center gap-3 px-1">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Download className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Generate Documents</h4>
          <p className="text-[11px] text-muted-foreground">Download driver onboarding documents</p>
        </div>
      </div>

      <CollapsibleSection title="Start-up Documents" count={STARTUP_DOCUMENTS.length} defaultOpen>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {STARTUP_DOCUMENTS.map((doc) => (
            <DocumentCard
              key={doc.id}
              name={doc.name}
              icon={doc.icon}
              downloaded={!!downloaded[doc.id]}
              onClick={() => handleClick(doc.id)}
            />
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Recruiting" count={RECRUITING_DOCUMENTS.length}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {RECRUITING_DOCUMENTS.map((doc) => (
            <DocumentCard
              key={doc.id}
              name={doc.name}
              icon={doc.icon}
              downloaded={!!downloaded[doc.id]}
              onClick={() => handleClick(doc.id)}
            />
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Equipment" count={EQUIPMENT_DOCUMENTS.length}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {EQUIPMENT_DOCUMENTS.map((doc) => (
            <DocumentCard
              key={doc.id}
              name={doc.name}
              icon={doc.icon}
              downloaded={!!downloaded[doc.id]}
              onClick={() => handleClick(doc.id)}
            />
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
