import { useMemo } from 'react';
import CustomSelect from '../../components/CustomSelect';
import DatePicker from '../../components/DatePicker';
import type { Agent } from '../../lib/mockData';
import {
  CXL_TYPE_OPTIONS,
  CXL_REASON_OPTIONS,
  typeNeedsDriver,
  typeNeedsVendor,
  typeNeedsUnit,
  typeNeedsTrailer,
} from '../../lib/cancellationConstants';

export interface Step1Form {
  canceltype: number | null;
  agentId: string;
  canceldate: string;
  startdate: string;
  cancelreason: number | null;
  reasondetails: string;
  unitnumber: string;
  vendorcode: string;
  vendorname: string;
  drivercode: string;
  drivername: string;
  driverphone: string;
  trailercode: string;
  submittedby: string;
}

interface Props {
  form: Step1Form;
  onChange: <K extends keyof Step1Form>(field: K, value: Step1Form[K]) => void;
  agents: Agent[];
}

export default function Step1Details({ form, onChange, agents }: Props) {
  const showDriver = useMemo(() => typeNeedsDriver(form.canceltype ?? undefined), [form.canceltype]);
  const showVendor = useMemo(() => typeNeedsVendor(form.canceltype ?? undefined), [form.canceltype]);
  const showUnit = useMemo(() => typeNeedsUnit(form.canceltype ?? undefined), [form.canceltype]);
  const showTrailer = useMemo(() => typeNeedsTrailer(form.canceltype ?? undefined), [form.canceltype]);

  const text = (name: keyof Step1Form, label: string, opts?: { placeholder?: string; required?: boolean; type?: string }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}{opts?.required && <span className="text-destructive"> *</span>}</label>
      <input
        type={opts?.type || 'text'}
        placeholder={opts?.placeholder || `Enter ${label.toLowerCase()}`}
        value={(form[name] as string) || ''}
        onChange={(e) => onChange(name, e.target.value as Step1Form[typeof name])}
        className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground hover:border-muted-foreground/40"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="border border-border rounded-xl p-5 bg-card space-y-4 animate-fade-in-up">
        <h3 className="text-base font-semibold text-foreground">General Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Cancellation Type <span className="text-destructive">*</span></label>
            <CustomSelect
              options={CXL_TYPE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
              value={form.canceltype != null ? String(form.canceltype) : ''}
              onChange={(v) => onChange('canceltype', v ? Number(v) : null)}
              placeholder="Select type..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Terminal <span className="text-destructive">*</span></label>
            <CustomSelect
              options={agents.map((a) => ({ value: a.cr6cd_agentsid, label: `${a.cr6cd_terminal} — ${a.cr6cd_title}` }))}
              value={form.agentId || ''}
              onChange={(v) => onChange('agentId', v)}
              placeholder="Select terminal..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Cancel Date <span className="text-destructive">*</span></label>
            <DatePicker value={form.canceldate || ''} onChange={(v) => onChange('canceldate', v)} placeholder="Select date" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Start Date</label>
            <DatePicker value={form.startdate || ''} onChange={(v) => onChange('startdate', v)} placeholder="Original onboarding date" />
          </div>
          {text('submittedby', 'Submitted By', { placeholder: 'Your name' })}
        </div>
      </div>

      <div className="border border-border rounded-xl p-5 bg-card space-y-4 animate-fade-in-up" style={{ animationDelay: '40ms' }}>
        <h3 className="text-base font-semibold text-foreground">Reason</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Cancel Reason <span className="text-destructive">*</span></label>
            <CustomSelect
              options={CXL_REASON_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
              value={form.cancelreason != null ? String(form.cancelreason) : ''}
              onChange={(v) => onChange('cancelreason', v ? Number(v) : null)}
              placeholder="Select reason..."
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Reason Details</label>
          <textarea
            placeholder="Add any context the ops team needs..."
            value={form.reasondetails || ''}
            onChange={(e) => onChange('reasondetails', e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground hover:border-muted-foreground/40 resize-none"
          />
        </div>
      </div>

      {showVendor && (
        <div className="border border-border rounded-xl p-5 bg-card space-y-4 animate-fade-in-up">
          <h3 className="text-base font-semibold text-foreground">Vendor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {text('vendorcode', 'Vendor Code', { required: true })}
            {text('vendorname', 'Vendor Name')}
          </div>
        </div>
      )}

      {showDriver && (
        <div className="border border-border rounded-xl p-5 bg-card space-y-4 animate-fade-in-up">
          <h3 className="text-base font-semibold text-foreground">Driver</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {text('drivercode', 'Driver Code', { required: true })}
            {text('drivername', 'Driver Name', { required: true })}
            {text('driverphone', 'Phone Number', { type: 'tel' })}
          </div>
        </div>
      )}

      {showUnit && (
        <div className="border border-border rounded-xl p-5 bg-card space-y-4 animate-fade-in-up">
          <h3 className="text-base font-semibold text-foreground">Unit</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {text('unitnumber', 'Unit Number', { required: true })}
          </div>
        </div>
      )}

      {showTrailer && (
        <div className="border border-border rounded-xl p-5 bg-card space-y-4 animate-fade-in-up">
          <h3 className="text-base font-semibold text-foreground">Trailer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {text('trailercode', 'Trailer Number', { required: true })}
          </div>
        </div>
      )}
    </div>
  );
}
