import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { ChevronDown, UserRound, Building2, Truck, ShieldCheck, Info, Eye, EyeOff } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { US_STATES } from '../../lib/mockData';
import { calculatePDI } from '../../lib/pdiRates';
import CustomSelect from '../../components/CustomSelect';
import DatePicker from '../../components/DatePicker';
import Toggle from '../../components/Toggle';

interface Step2Props {
  form: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export default function Step2RecordDetails({ form, onChange }: Step2Props) {
  const [driverOpen, setDriverOpen] = useState(true);
  const [vendorOpen, setVendorOpen] = useState(true);
  const [truckOpen, setTruckOpen] = useState(true);
  const [lienholderOpen, setLienholderOpen] = useState(false);
  const [sameAsDriver, setSameAsDriver] = useState(false);
  const [revealedFields, setRevealedFields] = useState<Record<string, boolean>>({});
  const toggleReveal = (field: string) => setRevealedFields((s) => ({ ...s, [field]: !s[field] }));

  const pdi = useMemo(() => calculatePDI(parseFloat(form.truckValue || '0')), [form.truckValue]);

  useEffect(() => {
    if (sameAsDriver) {
      onChange('vendorAddress', form.streetAddress || '');
      onChange('vendorCity', form.city || '');
      onChange('vendorState', form.state || '');
      onChange('vendorZipCode', form.zipCode || '');
    }
  }, [sameAsDriver, form.streetAddress, form.city, form.state, form.zipCode]);

  const TRUCK_MAKES = [
    'Freightliner', 'Kenworth', 'Peterbilt', 'Volvo', 'International',
    'Mack', 'Western Star', 'Hino', 'Ford', 'Chevrolet',
  ];

  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: currentYear - 1989 }, (_, i) => String(currentYear - i));

  const input = (field: string, label: string, opts?: { type?: string; placeholder?: string; required?: boolean; colSpan?: number; numbersOnly?: boolean; disabled?: boolean }) => {
    const isPassword = opts?.type === 'password';
    const revealed = revealedFields[field];
    const resolvedType = isPassword ? (revealed ? 'text' : 'password') : (opts?.type || 'text');

    return (
      <div className={cn(opts?.colSpan === 2 ? 'md:col-span-2 space-y-2' : 'space-y-2')}>
        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {label} {opts?.required && <span className="text-destructive">*</span>}
        </label>
        <div className="relative">
          <input
            type={resolvedType}
            inputMode={opts?.numbersOnly ? 'numeric' : undefined}
            placeholder={opts?.placeholder || `Enter ${label.toLowerCase()}`}
            value={form[field] || ''}
            disabled={opts?.disabled}
            onChange={(e) => {
              const v = e.target.value;
              if (opts?.numbersOnly && v && !/^\d*$/.test(v)) return;
              onChange(field, v);
            }}
            className={cn(
              'w-full h-10 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-md placeholder:text-muted-foreground hover:border-muted-foreground/40',
              isPassword && 'pr-10',
              opts?.disabled && 'opacity-50 cursor-not-allowed bg-muted',
            )}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => toggleReveal(field)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    );
  };

  const section = (
    title: string,
    icon: ReactNode,
    color: string,
    open: boolean,
    toggle: () => void,
    delay: string,
    children: ReactNode,
  ) => (
    <div
      className={cn(
        'rounded-xl border bg-card overflow-hidden animate-fade-in-up',
        'transition-all duration-300 ease-out',
        open ? 'shadow-md hover:shadow-lg' : 'shadow-sm hover:shadow-md',
      )}
      style={{ animationDelay: delay, borderColor: open ? `${color}30` : undefined }}
    >
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-4 transition-all duration-200 group"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{ backgroundColor: `${color}18`, color }}
          >
            {icon}
          </div>
          <span className="font-semibold text-foreground text-[15px]">{title}</span>
        </div>
        <div
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 bg-muted/60 group-hover:bg-muted',
            open && 'rotate-180',
          )}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </button>
      <div
        className={cn(
          'grid transition-all duration-300 ease-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-1 space-y-4">{children}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {section('Driver Information', <UserRound className="w-5 h-5" />, '#2563EB', driverOpen, () => setDriverOpen(!driverOpen), '0ms', (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {input('firstName', 'First Name', { required: true, placeholder: 'Enter first name' })}
          {input('lastName', 'Last Name', { required: true, placeholder: 'Enter last name' })}
          {input('email', 'Email', { type: 'email', required: true, placeholder: 'driver@example.com' })}
          {input('phone', 'Phone', { type: 'tel', placeholder: '(555) 555-5555' })}
          {input('ssn', 'SSN', { type: 'password', placeholder: 'XXX-XX-XXXX' })}
          {input('driverCode', 'Driver Code', { placeholder: 'Enter driver code' })}
          {input('licenseNumber', 'License Number', { placeholder: 'Enter license number' })}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">License State</label>
            <CustomSelect
              options={US_STATES.map((s) => ({ value: s, label: s }))}
              value={form.licenseState || ''}
              onChange={(v) => onChange('licenseState', v)}
              placeholder="Select state..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">License Expiration Date</label>
            <DatePicker
              value={form.licenseExpDate || ''}
              onChange={(v) => onChange('licenseExpDate', v)}
              placeholder="Select expiration date"
            />
          </div>
          {input('fuelCardNumber', 'Fuel Card Number', { placeholder: 'Enter fuel card number', numbersOnly: true })}
          {input('streetAddress', 'Street Address', { placeholder: 'Enter street address' })}
          {input('city', 'City', { placeholder: 'Enter city' })}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">State</label>
            <CustomSelect
              options={US_STATES.map((s) => ({ value: s, label: s }))}
              value={form.state || ''}
              onChange={(v) => onChange('state', v)}
              placeholder="Select state..."
            />
          </div>
          {input('zipCode', 'Zip Code', { placeholder: 'Enter zip code', numbersOnly: true })}
        </div>
      ))}

      {section('Vendor Information', <Building2 className="w-5 h-5" />, '#7C3AED', vendorOpen, () => setVendorOpen(!vendorOpen), '70ms', (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {input('businessName', 'Business Name', { placeholder: 'Enter business name' })}
            {input('vendorCode', 'Vendor Code', { placeholder: 'Enter vendor code' })}
            {input('einNumber', 'EIN Number', { placeholder: 'XX-XXXXXXX' })}
            {input('vendorPhone', 'Phone Number', { type: 'tel', placeholder: '(555) 555-5555' })}
          </div>
          <div className="flex items-center gap-2.5 pt-2">
            <Toggle checked={sameAsDriver} onChange={setSameAsDriver} color="primary" />
            <span className="text-sm font-medium text-muted-foreground">Same as driver address</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {input('vendorAddress', 'Street Address', { placeholder: 'Enter street address', disabled: sameAsDriver })}
            {input('vendorCity', 'City', { placeholder: 'Enter city', disabled: sameAsDriver })}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">State</label>
              <CustomSelect
                options={US_STATES.map((s) => ({ value: s, label: s }))}
                value={form.vendorState || ''}
                onChange={(v) => onChange('vendorState', v)}
                placeholder="Select state..."
                disabled={sameAsDriver}
              />
            </div>
            {input('vendorZipCode', 'Zip Code', { placeholder: 'Enter zip code', numbersOnly: true, disabled: sameAsDriver })}
          </div>
        </>
      ))}

      {section('Truck Information', <Truck className="w-5 h-5" />, '#10B981', truckOpen, () => setTruckOpen(!truckOpen), '140ms', (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {input('unitNumber', 'Unit Number', { placeholder: 'Enter unit number' })}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">Year</label>
              <CustomSelect
                options={YEARS.map((y) => ({ value: y, label: y }))}
                value={form.year || ''}
                onChange={(v) => onChange('year', v)}
                placeholder="Select year..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">Make</label>
              <CustomSelect
                options={TRUCK_MAKES.map((m) => ({ value: m, label: m }))}
                value={form.make || ''}
                onChange={(v) => onChange('make', v)}
                placeholder="Select make..."
              />
            </div>
            {input('model', 'Model', { placeholder: 'Enter model' })}
            {input('vin', 'VIN', { placeholder: '17-character VIN' })}
            {input('color', 'Color', { placeholder: 'Color' })}
            {input('truckValue', 'Truck Value', { placeholder: '0.00', numbersOnly: true })}
            {input('unladenWeight', 'Unladen Weight', { placeholder: 'Enter weight', numbersOnly: true })}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">Purchase Date</label>
              <DatePicker
                value={form.purchaseDate || ''}
                onChange={(v) => onChange('purchaseDate', v)}
                placeholder="Select date..."
              />
            </div>
          </div>

          {parseFloat(form.truckValue || '0') > 0 && (
            <div className="mt-4 rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-300" />
                <span className="text-sm font-semibold text-white">PDI Estimate</span>
                {pdi.pdiPercentage > 0 && (
                  <span className="ml-auto text-xs text-slate-400 tabular-nums">{pdi.pdiPercentage}% rate</span>
                )}
              </div>
              <div className="px-4 py-3 flex items-center gap-6">
                <div>
                  <span className="text-xs text-muted-foreground">Monthly</span>
                  <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(pdi.pdiMonthly)}</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                  <span className="text-xs text-muted-foreground">Weekly Deposit</span>
                  <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(pdi.pdiWeeklyDeposit)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 rounded-lg border border-border/60 overflow-hidden">
            <button
              onClick={() => setLienholderOpen(!lienholderOpen)}
              className="w-full flex items-center justify-between px-4 py-3 transition-all duration-200 group hover:bg-muted/30"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md flex items-center justify-center bg-amber-500/10 text-amber-500">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="font-medium text-foreground text-sm">Lienholder Information</span>
              </div>
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 bg-muted/60 group-hover:bg-muted',
                  lienholderOpen && 'rotate-180',
                )}
              >
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </button>
            <div
              className={cn(
                'grid transition-all duration-300 ease-out',
                lienholderOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
              )}
            >
              <div className="overflow-hidden">
                <div className="px-4 pb-4 pt-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {input('lienholderName', 'Lienholder Name', { placeholder: 'Enter lienholder name' })}
                  {input('lienholderAddress', 'Lienholder Address', { placeholder: 'Full address (street, city, state, zip)' })}
                </div>
              </div>
            </div>
          </div>
        </>
      ))}
    </div>
  );
}
