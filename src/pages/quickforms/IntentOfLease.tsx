import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileDown, FilePenLine } from 'lucide-react';
import { useAgents } from '../../hooks/useAgents';
import { toast } from 'sonner';
import CustomSelect from '../../components/CustomSelect';
import DatePicker from '../../components/DatePicker';

export default function IntentOfLease() {
  const { data: agents = [] } = useAgents();
  const [form, setForm] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const field = (name: string, label: string, opts?: { type?: string; placeholder?: string }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <input type={opts?.type || 'text'} placeholder={opts?.placeholder || `Enter ${label.toLowerCase()}`} value={form[name] || ''} onChange={(e) => set(name, e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground hover:border-muted-foreground/40" />
    </div>
  );

  return (
    <div className="p-6 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/documents" className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-input bg-background shadow-sm transition-all duration-200 hover:bg-accent active:scale-95">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#7C3AED]/10 dark:bg-[#7C3AED]/20 dark:ring-1 dark:ring-[#7C3AED]/20">
            <FilePenLine className="w-5 h-5 text-[#7C3AED]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Intent of Lease</h1>
            <p className="text-sm text-muted-foreground">Generate intent of lease agreements</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '55ms' }}>
          <h3 className="text-base font-semibold text-foreground">Terminal & Driver</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Terminal</label>
              <CustomSelect
                options={agents.map((a) => ({ value: a.cr6cd_terminal, label: `${a.cr6cd_terminal} — ${a.cr6cd_title}` }))}
                value={form.terminal || ''}
                onChange={(v) => set('terminal', v)}
                placeholder="Select terminal..."
              />
            </div>
            {field('driverName', 'Driver Name')}
            {field('driverCode', 'Driver Code')}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '110ms' }}>
          <h3 className="text-base font-semibold text-foreground">Vendor Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {field('businessName', 'Business Name')}
            {field('vendorCode', 'Vendor Code')}
            {field('einNumber', 'EIN Number', { placeholder: 'XX-XXXXXXX' })}
            {field('vendorAddress', 'Street Address')}
            {field('vendorCity', 'City')}
            {field('vendorState', 'State')}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '140ms' }}>
          <h3 className="text-base font-semibold text-foreground">Truck Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {field('unitNumber', 'Unit Number')}
            {field('year', 'Year')}
            {field('make', 'Make')}
            {field('model', 'Model')}
            {field('vin', 'VIN', { placeholder: '17-character VIN' })}
            {field('color', 'Color')}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '170ms' }}>
          <h3 className="text-base font-semibold text-foreground">Lease Terms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Lease Start Date</label>
              <DatePicker value={form.leaseStartDate || ''} onChange={(v) => set('leaseStartDate', v)} placeholder="Select start date" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Lease End Date</label>
              <DatePicker value={form.leaseEndDate || ''} onChange={(v) => set('leaseEndDate', v)} placeholder="Select end date" />
            </div>
            {field('truckValue', 'Truck Value ($)', { type: 'number', placeholder: '0.00' })}
          </div>
        </div>

        <div className="flex justify-end gap-3 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <Link to="/documents" className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-9 px-4 py-2 border border-input bg-background shadow-sm transition-all duration-200 hover:bg-accent active:scale-95">Cancel</Link>
          <button onClick={() => toast.success('Intent of Lease PDF generated!')} className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-9 px-4 py-2 bg-[#7C3AED] text-white transition-all duration-200 hover:bg-[#6D28D9] hover:shadow-lg hover:shadow-purple-500/25 active:scale-95">
            <FileDown className="w-4 h-4" /> Generate PDF
          </button>
        </div>
      </div>
    </div>
  );
}
