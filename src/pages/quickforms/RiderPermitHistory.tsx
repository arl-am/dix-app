import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { History, FileDown, Search, User, Calendar, Inbox, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRiderPermits, type RiderPermitRecord } from '../../hooks/useRiderPermits';
import { generateRiderPermit } from '../../lib/generateRiderPermit';
import { cn } from '../../lib/utils';

function formatShort(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateRange(start: string, end: string): string {
  const s = formatShort(start);
  const e = formatShort(end);
  if (s && e) return `${s} – ${e}`;
  return s || e || '';
}

export default function RiderPermitHistory() {
  const { data: permits = [], isLoading, isError, error } = useRiderPermits();
  const [query, setQuery] = useState('');
  const [redownloading, setRedownloading] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return permits;
    return permits.filter((p) =>
      p.proNumber.toLowerCase().includes(q) ||
      p.driverName.toLowerCase().includes(q) ||
      p.businessName.toLowerCase().includes(q) ||
      p.passengerName.toLowerCase().includes(q) ||
      p.terminal.toLowerCase().includes(q) ||
      p.unitNumber.toLowerCase().includes(q) ||
      p.createdByName.toLowerCase().includes(q),
    );
  }, [permits, query]);

  const handleReDownload = async (p: RiderPermitRecord) => {
    setRedownloading(p.id);
    try {
      await generateRiderPermit({
        driverName: p.driverName,
        businessName: p.businessName,
        unitNumber: p.unitNumber,
        proNumber: p.proNumber,
        passengerName: p.passengerName,
        permitStartDate: p.permitStartDate,
        permitEndDate: p.permitEndDate,
      });
      toast.success(`PRO ${p.proNumber} downloaded`);
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setRedownloading(null);
    }
  };

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['rider-permits'] });

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#2563EB]/10 dark:bg-[#2563EB]/20 flex items-center justify-center">
            <History className="w-4.5 h-4.5 text-[#2563EB]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Recent Rider Permits</h3>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Loading…' : `${permits.length} permit${permits.length === 1 ? '' : 's'} in Dataverse`}
            </p>
          </div>
        </div>
        <button
          onClick={refresh}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          Refresh
        </button>
      </div>

      {!isLoading && !isError && permits.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by PRO, driver, passenger, business, terminal..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground hover:border-muted-foreground/40"
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[68px] rounded-lg border border-border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-300">
          <Inbox className="w-4 h-4 flex-shrink-0" />
          <span>
            Couldn't load history: {error instanceof Error ? error.message : 'Unknown error'}.
            Make sure the <code className="font-mono text-xs">cr6cd_dix_riderpermit</code> table exists in Dataverse.
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
            <Inbox className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {permits.length === 0 ? 'No permits yet' : 'No matches found'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {permits.length === 0 ? 'Generate your first Rider Permit above.' : 'Try a different search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          {filtered.map((p, i) => (
            <PermitRow
              key={p.id}
              permit={p}
              index={i}
              isBusy={redownloading === p.id}
              onReDownload={() => handleReDownload(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PermitRow({ permit, index, isBusy, onReDownload }: {
  permit: RiderPermitRecord;
  index: number;
  isBusy: boolean;
  onReDownload: () => void;
}) {
  return (
    <div
      className="group relative rounded-lg border border-border bg-background hover:border-primary/30 hover:shadow-sm transition-all duration-200 p-3 animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index * 40, 320)}ms` }}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 min-w-[64px]">
          <div className="inline-flex items-center justify-center min-w-[56px] h-7 px-2.5 rounded-md bg-primary/10 text-primary text-xs font-bold tabular-nums">
            #{permit.proNumber}
          </div>
        </div>

        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-0.5">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">{permit.passengerName || '—'}</div>
            <div className="text-[11px] text-muted-foreground truncate">
              {permit.driverName}
              {permit.businessName && <> · {permit.businessName}</>}
            </div>
          </div>

          <div className="hidden sm:block min-w-0">
            <div className="text-xs text-foreground truncate flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              {formatDateRange(permit.permitStartDate, permit.permitEndDate)}
            </div>
            <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
              <User className="w-3 h-3 flex-shrink-0" />
              {permit.createdByName || '—'} · {formatShort(permit.createdOn)}
            </div>
          </div>

          <button
            onClick={onReDownload}
            disabled={isBusy}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium',
              'border border-input bg-background shadow-sm transition-all duration-200',
              'hover:bg-primary hover:text-white hover:border-primary hover:shadow-md active:scale-95',
              'disabled:opacity-50 disabled:pointer-events-none',
            )}
          >
            {isBusy ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Downloading
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5" />
                Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
