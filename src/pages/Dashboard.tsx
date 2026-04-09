import { Link } from 'react-router-dom';
import { TrendingUp, CircleX, Clock, FileText, ChevronRight } from 'lucide-react';
import { useDrivers } from '../hooks/useDrivers';
import { useAgents } from '../hooks/useAgents';
import { formatDate } from '../lib/utils';
import { ACTION_TYPE_LABELS, getActionBadgeClasses } from '../lib/mockData';
import { cn } from '../lib/utils';
import Spinner from '../components/Spinner';

const statCards = [
  { label: 'Entries Processed', icon: TrendingUp, color: 'bg-[#3B82F6]', shadow: 'shadow-blue-500/10' },
  { label: 'Cancellations Processed', icon: CircleX, color: 'bg-destructive', shadow: 'shadow-red-500/10' },
  { label: 'Pending Actions', icon: Clock, color: 'bg-[#F59E0B]', shadow: 'shadow-amber-500/10' },
  { label: 'Documents Generated', icon: FileText, color: 'bg-[#10B981]', shadow: 'shadow-emerald-500/10' },
];

export default function Dashboard() {
  const { data: drivers = [] } = useDrivers();
  const { data: agents = [] } = useAgents();

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const counts = [drivers.length, 0, 0, 0];

  const terminalCounts: Record<string, number> = {};
  for (const d of drivers) {
    const t = d.cr6cd_dix_agentname || 'Unknown';
    terminalCounts[t] = (terminalCounts[t] || 0) + 1;
  }
  const maxCount = Math.max(1, ...Object.values(terminalCounts));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">{greeting}, Anderson</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{dateStr}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={cn(
                'flex-1 relative overflow-hidden bg-card border border-border rounded-xl shadow-sm',
                'transition-all duration-200 ease-out',
                'hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]',
                `hover:${card.shadow}`,
                'animate-fade-in-up',
              )}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={cn('absolute left-0 top-0 bottom-0 w-1 transition-all duration-200', card.color)} />
              <div className="p-5 pl-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-muted dark:bg-white/[0.08] flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="text-[32px] font-bold text-foreground leading-none">{counts[i]}</div>
                <p className="text-sm text-muted-foreground font-medium mt-1">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm animate-fade-in-up transition-all duration-200 hover:shadow-md" style={{ animationDelay: '140ms' }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
            <Link
              to="/drivers"
              className="text-sm text-primary font-medium flex items-center gap-1 transition-all duration-200 hover:gap-2 hover:underline"
            >
              View all <ChevronRight className="w-4 h-4 transition-transform duration-200" />
            </Link>
          </div>
          <div className="relative w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-4 text-left font-semibold text-foreground">Driver Name</th>
                  <th className="h-10 px-4 text-left font-semibold text-foreground">Terminal</th>
                  <th className="h-10 px-4 text-left font-semibold text-foreground">Type</th>
                  <th className="h-10 px-4 text-left font-semibold text-foreground">Contract</th>
                  <th className="h-10 px-4 text-left font-semibold text-foreground">Created</th>
                  <th className="h-10 px-4 text-left font-semibold text-foreground">Created By</th>
                </tr>
              </thead>
              <tbody>
                {drivers.length === 0 ? (
                  <tr><td colSpan={6}><Spinner label="No records yet" /></td></tr>
                ) : (
                  drivers.slice(0, 10).map((d, idx) => (
                    <tr
                      key={d.cr6cd_dix_driverid}
                      className={cn(
                        'border-b cursor-pointer transition-all duration-200 hover:bg-primary/5 active:bg-primary/10',
                        idx % 2 === 0 ? 'bg-card' : 'bg-muted/30',
                      )}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{d.cr6cd_dix_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.cr6cd_dix_agentname || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-transform duration-200 hover:scale-105', getActionBadgeClasses(d.cr6cd_dix_actiontype))}>
                          {ACTION_TYPE_LABELS[d.cr6cd_dix_actiontype] || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{d.cr6cd_dix_contracttypename || d.cr6cd_dix_licensenumber || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(d.createdon)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{d.cr6cd_dix_createdbyname}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-1 bg-card border border-border rounded-xl shadow-sm h-full animate-fade-in-up transition-all duration-200 hover:shadow-md" style={{ animationDelay: '280ms' }}>
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">Entries by Terminal — This Month</h2>
          </div>
          <div className="p-6 space-y-3">
            {Object.entries(terminalCounts).length === 0 ? (
              <p className="text-sm text-muted-foreground">No entries this month</p>
            ) : (
              Object.entries(terminalCounts).map(([terminal, count], idx) => (
                <div key={terminal} className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: `${500 + idx * 60}ms` }}>
                  <span className="w-16 text-center shrink-0 font-mono text-xs bg-muted/50 rounded-md px-2 py-0.5 border border-border">
                    {terminal}
                  </span>
                  <div className="flex-1 h-7 bg-muted/30 rounded-md overflow-hidden relative">
                    <div
                      className="h-full bg-[#3B82F6] rounded-md transition-all duration-500 ease-out"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-foreground w-8 text-right tabular-nums">{count}</span>
                </div>
              ))
            )}
            {agents.length > 0 && Object.keys(terminalCounts).length === 0 && (
              agents.slice(0, 3).map((a, idx) => (
                <div key={a.cr6cd_agentsid} className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: `${500 + idx * 60}ms` }}>
                  <span className="w-16 text-center shrink-0 font-mono text-xs bg-muted/50 rounded-md px-2 py-0.5 border border-border">
                    {a.cr6cd_terminal}
                  </span>
                  <div className="flex-1 h-7 bg-muted/30 rounded-md overflow-hidden relative">
                    <div className="h-full bg-[#3B82F6] rounded-md" style={{ width: '0%' }} />
                  </div>
                  <span className="text-sm font-semibold text-foreground w-8 text-right tabular-nums">0</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
