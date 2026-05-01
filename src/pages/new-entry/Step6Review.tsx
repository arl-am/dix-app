import { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, Building2, FileText, Shield, Star, Minus, Clock, Mail, CheckCircle, XCircle, Download, FileSignature, BadgeCheck, Truck, ClipboardList, Send, X, ChevronDown, Check, ListChecks, FileSpreadsheet, PackageOpen, TrainFront, CreditCard, Anchor } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { CONTRACT_TYPE_LABELS, US_STATES, type Agent } from '../../lib/mockData';
import { generateAgentConfirmation } from '../../lib/generateAgentConfirmation';
import { generateFleetCommitment } from '../../lib/generateFleetCommitment';
import { generateRoadTest } from '../../lib/generateRoadTest';
import { generateWelcomeLetter, type WelcomeLetterData } from '../../lib/generateWelcomeLetter';
import { generateRecruitingChecklist } from '../../lib/generateRecruitingChecklist';
import { generateIrpLease, type IrpLeaseModalData } from '../../lib/generateIrpLease';
import { generateTruckBoxForms, type TruckBoxFormData, type BoxItems } from '../../lib/generateTruckBox';
import { generateCNRegistration } from '../../lib/generateCNRegistration';
import { generateCPLetter } from '../../lib/generateCPLetter';
import { generateSeaLinkEntry } from '../../lib/generateSeaLinkEntry';
import CustomSelect from '../../components/CustomSelect';
import Toggle from '../../components/Toggle';
import { useTheme } from '../../hooks/useTheme';
import { usePresenceContext } from '../../hooks/usePresence';
import { toast } from 'sonner';
import mondayLogo from '../../assets/monday-logo.png';
import frontLogo from '../../assets/front-logo.png';
import { assetUrl } from '../../utils/assetUrl';
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
  elpStatus: TestStatus;
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
  driverId?: string;
  startDate: string;
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

const PORTS_RAILS_DOCUMENTS = [
  { id: 'fastpass_id', name: 'FastPass ID', icon: CreditCard },
  { id: 'sealink_entry', name: 'SeaLink Entry', icon: Anchor },
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
  elpRequired, elpStatus, hazmatStatus, homelandStatus,
  transferOccAcc, transferEquipment, reactivateEquipment, transferItems, reactivateItems,
  pdiMonthly, pdiWeeklyDeposit, maintenanceAmount, iftaNumber, driverId, startDate,
}: Step6Props) {
  const { currentUser } = usePresenceContext();
  const currentUserName = currentUser?.userName || '';
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

  const [showFastPassModal, setShowFastPassModal] = useState(false);
  const [fastPassClosing, setFastPassClosing] = useState(false);
  const [fastPassGenerating, setFastPassGenerating] = useState(false);
  const [fastPassData, setFastPassData] = useState({ driverName: '', licenseNumber: '', licenseState: '', licenseExpDate: '' });

  const openFastPassModal = () => {
    setFastPassData({
      driverName: `${form.firstName || ''} ${form.lastName || ''}`.trim(),
      licenseNumber: form.licenseNumber || '',
      licenseState: form.licenseState || '',
      licenseExpDate: form.licenseExpDate || '',
    });
    setShowFastPassModal(true);
  };

  const closeFastPassModal = () => {
    setFastPassClosing(true);
    setTimeout(() => { setShowFastPassModal(false); setFastPassClosing(false); }, 200);
  };

  const handleFastPassGenerate = async () => {
    if (!fastPassData.driverName.trim()) { toast.error('Driver Name is required'); return; }
    if (!fastPassData.licenseNumber.trim()) { toast.error('License Number is required'); return; }
    if (!fastPassData.licenseState.trim()) { toast.error('License State is required'); return; }
    if (!fastPassData.licenseExpDate.trim()) { toast.error('License Expiration Date is required'); return; }
    if (!driverId) { toast.error('Driver record not saved yet'); return; }
    setFastPassGenerating(true);
    const toastId = toast.loading('Sending FastPass ID email...');
    try {
      const isLocal = window.location.hostname === 'localhost';
      if (isLocal) {
        await new Promise((r) => setTimeout(r, 3000));
      } else {
        const { Cr6cd_dix_driversService } = await import('../../generated');
        await Cr6cd_dix_driversService.update(driverId, {
          cr6cd_fastpassrequested: true,
        } as any);
        const POLL_INTERVAL = 3000;
        const TIMEOUT = 45000;
        const start = Date.now();
        let completed = false;
        while (Date.now() - start < TIMEOUT) {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL));
          const record = await Cr6cd_dix_driversService.get(driverId, {
            select: ['cr6cd_fastpassrequested'],
          });
          if (record.success && !(record.data as any)?.cr6cd_fastpassrequested) {
            completed = true;
            break;
          }
        }
        if (!completed) {
          toast.warning('FastPass ID is taking longer than expected. Check Power Automate for status.', { id: toastId });
          setFastPassGenerating(false);
          return;
        }
      }
      toast.success('FastPass ID email draft created', { id: toastId });
      closeFastPassModal();
    } catch (err) {
      toast.error(`FastPass ID failed: ${err instanceof Error ? err.message : 'Unknown error'}`, { id: toastId });
    } finally {
      setFastPassGenerating(false);
    }
  };

  const [showTruckBoxModal, setShowTruckBoxModal] = useState(false);
  const [truckBoxClosing, setTruckBoxClosing] = useState(false);
  const [tbSameAddr, setTbSameAddr] = useState(false);
  const defaultOnItems: BoxItems = { bols: true, logBook: true, insuranceCard: true, greenRegulationBook: true, zipTies: true, doorStrap: true, doorSigns: true, iftaStickers: true, fuelCard: false, rfidTag: false, prePass: false, hazmatBooks: false, eld: false, dashCam: false, mdLiquor: false };
  const [truckBoxData, setTruckBoxData] = useState<TruckBoxFormData>({
    terminal: '', date: new Date().toISOString().split('T')[0], sendingTo: '', receiverName: '',
    street: '', city: '', state: '', zipCode: '', receiverPhone: '', sentBy: '',
    deliveryType: 'Priority Overnight (By 10:00 AM)', billingInfo: 'ARL Transport LLC', unitNumber: '', boxItems: { ...defaultOnItems },
    truckColor: '', motorCarrierName: '', cableType: '', recruiterName: '',
  });

  const openTruckBoxModal = () => {
    setTbSameAddr(false);
    setTruckBoxData((d) => ({
      ...d,
      terminal: agent?.cr6cd_terminal || '',
      unitNumber: form.unitNumber || '',
      truckColor: form.color || '',
      motorCarrierName: agent?.cr6cd_company || agent?.cr6cd_motorcarrier || '',
      receiverName: `${form.firstName || ''} ${form.lastName || ''}`.trim(),
      sentBy: currentUserName,
      recruiterName: currentUserName,
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
    {showFastPassModal && createPortal(
      <div className={cn(
        'fixed inset-0 z-50 flex items-center justify-center transition-all duration-200',
        fastPassClosing ? 'opacity-0' : 'opacity-100',
      )}>
        <div
          className={cn('absolute inset-0 transition-all duration-200', fastPassClosing ? 'bg-transparent' : 'bg-black/40 backdrop-blur-sm')}
          onClick={!fastPassGenerating ? closeFastPassModal : undefined}
        />
        <div className={cn(
          'relative w-full max-w-md mx-4 bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200',
          fastPassClosing ? 'opacity-0 scale-95 translate-y-3' : 'opacity-100 scale-100 translate-y-0 animate-fade-in-up',
        )}>
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-sky-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center">
                <CreditCard className="w-4.5 h-4.5 text-sky-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">FastPass ID</h3>
                <p className="text-[11px] text-muted-foreground">Verify driver info before sending</p>
              </div>
            </div>
            <button onClick={closeFastPassModal} disabled={fastPassGenerating} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 hover:rotate-90 disabled:opacity-50">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Driver Name <span className="text-destructive">*</span></label>
              <input
                type="text"
                value={fastPassData.driverName}
                onChange={(e) => setFastPassData((d) => ({ ...d, driverName: e.target.value }))}
                placeholder="Enter driver name"
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">License Number <span className="text-destructive">*</span></label>
              <input
                type="text"
                value={fastPassData.licenseNumber}
                onChange={(e) => setFastPassData((d) => ({ ...d, licenseNumber: e.target.value }))}
                placeholder="Enter license number"
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">License State <span className="text-destructive">*</span></label>
                <CustomSelect
                  options={US_STATES.map((s) => ({ value: s, label: s }))}
                  value={fastPassData.licenseState}
                  onChange={(v) => setFastPassData((d) => ({ ...d, licenseState: v }))}
                  placeholder="Select state..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">License Exp Date <span className="text-destructive">*</span></label>
                <input
                  type="date"
                  value={fastPassData.licenseExpDate}
                  onChange={(e) => setFastPassData((d) => ({ ...d, licenseExpDate: e.target.value }))}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
            <button
              onClick={closeFastPassModal}
              disabled={fastPassGenerating}
              className="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent h-9 px-4 transition-all duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleFastPassGenerate}
              disabled={fastPassGenerating}
              className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium text-white h-9 px-5 bg-[#2563EB] hover:bg-[#1D4ED8] shadow-sm hover:shadow-lg hover:shadow-primary/25 active:scale-95 transition-all duration-200 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {fastPassGenerating ? 'Sending...' : 'Generate Email'}
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
            <StatusRow label="English Proficiency (ELP)">
              <TestBadge status={elpStatus} required={elpRequired} />
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
        actionType={actionType}
        contractType={contractType}
        selections={selections}
        transferEquipment={transferEquipment}
        reactivateEquipment={reactivateEquipment}
        transferItems={transferItems}
        reactivateItems={reactivateItems}
        pdiMonthly={pdiMonthly}
        iftaNumber={iftaNumber}
        maintenanceAmount={maintenanceAmount}
        driverId={driverId}
        startDate={startDate}
        onOpenWelcomeModal={() => setShowWelcomeModal(true)}
        onOpenIrpModal={openIrpModal}
        onOpenTruckBoxModal={openTruckBoxModal}
        onOpenFastPassModal={openFastPassModal}
        cableType={truckBoxData.cableType}
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

function DocumentCard({ name, icon: Icon, downloaded, loading, loadingLabel, actionIcon, onClick }: { name: string; icon: React.ElementType; downloaded: boolean; loading?: boolean; loadingLabel?: string; actionIcon?: 'download' | 'send'; onClick: () => void }) {
  const { theme } = useTheme();
  const iconBg = theme === 'dark' ? 'rgba(255,255,255,0.08)' : '#EEF2F7';
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
        loading
          ? 'bg-primary/20 text-primary'
          : downloaded
            ? 'bg-emerald-500 text-white scale-100 rotate-0'
            : 'bg-muted/60 text-muted-foreground scale-90 group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-100',
      )}>
        {loading ? (
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : downloaded ? (
          <Check className="w-3.5 h-3.5" />
        ) : actionIcon === 'send' ? (
          <Send className="w-3 h-3 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        ) : (
          <Download className="w-3 h-3 transition-transform duration-300 group-hover:translate-y-0.5" />
        )}
      </div>
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500',
        loading
          ? 'bg-primary/10 text-primary animate-pulse'
          : downloaded
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'text-primary group-hover:scale-110',
      )} style={!downloaded && !loading ? { backgroundColor: iconBg } : undefined}>
        <Icon className="w-5 h-5" />
      </div>
      <span className={cn(
        'text-xs font-medium text-center leading-tight min-h-[2rem] flex items-center transition-colors duration-500',
        loading ? 'text-primary' : downloaded ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground',
      )}>{loading ? (loadingLabel || 'Sending...') : name}</span>
    </button>
  );
}

function CollapsibleSection({ title, count, defaultOpen, children }: { title: string; count: number; defaultOpen?: boolean; children: React.ReactNode }) {
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
          <div className="px-5 pb-5 pt-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentSections({ form, agent, actionType, contractType, selections, transferEquipment, reactivateEquipment, transferItems, reactivateItems, pdiMonthly, iftaNumber, maintenanceAmount, driverId, startDate, onOpenWelcomeModal, onOpenIrpModal, onOpenTruckBoxModal, onOpenFastPassModal, cableType }: {
  form: Record<string, string>;
  agent: Agent | null;
  actionType: string;
  contractType: number | null;
  selections: Record<string, boolean>;
  transferEquipment: boolean;
  reactivateEquipment: boolean;
  transferItems: Record<TransferItemKey, boolean>;
  reactivateItems: Record<TransferItemKey, boolean>;
  pdiMonthly: number;
  iftaNumber: string;
  maintenanceAmount: string;
  driverId?: string;
  startDate: string;
  onOpenWelcomeModal: () => void;
  onOpenIrpModal: () => void;
  onOpenTruckBoxModal: () => void;
  onOpenFastPassModal: () => void;
  cableType: string;
}) {
  const { currentUser } = usePresenceContext();
  const currentUserName = currentUser?.userName || '';
  const [downloaded, setDownloaded] = useState<Record<string, boolean>>({});
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);

  const markDownloaded = (id: string) => {
    setDownloaded((s) => ({ ...s, [id]: true }));
  };

  const handleClick = async (docId: string) => {
    try {
      if (docId === 'agent_confirmation') {
        generateAgentConfirmation({ form, agent, selections, transferEquipment, reactivateEquipment, transferItems, reactivateItems, pdiMonthly, iftaNumber, onboardingDate: startDate });
        markDownloaded(docId);
        toast.success('Agent Confirmation downloaded');
      } else if (docId === 'fleet_commitment') {
        generateFleetCommitment({ form, agent, onboardingDate: startDate });
        markDownloaded(docId);
        toast.success('Fleet Commitment downloaded');
      } else if (docId === 'road_test_ibe') {
        generateRoadTest({ form, agent, onboardingDate: startDate });
        markDownloaded(docId);
        toast.success('Road Test downloaded');
      } else if (docId === 'welcome_letter') {
        onOpenWelcomeModal();
      } else if (docId === 'lease_agreement') {
        if (!driverId) {
          toast.error('Driver record not saved yet');
          return;
        }
        setLoadingDoc('lease_agreement');
        const toastId = toast.loading('Generating Lease Agreement...');
        try {
          const isLocal = window.location.hostname === 'localhost';
          if (isLocal) {
            await new Promise((r) => setTimeout(r, 3000));
            window.open('about:blank', '_blank');
          } else {
            const { Cr6cd_dix_driversService } = await import('../../generated');
            await Cr6cd_dix_driversService.update(driverId, {
              cr6cd_leaseagreementrequested: true,
            } as any);
            const POLL_INTERVAL = 1500;
            const TIMEOUT = 45000;
            const start = Date.now();
            let completed = false;
            while (Date.now() - start < TIMEOUT) {
              const record = await Cr6cd_dix_driversService.get(driverId, {
                select: ['cr6cd_leaseagreementrequested', 'cr6cd_leaseagreementpdf'],
              });
              if (record.success && !(record.data as any)?.cr6cd_leaseagreementrequested) {
                completed = true;
                const base64 = (record.data as any)?.cr6cd_leaseagreementpdf;
                if (base64) {
                  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
                  const blob = new Blob([bytes], { type: 'application/pdf' });
                  const blobUrl = URL.createObjectURL(blob);
                  const driverName = `${form.firstName || ''} ${form.lastName || ''}`.trim() || 'Driver';
                  const fileName = `${driverName}_Lease_Agreement.pdf`.replace(/\s+/g, '_');
                  const a = document.createElement('a');
                  a.href = blobUrl;
                  a.download = fileName;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(blobUrl);
                  Cr6cd_dix_driversService.update(driverId, { cr6cd_leaseagreementpdf: null } as any).catch(() => {});
                }
                break;
              }
              await new Promise((r) => setTimeout(r, POLL_INTERVAL));
            }
            if (!completed) {
              toast.warning('Lease Agreement is taking longer than expected. Check Power Automate for status.', { id: toastId });
              setLoadingDoc(null);
              return;
            }
          }
          markDownloaded(docId);
          toast.success('Lease Agreement generated', { id: toastId });
        } catch (err) {
          toast.error(`Lease Agreement failed: ${err instanceof Error ? err.message : 'Unknown error'}`, { id: toastId });
          setLoadingDoc(null);
          throw err;
        }
        setLoadingDoc(null);
        return;
      } else if (docId === 'deductions_checklist') {
        await generateRecruitingChecklist({ form, agent, selections, transferItems, reactivateItems, pdiMonthly, iftaNumber, maintenanceAmount });
        markDownloaded(docId);
        toast.success('Deductions Checklist downloaded');
      } else if (docId === 'irp_lease') {
        onOpenIrpModal();
      } else if (docId === 'truck_box') {
        onOpenTruckBoxModal();
      } else if (docId === 'cn_registration') {
        await generateCNRegistration({
          date: new Date().toLocaleDateString('en-US'),
          driverName: `${form.firstName || ''} ${form.lastName || ''}`.trim(),
          division: agent?.cr6cd_divisionformal || agent?.cr6cd_division || '',
          scac: agent?.cr6cd_scac || '',
          cnDivision: agent?.cr6cd_division || '',
        });
        markDownloaded(docId);
        toast.success('CP Registration downloaded');
      } else if (docId === 'cp_letter') {
        await generateCPLetter({
          date: new Date().toLocaleDateString('en-US'),
          driverName: `${form.firstName || ''} ${form.lastName || ''}`.trim(),
          licenseNumber: form.licenseNumber || '',
          cdlState: form.licenseState || '',
          startDate: form.onboardingDate || new Date().toLocaleDateString('en-US'),
          division: agent?.cr6cd_divisionformal || agent?.cr6cd_division || '',
          scac: agent?.cr6cd_scac || '',
          sentBy: currentUserName,
        });
        markDownloaded(docId);
        toast.success('CN Registration downloaded');
      } else if (docId === 'cp_registration') {
        if (!driverId) {
          toast.error('Driver record not saved yet');
          return;
        }
        setLoadingDoc('cp_registration');
        const toastId = toast.loading('Sending CN Registration email...');
        try {
          const isLocal = window.location.hostname === 'localhost';
          if (isLocal) {
            await new Promise((r) => setTimeout(r, 3000));
          } else {
            const { Cr6cd_dix_driversService } = await import('../../generated');
            await Cr6cd_dix_driversService.update(driverId, {
              cr6cd_cpregistrationrequested: true,
            } as any);
            const POLL_INTERVAL = 3000;
            const TIMEOUT = 45000;
            const start = Date.now();
            let completed = false;
            while (Date.now() - start < TIMEOUT) {
              await new Promise((r) => setTimeout(r, POLL_INTERVAL));
              const record = await Cr6cd_dix_driversService.get(driverId, {
                select: ['cr6cd_cpregistrationrequested'],
              });
              if (record.success && !(record.data as any)?.cr6cd_cpregistrationrequested) {
                completed = true;
                break;
              }
            }
            if (!completed) {
              toast.warning('CN Registration is taking longer than expected. Check Power Automate for status.', { id: toastId });
              setLoadingDoc(null);
              return;
            }
          }
          markDownloaded(docId);
          toast.success('CN Registration email draft created', { id: toastId });
        } catch (err) {
          toast.error(`CN Registration failed: ${err instanceof Error ? err.message : 'Unknown error'}`, { id: toastId });
          setLoadingDoc(null);
          throw err;
        }
        setLoadingDoc(null);
        return;
      } else if (docId === 'fastpass_id') {
        onOpenFastPassModal();
      } else if (docId === 'addmove_board') {
        const fmt = (v: number | undefined) => v != null ? `$${Number(v).toFixed(2)}` : '';
        const deductions: string[] = [];
        if (selections.bobtail && agent?.cr6cd_bobtailvalue)
          deductions.push(`Bobtail (${fmt(agent.cr6cd_bobtailvalue)})/Month`);
        if (selections.pdi)
          deductions.push('Physical Damage Insurance & PDI Deposit');
        if (selections.occacc && agent?.cr6cd_occaccmonthly)
          deductions.push(`Occupational Accident (${fmt(agent.cr6cd_occaccmonthly)})/Month`);
        if (selections.ifta && agent?.cr6cd_iftavalue)
          deductions.push(`Road and Fuel (${fmt(agent.cr6cd_iftavalue)})/Week`);
        if (selections.irp_plate_prepaid)
          deductions.push('License Plate (Paid in Full)');
        if (selections.irp_plate_settlements) {
          deductions.push(`License Plate (${fmt(agent?.cr6cd_plateweeklyvalue)})/Week`);
          deductions.push(`Plate Deposit (${fmt(agent?.cr6cd_platedepositvalue)})/Week`);
        }
        if (selections.security_deposit)
          deductions.push(`Security Deposit (${fmt(agent?.cr6cd_securitydepositweeklyvalue)})/Week`);
        if (selections.eld_deposit && agent?.cr6cd_elddepositvalue)
          deductions.push(`ELD Deposit (${fmt(agent.cr6cd_elddepositvalue)})/Week`);
        if (selections.eld_deposit && agent?.cr6cd_elddatafeevalue)
          deductions.push(`ELD Data Fee (${fmt(agent.cr6cd_elddatafeevalue)})/Week`);
        if (selections.dashcam_deposit)
          deductions.push(`Dashcam Deposit (${fmt(agent?.cr6cd_dashcamdepositvalue)})/Week`);
        if (selections.buydown)
          deductions.push(`Buydown (${fmt(agent?.cr6cd_buydownvalue)})/Week`);
        if (selections.prepass_tolls_bypass)
          deductions.push(`Prepass Tolls & Bypass (${fmt(agent?.cr6cd_prepasstollsbypass)})`);
        if (selections.prepass_bypass)
          deductions.push(`Prepass Bypass (${fmt(agent?.cr6cd_prepassbypass)})`);
        if (selections.maintenance_fund)
          deductions.push('Maintenance Fund');
        if (selections.rfid && agent?.cr6cd_rfidvalue)
          deductions.push(`RFID (${fmt(agent.cr6cd_rfidvalue)})`);
        if (selections.chassis_usage && agent?.cr6cd_trailerusagevalue) {
          deductions.push(`Chassis Usage Value (${fmt(agent.cr6cd_trailerusagevalue)})`);
          if (agent?.cr6cd_trailerusageadminfee)
            deductions.push(`Chassis Usage Admin Fee (${fmt(agent.cr6cd_trailerusageadminfee)})`);
        }
        if (selections.irp_plate_settlements && agent?.cr6cd_plateadminfee)
          deductions.push(`Plate Admin Fee (${fmt(agent.cr6cd_plateadminfee)})`);

        const deductionsStr = deductions.length > 0
          ? '[' + deductions.map((d) => '"' + d + '"').join(', ') + ']'
          : '["N/A"]';

        const actionLabel = actionType === 'new' ? 'Add' : actionType === 'move' ? 'Move' : actionType || '';
        const contractLabel = contractType != null ? (CONTRACT_TYPE_LABELS[contractType] || '') : '';

        const mc = agent?.cr6cd_motorcarrier || '';
        const motorCarrier = mc === 'ARL' ? 'ARL' : mc === 'ACT' ? 'ACT' : mc === 'Partners' ? 'Partners EXP' : mc;

        const equipReq = transferEquipment
          ? 'Equipment Transfer'
          : (selections.eld_deposit && selections.dashcam_deposit)
            ? 'ELD / CAM'
            : selections.eld_deposit
              ? 'ELD Only (Executive Exception)'
              : 'N/A';

        const plate = selections.irp_plate_settlements ? 'Yes' : 'No';
        const prepass = (selections.prepass_tolls_bypass || selections.prepass_bypass) ? 'Yes' : 'No';

        const cableMap: Record<string, string> = { '6 Pin': '6', '9 Pin': '9', 'Volvo 13': 'VOLVO 2013-2018', 'Mack 13': 'MACK 2013-2018', 'OBD2': 'OBD II' };
        const cableVal = cableMap[cableType || ''] || '';

        const driverName = `${form.firstName || ''} ${form.lastName || ''}`.trim();
        const url = 'https://forms.monday.com/forms/f442fdd3e4f696b3cc62fdfc08d16f48'
          + '?DriverName=' + encodeURIComponent(driverName)
          + '&DriverPhone=' + encodeURIComponent(form.phone || '')
          + '&VendorCode=' + encodeURIComponent(form.vendorCode || '')
          + '&Terminal=' + encodeURIComponent(agent?.cr6cd_terminal || '')
          + '&ActionType=' + encodeURIComponent(actionLabel)
          + '&AddType=' + encodeURIComponent(contractLabel)
          + '&UnitNumber=' + encodeURIComponent(form.unitNumber || '')
          + '&Plate=' + encodeURIComponent(plate)
          + '&PrePass=' + encodeURIComponent(prepass)
          + '&MotorCarrier=' + encodeURIComponent(motorCarrier)
          + '&CableType=' + encodeURIComponent(cableVal)
          + '&Username=' + encodeURIComponent(form.driverCode || '')
          + '&EquipmentRequested=' + encodeURIComponent(equipReq)
          + '&Deductions=' + encodeURIComponent(deductionsStr);

        window.open(url, '_blank');
        markDownloaded(docId);
      } else if (docId === 'addmove_email') {
        if (!driverId) {
          toast.error('Driver record not saved yet');
          return;
        }
        setLoadingDoc('addmove_email');
        const toastId = toast.loading('Sending Add/Move email...');
        try {
          const isLocal = window.location.hostname === 'localhost';
          if (isLocal) {
            await new Promise((r) => setTimeout(r, 3000));
          } else {
            const { Cr6cd_dix_driversService } = await import('../../generated');
            await Cr6cd_dix_driversService.update(driverId, {
              cr6cd_addmoverequested: true,
            } as any);
            const POLL_INTERVAL = 3000;
            const TIMEOUT = 45000;
            const start = Date.now();
            let completed = false;
            while (Date.now() - start < TIMEOUT) {
              await new Promise((r) => setTimeout(r, POLL_INTERVAL));
              const record = await Cr6cd_dix_driversService.get(driverId, {
                select: ['cr6cd_addmoverequested'],
              });
              if (record.success && !(record.data as any)?.cr6cd_addmoverequested) {
                completed = true;
                break;
              }
            }
            if (!completed) {
              toast.warning('Add/Move email is taking longer than expected. Check Power Automate for status.', { id: toastId });
              setLoadingDoc(null);
              return;
            }
          }
          markDownloaded(docId);
          toast.success('Add/Move email draft created', { id: toastId });
        } catch (err) {
          toast.error(`Add/Move email failed: ${err instanceof Error ? err.message : 'Unknown error'}`, { id: toastId });
          setLoadingDoc(null);
          throw err;
        }
        setLoadingDoc(null);
        return;
      } else if (docId === 'sealink_entry') {
        await generateSeaLinkEntry({
          firstName: form.firstName || '',
          lastName: form.lastName || '',
          licenseNumber: form.licenseNumber || '',
          licenseState: form.licenseState || '',
          licenseExpDate: form.licenseExpDate || '',
          phoneNumber: form.phoneNumber || '',
          email: form.email || '',
          division: agent?.cr6cd_divisionformal || agent?.cr6cd_division || '',
          scac: agent?.cr6cd_scac || '',
          startDate: form.onboardingDate || new Date().toLocaleDateString('en-US'),
        });
        markDownloaded(docId);
        toast.success('SeaLink Entry Form downloaded');
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

      <CollapsibleSection title="Start-up Documents" count={STARTUP_DOCUMENTS.length}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {STARTUP_DOCUMENTS.map((doc) => (
            <DocumentCard
              key={doc.id}
              name={doc.name}
              icon={doc.icon}
              downloaded={!!downloaded[doc.id]}
              loading={loadingDoc === doc.id}
              loadingLabel={doc.id === 'lease_agreement' ? 'Creating...' : undefined}
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

      <CollapsibleSection title="Ports & Rails" count={PORTS_RAILS_DOCUMENTS.length + 2}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className={cn(
            'relative flex flex-col items-center gap-2 rounded-xl border p-4 pt-5',
            'transition-all duration-500 ease-out',
            downloaded['cp_letter'] && downloaded['cp_registration']
              ? 'border-emerald-500/30 bg-emerald-500/5 shadow-sm shadow-emerald-500/10'
              : 'border-border/80 bg-card',
          )}>
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500',
              downloaded['cp_letter'] && downloaded['cp_registration']
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'text-primary',
            )} style={!(downloaded['cp_letter'] && downloaded['cp_registration']) ? { backgroundColor: '#EEF2F7' } : undefined}>
              <TrainFront className="w-5 h-5" />
            </div>
            <span className={cn(
              'text-xs font-medium text-center leading-tight',
              downloaded['cp_letter'] && downloaded['cp_registration'] ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground',
            )}>CN Registration</span>
            <div className="flex gap-1.5 w-full mt-0.5">
              <button
                onClick={() => handleClick('cp_letter')}
                disabled={loadingDoc === 'cp_letter'}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all duration-200',
                  downloaded['cp_letter']
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : 'bg-muted/60 text-muted-foreground border border-border/60 hover:bg-primary/10 hover:text-primary hover:border-primary/20',
                )}
              >
                {downloaded['cp_letter'] ? <Check className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                PDF
              </button>
              <button
                onClick={() => handleClick('cp_registration')}
                disabled={loadingDoc === 'cp_registration'}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-all duration-200',
                  loadingDoc === 'cp_registration'
                    ? 'bg-primary/10 text-primary border border-primary/20 cursor-wait'
                    : downloaded['cp_registration']
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-muted/60 text-muted-foreground border border-border/60 hover:bg-primary/10 hover:text-primary hover:border-primary/20',
                )}
              >
                {loadingDoc === 'cp_registration' ? (
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : downloaded['cp_registration'] ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                Email
              </button>
            </div>
          </div>

          <DocumentCard
            name="CP Registration"
            icon={TrainFront}
            downloaded={!!downloaded['cn_registration']}
            loading={loadingDoc === 'cn_registration'}
            onClick={() => handleClick('cn_registration')}
          />

          {PORTS_RAILS_DOCUMENTS.map((doc) => (
            <DocumentCard
              key={doc.id}
              name={doc.name}
              icon={doc.icon}
              downloaded={!!downloaded[doc.id]}
              loading={loadingDoc === doc.id}
              onClick={() => handleClick(doc.id)}
            />
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Orientation" count={2}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => handleClick('addmove_board')}
            className={cn(
              'relative flex flex-col items-center gap-2 rounded-xl border p-4 pt-5 text-left',
              'transition-all duration-200 ease-out group',
              downloaded['addmove_board']
                ? 'border-emerald-500/30 bg-emerald-500/5 shadow-sm shadow-emerald-500/10'
                : 'border-border/80 bg-card hover:border-primary/30 hover:bg-primary/[0.02] hover:shadow-md active:scale-[0.97]',
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 overflow-hidden',
              downloaded['addmove_board']
                ? 'bg-emerald-500/10'
                : 'bg-[#EEF2F7] group-hover:scale-110',
            )}>
              <img src={assetUrl(mondayLogo)} alt="Monday" className="w-6 h-6 object-contain" />
            </div>
            <span className={cn(
              'text-xs font-medium text-center leading-tight',
              downloaded['addmove_board'] ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground',
            )}>Add/Move Board</span>
          </button>
          <button
            onClick={() => handleClick('addmove_email')}
            disabled={loadingDoc === 'addmove_email'}
            className={cn(
              'relative flex flex-col items-center gap-2 rounded-xl border p-4 pt-5 text-left',
              'transition-all duration-200 ease-out group',
              loadingDoc === 'addmove_email'
                ? 'border-primary/30 bg-primary/5 cursor-wait'
                : downloaded['addmove_email']
                  ? 'border-emerald-500/30 bg-emerald-500/5 shadow-sm shadow-emerald-500/10'
                  : 'border-border/80 bg-card hover:border-primary/30 hover:bg-primary/[0.02] hover:shadow-md active:scale-[0.97]',
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 overflow-hidden',
              loadingDoc === 'addmove_email'
                ? 'bg-primary/10 animate-pulse'
                : downloaded['addmove_email']
                  ? 'bg-emerald-500/10'
                  : 'bg-[#EEF2F7] group-hover:scale-110',
            )}>
              <img src={assetUrl(frontLogo)} alt="Front" className="w-6 h-6 object-contain" />
            </div>
            <span className={cn(
              'text-xs font-medium text-center leading-tight',
              loadingDoc === 'addmove_email' ? 'text-primary' : downloaded['addmove_email'] ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground',
            )}>{loadingDoc === 'addmove_email' ? 'Sending...' : 'Add/Move Email'}</span>
          </button>
        </div>
      </CollapsibleSection>
    </div>
  );
}
