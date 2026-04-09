import { useState, useEffect, type ReactNode } from 'react';
import { ChevronDown, UserRound, Building2, Truck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { US_STATES } from '../../lib/mockData';
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
  const [sameAsDriver, setSameAsDriver] = useState(false);

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
  const YEARS = Array.from({ length: currentYear - 1989 + 1 }, (_, i) => String(currentYear + 1 - i));

  const input = (field: string, label: string, opts?: { type?: string; placeholder?: string; required?: boolean; colSpan?: number; numbersOnly?: boolean; disabled?: boolean }) => (
    <div className={cn(opts?.colSpan === 2 ? 'md:col-span-2 space-y-2' : 'space-y-2')}>
      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        {label} {opts?.required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={opts?.type || 'text'}
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
          opts?.disabled && 'opacity-50 cursor-not-allowed bg-muted',
        )}
      />
    </div>
  );

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
            style={{ backgroundColor: `${color}15`, color }}
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
        </div>
      ))}
    </div>
  );
}
