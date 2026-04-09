import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Step2Props {
  form: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

export default function Step2RecordDetails({ form, onChange }: Step2Props) {
  const [vendorOpen, setVendorOpen] = useState(false);

  const input = (field: string, label: string, opts?: { type?: string; placeholder?: string; required?: boolean; colSpan?: number }) => (
    <div className={cn(opts?.colSpan === 2 ? 'md:col-span-2 space-y-2' : 'space-y-2')}>
      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        {label} {opts?.required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={opts?.type || 'text'}
        placeholder={opts?.placeholder || `Enter ${label.toLowerCase()}`}
        value={form[field] || ''}
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full h-10 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-md placeholder:text-muted-foreground hover:border-muted-foreground/40"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
        <h3 className="text-base font-semibold text-foreground mb-4">Driver Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {input('firstName', 'First Name', { required: true, placeholder: 'Enter first name' })}
          {input('lastName', 'Last Name', { required: true, placeholder: 'Enter last name' })}
          {input('email', 'Email', { type: 'email', required: true, placeholder: 'driver@example.com' })}
          {input('phone', 'Phone', { type: 'tel', placeholder: '(555) 555-5555' })}
          {input('ssn', 'SSN', { type: 'password', placeholder: 'XXX-XX-XXXX' })}
          {input('driverCode', 'Driver Code', { placeholder: 'Enter driver code' })}
          {input('licenseNumber', 'License Number', { placeholder: 'Enter license number' })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden animate-fade-in-up transition-all duration-200 hover:shadow-md" style={{ animationDelay: '70ms' }}>
        <button
          onClick={() => setVendorOpen(!vendorOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-all duration-200 rounded-t-xl"
        >
          <span className="font-medium text-foreground">Vendor Information</span>
          <div className={cn('transition-transform duration-200', vendorOpen && 'rotate-180')}>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </button>
        <div
          className={cn(
            'grid transition-all duration-200 ease-out',
            vendorOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="overflow-hidden">
            <div className="p-6 pt-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {input('businessName', 'Business Name', { placeholder: 'Enter business name' })}
                {input('vendorCode', 'Vendor Code', { placeholder: 'Enter vendor code' })}
                {input('einNumber', 'EIN Number', { placeholder: 'XX-XXXXXXX' })}
                {input('vendorPhone', 'Phone Number', { type: 'tel', placeholder: '(555) 555-5555' })}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {input('vendorAddress', 'Street Address', { placeholder: 'Enter street address', colSpan: 2 })}
                {input('vendorCity', 'City', { placeholder: 'City' })}
                {input('vendorState', 'State', { placeholder: 'State' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: '140ms' }}>
        <h3 className="text-base font-semibold text-foreground mb-4">Truck Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {input('unitNumber', 'Unit Number', { placeholder: 'Enter unit number' })}
          {input('year', 'Year', { placeholder: 'Year' })}
          {input('make', 'Make', { placeholder: 'Make' })}
          {input('model', 'Model', { placeholder: 'Enter model' })}
          {input('vin', 'VIN', { placeholder: '17-character VIN' })}
          {input('color', 'Color', { placeholder: 'Color' })}
        </div>
      </div>
    </div>
  );
}
