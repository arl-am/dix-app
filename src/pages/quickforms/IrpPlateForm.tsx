import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileDown, CreditCard, Check } from 'lucide-react';
import { toast } from 'sonner';
import { generateIrpPlateForm, type IrpPlateOption } from '../../lib/generateIrpPlateForm';
import { cn } from '../../lib/utils';

export default function IrpPlateForm() {
  const [businessName, setBusinessName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [option, setOption] = useState<IrpPlateOption | ''>('');

  const handleGenerate = () => {
    if (!businessName.trim()) { toast.error('Business Name is required'); return; }
    if (!driverName.trim()) { toast.error('Driver Name is required'); return; }
    if (!option) { toast.error('Please select Option 1 or Option 2'); return; }
    generateIrpPlateForm({ businessName: businessName.trim(), driverName: driverName.trim(), option });
    toast.success('IRP Plate Form PDF generated!');
  };

  const optionCard = (value: IrpPlateOption, title: string, subtitle: string, description: string) => {
    const selected = option === value;
    return (
      <button
        type="button"
        onClick={() => setOption(value)}
        className={cn(
          'text-left rounded-xl border p-4 transition-all duration-200',
          selected
            ? 'border-[#10B981] bg-[#10B981]/5 shadow-sm shadow-emerald-500/10 ring-1 ring-[#10B981]/30'
            : 'border-border bg-card hover:border-[#10B981]/40 hover:shadow-md',
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 mt-0.5',
            selected ? 'border-[#10B981] bg-[#10B981]' : 'border-muted-foreground/40 bg-transparent',
          )}>
            {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <h4 className={cn('text-sm font-semibold', selected ? 'text-[#10B981]' : 'text-foreground')}>{title}</h4>
              <span className="text-xs font-medium text-muted-foreground">{subtitle}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="p-6 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/documents" className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-input bg-background shadow-sm transition-all duration-200 hover:bg-accent active:scale-95">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#10B981]/10 dark:bg-[#10B981]/20 dark:ring-1 dark:ring-[#10B981]/20">
            <CreditCard className="w-5 h-5 text-[#10B981]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">IRP Plate Form</h1>
            <p className="text-sm text-muted-foreground">Generate IRP plate registration forms</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '55ms' }}>
          <h3 className="text-base font-semibold text-foreground">Business & Driver</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Business Name <span className="text-destructive">*</span></label>
              <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Enter business name" className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground hover:border-muted-foreground/40" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Driver Name <span className="text-destructive">*</span></label>
              <input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Enter driver name" className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground hover:border-muted-foreground/40" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '110ms' }}>
          <div>
            <h3 className="text-base font-semibold text-foreground">Payment Option <span className="text-destructive">*</span></h3>
            <p className="text-xs text-muted-foreground mt-0.5">Select one option.</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {optionCard(
              'option1',
              'Option 1',
              'Pre-Paid',
              'IBE pays the full plate cost up front plus a $75 administration fee. $200 discount on 12-month plates. Pro-rated plates mid-term are not discounted.',
            )}
            {optionCard(
              'option2',
              'Option 2',
              'Settlements',
              '$575 upfront ($75 admin fee + $500 deposit) plus a $50 weekly plate charge deducted from settlements for the duration of enrollment.',
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 animate-fade-in-up" style={{ animationDelay: '170ms' }}>
          <Link to="/documents" className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-9 px-4 py-2 border border-input bg-background shadow-sm transition-all duration-200 hover:bg-accent active:scale-95">Cancel</Link>
          <button onClick={handleGenerate} className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-9 px-4 py-2 bg-[#10B981] text-white transition-all duration-200 hover:bg-[#059669] hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95">
            <FileDown className="w-4 h-4" /> Generate PDF
          </button>
        </div>
      </div>
    </div>
  );
}
