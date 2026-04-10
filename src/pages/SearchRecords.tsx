import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Building2, User, Truck, Pencil, Trash2, Eye, X, Mail, CreditCard, MapPin, Shield, FileText, CheckCircle, XCircle, Package, DollarSign, Loader2, FileDown } from 'lucide-react';
import { useDrivers } from '../hooks/useDrivers';
import { useDeleteDriver } from '../hooks/useDriverMutation';
import { formatDate, cn, isLocal } from '../lib/utils';
import { ACTION_TYPE_LABELS, CONTRACT_TYPE_LABELS, getActionBadgeClasses, type Driver } from '../lib/mockData';
import Spinner from '../components/Spinner';
import CustomSelect from '../components/CustomSelect';
import { toast } from 'sonner';

function YesNo({ value }: { value: boolean | undefined }) {
  return value ? (
    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
      <CheckCircle className="w-3 h-3" /> Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-muted-foreground text-xs font-medium">
      <XCircle className="w-3 h-3" /> No
    </span>
  );
}

function Field({ label, value, mask }: { label: string; value?: string | number | null; mask?: boolean }) {
  const display = mask && value ? '***-**-' + String(value).slice(-4) : (value || '—');
  return (
    <div className="py-1.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      <p className="text-sm text-foreground font-medium leading-tight mt-0.5">{display}</p>
    </div>
  );
}

function SectionHeader({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={cn('w-6 h-6 rounded-md flex items-center justify-center', color)}>
        <Icon className="w-3 h-3" />
      </div>
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}

const DEDUCTION_LABELS: Record<string, string> = {
  occacc: 'Occ/Acc Insurance', bobtail: 'Bobtail Insurance', pdi: 'Physical Damage Ins',
  security_deposit: 'Security Deposit', eld_deposit: 'ELD Deposit', dashcam_deposit: 'DashCam Deposit',
  buydown: 'Buy-Down', ifta: 'IFTA', irp_plate_prepaid: 'IRP Plate: PrePaid',
  irp_plate_settlements: 'IRP Plate: Settlements', prepass_tolls_bypass: 'PrePass: Tolls & Bypass',
  prepass_bypass: 'PrePass: Bypass', maintenance_fund: 'Maintenance Fund',
  chassis_usage: 'Chassis Usage', rfid: 'RFID Tag',
};

const TRANSFER_LABELS: Record<string, string> = {
  transfer_security_deposit: 'Security Deposit', transfer_eld: 'ELD', transfer_dashcam: 'DashCam', transfer_plate: 'Plate',
  reactivate_security_deposit: 'Security Deposit', reactivate_eld: 'ELD', reactivate_dashcam: 'DashCam', reactivate_plate: 'Plate',
};

function ViewModal({ driver, onClose }: { driver: Driver; onClose: () => void }) {
  const [closing, setClosing] = useState(false);

  const { data: vendorData, isLoading: vendorLoading } = useQuery({
    queryKey: ['view-vendor', driver._cr6cd_dix_vendor_value],
    queryFn: async () => {
      if (!driver._cr6cd_dix_vendor_value || isLocal) return null;
      const { Cr6cd_dix_vendorsService } = await import('../generated');
      const r = await Cr6cd_dix_vendorsService.get(driver._cr6cd_dix_vendor_value);
      return r.data as Record<string, any> | null;
    },
    enabled: !!driver._cr6cd_dix_vendor_value,
  });

  const { data: unitData, isLoading: unitLoading } = useQuery({
    queryKey: ['view-unit', driver._cr6cd_dix_unit_value],
    queryFn: async () => {
      if (!driver._cr6cd_dix_unit_value || isLocal) return null;
      const { Cr6cd_dix_unitsService } = await import('../generated');
      const r = await Cr6cd_dix_unitsService.get(driver._cr6cd_dix_unit_value);
      return r.data as Record<string, any> | null;
    },
    enabled: !!driver._cr6cd_dix_unit_value,
  });

  const { data: deductionData, isLoading: deductionsLoading } = useQuery({
    queryKey: ['view-deductions', driver.cr6cd_dix_driverid],
    queryFn: async () => {
      if (isLocal) return [];
      const { Cr6cd_dix_driverdeductionsService } = await import('../generated');
      const r = await Cr6cd_dix_driverdeductionsService.getAll({
        filter: `_cr6cd_dix_deductiondriver_value eq '${driver.cr6cd_dix_driverid}'`,
        select: ['cr6cd_dix_deductionkey', 'cr6cd_dix_selected', 'cr6cd_dix_iftanumber', 'cr6cd_dix_customvalue'],
      });
      return (r.data || []) as Record<string, any>[];
    },
  });

  const deductions = (deductionData || []).filter((d) => d.cr6cd_dix_selected && !d.cr6cd_dix_deductionkey?.startsWith('transfer_') && !d.cr6cd_dix_deductionkey?.startsWith('reactivate_'));
  const transferSubs = (deductionData || []).filter((d) => d.cr6cd_dix_selected && d.cr6cd_dix_deductionkey?.startsWith('transfer_'));
  const reactivateSubs = (deductionData || []).filter((d) => d.cr6cd_dix_selected && d.cr6cd_dix_deductionkey?.startsWith('reactivate_'));
  const anyLoading = vendorLoading || unitLoading || deductionsLoading;

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  const formatCurrency = (v: number | undefined | null) => v != null ? `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—';

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center transition-all duration-200',
        closing ? 'opacity-0' : 'opacity-100',
      )}
    >
      <div
        className={cn(
          'absolute inset-0 transition-all duration-200',
          closing ? 'bg-transparent' : 'bg-black/40 backdrop-blur-sm',
        )}
        onClick={close}
      />
      <div
        className={cn(
          'relative w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200',
          closing
            ? 'opacity-0 scale-95 translate-y-3'
            : 'opacity-100 scale-100 translate-y-0 animate-fade-in-up',
        )}
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">{driver.cr6cd_dix_name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium', getActionBadgeClasses(driver.cr6cd_dix_actiontype))}>
                  {ACTION_TYPE_LABELS[driver.cr6cd_dix_actiontype] || '—'}
                </span>
                <span className="text-xs text-muted-foreground">{CONTRACT_TYPE_LABELS[driver.cr6cd_dix_contracttype] || '—'}</span>
                <span className={cn(
                  'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
                  driver.cr6cd_dix_isactive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
                )}>
                  {driver.cr6cd_dix_isactive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={close}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 hover:rotate-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          {anyLoading && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading details...
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <SectionHeader icon={Mail} label="Contact" color="bg-sky-500/10 text-sky-500" />
              <div className="grid grid-cols-2 gap-x-4">
                <Field label="Email" value={driver.cr6cd_dix_email} />
                <Field label="Phone" value={driver.cr6cd_dix_phonenumber} />
                <Field label="SSN" value={driver.cr6cd_dix_ssn} mask />
                <Field label="Driver Code" value={driver.cr6cd_dix_drivercode} />
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-4">
              <SectionHeader icon={CreditCard} label="License" color="bg-violet-500/10 text-violet-500" />
              <div className="grid grid-cols-2 gap-x-4">
                <Field label="License #" value={driver.cr6cd_dix_licensenumber} />
                <Field label="State" value={driver.cr6cd_dix_licensestate} />
                <Field label="Expiration" value={formatDate(driver.cr6cd_dix_licenseexpdate)} />
                <Field label="Fuel Card" value={driver.cr6cd_dix_fuelcardnumber} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <SectionHeader icon={MapPin} label="Driver Address" color="bg-emerald-500/10 text-emerald-500" />
              <div className="grid grid-cols-2 gap-x-4">
                <Field label="Street" value={driver.cr6cd_dix_streetaddress} />
                <Field label="City" value={driver.cr6cd_dix_city} />
                <Field label="State" value={driver.cr6cd_dix_state} />
                <Field label="Zip" value={driver.cr6cd_dix_zipcode} />
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-4">
              <SectionHeader icon={Shield} label="Compliance" color="bg-amber-500/10 text-amber-500" />
              <div className="space-y-2.5">
                <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">ELP Required</span><YesNo value={driver.cr6cd_dix_elprequired} /></div>
                <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Hazmat</span><YesNo value={driver.cr6cd_dix_hazmat} /></div>
                <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Homeland Security</span><YesNo value={driver.cr6cd_dix_homelandsecurity} /></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <SectionHeader icon={Building2} label="Vendor" color="bg-purple-500/10 text-purple-500" />
              {!driver._cr6cd_dix_vendor_value ? (
                <p className="text-xs text-muted-foreground italic">No vendor linked</p>
              ) : vendorLoading ? (
                <p className="text-xs text-muted-foreground italic">Loading...</p>
              ) : (
                <div className="grid grid-cols-2 gap-x-4">
                  <Field label="Business Name" value={vendorData?.cr6cd_dix_businessname} />
                  <Field label="Vendor Code" value={vendorData?.cr6cd_dix_vendorcode} />
                  <Field label="EIN" value={vendorData?.cr6cd_dix_einnumber} />
                  <Field label="Phone" value={vendorData?.cr6cd_dix_phonenumber} />
                  <Field label="Street" value={vendorData?.cr6cd_dix_streetaddress} />
                  <Field label="City" value={vendorData?.cr6cd_dix_city} />
                  <Field label="State" value={vendorData?.cr6cd_dix_state} />
                  <Field label="Zip" value={vendorData?.cr6cd_dix_zipcode} />
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-4">
              <SectionHeader icon={Truck} label="Truck / Unit" color="bg-teal-500/10 text-teal-500" />
              {!driver._cr6cd_dix_unit_value ? (
                <p className="text-xs text-muted-foreground italic">No unit linked</p>
              ) : unitLoading ? (
                <p className="text-xs text-muted-foreground italic">Loading...</p>
              ) : (
                <div className="grid grid-cols-2 gap-x-4">
                  <Field label="Unit #" value={unitData?.cr6cd_dix_unitnumber} />
                  <Field label="Year" value={unitData?.cr6cd_dix_year} />
                  <Field label="Make" value={unitData?.cr6cd_dix_make} />
                  <Field label="Model" value={unitData?.cr6cd_dix_model} />
                  <Field label="VIN" value={unitData?.cr6cd_dix_vin} />
                  <Field label="Color" value={unitData?.cr6cd_dix_color} />
                  <Field label="Truck Value" value={formatCurrency(unitData?.cr6cd_dix_truckvalue)} />
                  <Field label="Unladen Weight" value={unitData?.cr6cd_dix_unladenweight != null ? `${Number(unitData.cr6cd_dix_unladenweight).toLocaleString()} lbs` : null} />
                  <Field label="Purchase Date" value={formatDate(unitData?.cr6cd_dix_purchasedate)} />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/60 bg-card p-4">
              <SectionHeader icon={Package} label="Transfers & Reactivation" color="bg-indigo-500/10 text-indigo-500" />
              <div className="space-y-2.5">
                <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Transfer Occ/Acc</span><YesNo value={driver.cr6cd_dix_transferoccacc} /></div>
                <div>
                  <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Transfer Equipment</span><YesNo value={driver.cr6cd_dix_transferequipment} /></div>
                  {transferSubs.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 ml-1">
                      {transferSubs.map((d) => (
                        <span key={d.cr6cd_dix_deductionkey} className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                          {TRANSFER_LABELS[d.cr6cd_dix_deductionkey] || d.cr6cd_dix_deductionkey}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Reactivate Equipment</span><YesNo value={driver.cr6cd_dix_reactivateequipment} /></div>
                  {reactivateSubs.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 ml-1">
                      {reactivateSubs.map((d) => (
                        <span key={d.cr6cd_dix_deductionkey} className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20">
                          {TRANSFER_LABELS[d.cr6cd_dix_deductionkey] || d.cr6cd_dix_deductionkey}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-4">
              <SectionHeader icon={DollarSign} label={`Deductions (${deductions.length})`} color="bg-blue-500/10 text-blue-500" />
              {deductionsLoading ? (
                <p className="text-xs text-muted-foreground italic">Loading...</p>
              ) : deductions.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No deductions selected</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {deductions.map((d) => (
                      <span key={d.cr6cd_dix_deductionkey} className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20">
                        {DEDUCTION_LABELS[d.cr6cd_dix_deductionkey] || d.cr6cd_dix_deductionkey}
                      </span>
                    ))}
                  </div>
                  {deductions.some((d) => d.cr6cd_dix_deductionkey === 'ifta' && d.cr6cd_dix_iftanumber) && (
                    <p className="text-[11px] text-muted-foreground">IFTA #: <span className="text-foreground font-medium">{deductions.find((d) => d.cr6cd_dix_deductionkey === 'ifta')?.cr6cd_dix_iftanumber}</span></p>
                  )}
                  {deductions.some((d) => d.cr6cd_dix_deductionkey === 'maintenance_fund' && d.cr6cd_dix_customvalue != null) && (
                    <p className="text-[11px] text-muted-foreground">Maintenance Fund: <span className="text-foreground font-medium">{formatCurrency(deductions.find((d) => d.cr6cd_dix_deductionkey === 'maintenance_fund')?.cr6cd_dix_customvalue)}/wk</span></p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-4">
            <SectionHeader icon={FileText} label="Record Info" color="bg-primary/10 text-primary" />
            <div className="grid grid-cols-4 gap-x-4">
              <Field label="Terminal" value={driver.cr6cd_dix_agentname} />
              <Field label="Unit" value={driver.cr6cd_dix_unitname} />
              <Field label="Onboarding Date" value={formatDate(driver.cr6cd_dix_onboardingdate)} />
              <Field label="Created" value={formatDate(driver.createdon)} />
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-border flex justify-end">
          <button
            onClick={close}
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent h-9 px-4 transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SearchRecords() {
  const navigate = useNavigate();
  const { data: drivers = [], isLoading } = useDrivers();
  const deleteDriver = useDeleteDriver();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [viewDriver, setViewDriver] = useState<Driver | null>(null);

  const filtered = drivers.filter((d) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      d.cr6cd_dix_name.toLowerCase().includes(q) ||
      (d.cr6cd_dix_drivercode || '').toLowerCase().includes(q) ||
      (d.cr6cd_dix_agentname || '').toLowerCase().includes(q) ||
      (d.cr6cd_dix_unitname || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && d.cr6cd_dix_isactive) || (statusFilter === 'inactive' && !d.cr6cd_dix_isactive);
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string, name: string) => {
    deleteDriver.mutate(id, {
      onSuccess: () => {
        toast.success(`"${name}" deleted`);
        setConfirmDeleteId(null);
      },
      onError: (err) => toast.error(`Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`),
    });
  };

  return (
    <div className="p-6">
      {viewDriver && <ViewModal driver={viewDriver} onClose={() => setViewDriver(null)} />}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 animate-fade-in-up">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Record</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Are you sure you want to delete <span className="font-medium text-foreground">{drivers.find((d) => d.cr6cd_dix_driverid === confirmDeleteId)?.cr6cd_dix_name}</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleteDriver.isPending}
                className="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent h-9 px-4 transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const d = drivers.find((d) => d.cr6cd_dix_driverid === confirmDeleteId);
                  if (d) handleDelete(d.cr6cd_dix_driverid, d.cr6cd_dix_name);
                }}
                disabled={deleteDriver.isPending}
                className="inline-flex items-center justify-center rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 shadow-sm h-9 px-4 transition-all duration-200 disabled:opacity-50"
              >
                {deleteDriver.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-semibold text-foreground">Search Records</h1>
        <p className="text-muted-foreground mt-1">Search and manage all records</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm p-4 mb-6 animate-fade-in-up transition-all duration-200 hover:shadow-md" style={{ animationDelay: '55ms' }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" />
            <input
              type="text"
              placeholder="Search by name, driver code, terminal, or unit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm pl-10 h-9 outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-md placeholder:text-muted-foreground hover:border-muted-foreground/40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <CustomSelect
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-[140px]"
              triggerClassName="h-9"
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-fade-in-up transition-all duration-200 hover:shadow-md" style={{ animationDelay: '110ms' }}>
        <div className="hidden lg:flex items-center gap-4 px-6 py-3 bg-muted/50 border-b border-border text-xs font-semibold">
          <span className="w-28 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Terminal</span>
          <span className="w-40 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Driver Name</span>
          <span className="w-24">Driver Code</span>
          <span className="w-24 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Unit #</span>
          <span className="w-28">Action</span>
          <span className="w-32">Contract Type</span>
          <span className="flex-1">Created By</span>
          <span className="w-36 text-center">Actions</span>
        </div>

        {isLoading ? (
          <Spinner label="Loading records..." />
        ) : filtered.length === 0 ? (
          <Spinner label="No records found" className="[&>div:first-child]:hidden" />
        ) : (
          filtered.map((d) => (
            <div
              key={d.cr6cd_dix_driverid}
              className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 px-6 py-4 cursor-pointer border-b border-border last:border-b-0 transition-all duration-200 hover:bg-primary/5 active:bg-primary/10"
            >
              <div className="lg:w-28">
                <span className="lg:hidden text-xs text-muted-foreground">Terminal: </span>
                <span className="text-foreground">{d.cr6cd_dix_agentname || '—'}</span>
              </div>
              <div className="lg:w-40">
                <span className="lg:hidden text-xs text-muted-foreground">Name: </span>
                <span className="font-medium text-foreground">{d.cr6cd_dix_name}</span>
              </div>
              <div className="lg:w-24">
                <span className="lg:hidden text-xs text-muted-foreground">Code: </span>
                <span className="text-muted-foreground">{d.cr6cd_dix_drivercode || '—'}</span>
              </div>
              <div className="lg:w-24">
                <span className="lg:hidden text-xs text-muted-foreground">Unit: </span>
                <span className="text-muted-foreground">{d.cr6cd_dix_unitname || '—'}</span>
              </div>
              <div className="lg:w-28">
                <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-transform duration-200 hover:scale-105', getActionBadgeClasses(d.cr6cd_dix_actiontype))}>
                  {ACTION_TYPE_LABELS[d.cr6cd_dix_actiontype] || '—'}
                </span>
              </div>
              <div className="lg:w-32 text-muted-foreground text-sm">
                {CONTRACT_TYPE_LABELS[d.cr6cd_dix_contracttype] || '—'}
              </div>
              <div className="flex-1 text-muted-foreground text-sm flex items-center justify-between">
                <span>{d.cr6cd_dix_createdbyname}</span>
                <span className="text-xs">{formatDate(d.createdon)}</span>
              </div>
              <div className="lg:w-36 flex justify-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewDriver(d);
                  }}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground transition-all duration-200 hover:bg-sky-500/10 hover:text-sky-500 hover:scale-110 active:scale-95"
                  title="View details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/new-driver', { state: { driver: d } });
                  }}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:scale-110 active:scale-95"
                  title="Edit record"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/new-driver', { state: { driver: d, startStep: 5 } });
                  }}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground transition-all duration-200 hover:bg-amber-500/10 hover:text-amber-500 hover:scale-110 active:scale-95"
                  title="Documents"
                >
                  <FileDown className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDeleteId(d.cr6cd_dix_driverid);
                  }}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground transition-all duration-200 hover:bg-red-500/10 hover:text-red-500 hover:scale-110 active:scale-95"
                  title="Delete record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
