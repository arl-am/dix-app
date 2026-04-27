import { AlertTriangle, CheckCircle2, MapPin, ShieldAlert, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Agent } from '../../lib/mockData';

interface Props {
  agent: Agent | null;
  bypass: boolean;
  onBypassChange: (v: boolean) => void;
}

function AddressBlock({ address }: { address: string }) {
  if (!address) return <p className="text-xs text-slate-500 italic">Address not configured for this terminal.</p>;
  return (
    <pre className="text-sm font-medium text-slate-900 whitespace-pre-wrap font-sans leading-relaxed">{address}</pre>
  );
}

export default function Step3ReturnAddress({ agent, bypass, onBypassChange }: Props) {
  const isInventoryTerminal = agent?.cr6cd_inventoryterminal === true;
  const inventoryAddr = agent?.cr6cd_inventoryreturnaddress || '';
  const nonInventoryAddr = agent?.cr6cd_noninventoryreturnaddress || '';

  if (!agent) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No terminal selected. Go back to Step 1.</p>
      </div>
    );
  }

  if (!isInventoryTerminal) {
    return (
      <div
        className="rounded-2xl border-2 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
          borderColor: '#86EFAC',
          animation: 'fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        <div className="px-6 py-5 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: '#10B981' }}>
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-emerald-900">Return Address — Not Required</h3>
            <p className="text-sm text-emerald-800 mt-1">
              Terminal <span className="font-semibold">{agent.cr6cd_terminal}</span> is not flagged as an Inventory Terminal,
              so the Return Address step is skipped automatically. Continue to Review &amp; Actions when you're ready.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-white/60 rounded-full px-2.5 py-1">
              <ArrowRight className="w-3 h-3" />
              No additional action required
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'rounded-2xl border-2 overflow-hidden transition-all duration-300',
        )}
        style={{
          background: bypass
            ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)'
            : 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
          borderColor: bypass ? '#93C5FD' : '#FCA5A5',
          animation: 'fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        <div className="px-6 py-5 flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-colors duration-300"
            style={{ backgroundColor: bypass ? '#3B82F6' : '#DC2626' }}
          >
            {bypass ? <MapPin className="w-6 h-6 text-white" /> : <ShieldAlert className="w-6 h-6 text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={cn('text-base font-bold', bypass ? 'text-blue-900' : 'text-red-900')}>
                {bypass ? 'Driver Return Address' : 'Inventory Terminal — Return to Inventory Address'}
              </h3>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ backgroundColor: bypass ? '#3B82F6' : '#DC2626' }}
              >
                {bypass ? 'BYPASSED' : 'REQUIRED'}
              </span>
            </div>
            <p className={cn('text-sm mt-1', bypass ? 'text-blue-800' : 'text-red-800')}>
              {bypass
                ? `Equipment will be returned to the alternate driver-return address configured on terminal ${agent.cr6cd_terminal}.`
                : `Terminal ${agent.cr6cd_terminal} is configured as an Inventory Terminal. Equipment must be returned to the inventory address below.`}
            </p>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-sm px-6 py-4 border-t" style={{ borderColor: bypass ? '#BFDBFE' : '#FECACA' }}>
          <p className={cn('text-[10px] font-bold uppercase tracking-wider mb-2', bypass ? 'text-blue-700' : 'text-red-700')}>
            {bypass ? 'Driver Returns To' : 'Inventory Returns To'}
          </p>
          <AddressBlock address={bypass ? nonInventoryAddr : inventoryAddr} />
        </div>

        <div className="px-6 py-3 bg-white/40 border-t flex items-center justify-between flex-wrap gap-2" style={{ borderColor: bypass ? '#BFDBFE' : '#FECACA' }}>
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle className={cn('w-3.5 h-3.5', bypass ? 'text-blue-700' : 'text-red-700')} />
            <span className={bypass ? 'text-blue-800' : 'text-red-800'}>
              {bypass ? 'You bypassed the inventory address.' : 'Need to ship to the driver instead?'}
            </span>
          </div>
          <button
            onClick={() => onBypassChange(!bypass)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all duration-200 active:scale-95',
              bypass
                ? 'bg-white border-blue-300 text-blue-900 hover:bg-blue-50 hover:-translate-y-0.5'
                : 'bg-white border-red-300 text-red-900 hover:bg-red-50 hover:-translate-y-0.5',
            )}
          >
            {bypass ? 'Restore Inventory Address' : 'Bypass Agent Address'}
          </button>
        </div>
      </div>
    </div>
  );
}
