import { useState } from 'react';
import { ChevronDown, CircleCheck, FileText, Mail } from 'lucide-react';

interface Props {
  form: Record<string, string>;
  equipment: Record<string, boolean>;
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value || '—'}</span>
    </div>
  );
}

export default function Step5Actions({ form, equipment }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const requiredEquipment = Object.entries(equipment).filter(([, v]) => v).map(([k]) => k);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 animate-fade-in">
        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
          <CircleCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Cancellation record saved</h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Review details and complete any required actions below</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in-up">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Summary</h3>
          <button onClick={() => setCollapsed(!collapsed)} className="text-sm text-primary font-medium transition-colors duration-200 hover:text-primary/80">
            {collapsed ? 'Expand All' : 'Collapse All'}
          </button>
        </div>

        {!collapsed && (
          <div className="divide-y divide-border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-foreground">Cancellation Details</h4>
                <button className="text-xs text-primary font-medium hover:underline">Edit</button>
              </div>
              <div className="space-y-0.5">
                <SummaryField label="Type" value={form.cancellationType} />
                <SummaryField label="Terminal" value={form.terminal} />
                <SummaryField label="Date" value={form.cancellationDate} />
                <SummaryField label="Driver Name" value={`${form.cxlFirstName || ''} ${form.cxlLastName || ''}`.trim() || 'No Driver'} />
                <SummaryField label="Driver Code" value={form.cxlDriverCode} />
                <SummaryField label="Business Name" value={form.cxlBusinessName} />
                <SummaryField label="Vendor Code" value={form.cxlVendorCode} />
                <SummaryField label="Address" value={[form.cxlStreetAddress, form.cxlCity, form.cxlZipCode].filter(Boolean).join(', ')} />
                <SummaryField label="Unit Number" value={form.cxlUnitNumber} />
                <SummaryField label="VIN" value={form.cxlVin} />
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-foreground">Equipment & Returns</h4>
                <button className="text-xs text-primary font-medium hover:underline">Edit</button>
              </div>
              <p className="text-sm text-muted-foreground">
                {requiredEquipment.length > 0 ? requiredEquipment.join(', ') : 'No equipment required'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in-up" style={{ animationDelay: '55ms' }}>
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">Cancellation Actions</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-muted/30 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Contractor Cancellation</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {['Contractor', 'IBE Administration', 'IBE', 'Ports'].map((item) => (
                  <span key={item} className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground bg-background transition-all duration-200 hover:bg-muted/50 hover:border-muted-foreground/30 cursor-pointer">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="border border-border rounded-xl p-4 transition-all duration-200 hover:shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Cancellation Letter</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Generate formal cancellation letter PDF</p>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-9 px-4 py-2 bg-[#2563EB] text-white transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-lg hover:shadow-primary/25 active:scale-95">
              Generate PDF
            </button>
          </div>

          <div className="border border-border rounded-xl p-4 transition-all duration-200 hover:shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Cancellation Email</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Create cancellation email draft in Front</p>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-8 px-3 bg-blue-600 text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-95">
              Create Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
