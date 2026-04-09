import { Truck, CircleCheck } from 'lucide-react';

export default function Settings() {
  return (
    <div className="p-6">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Application information and configuration</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in-up transition-all duration-200 hover:shadow-md" style={{ animationDelay: '55ms' }}>
          <div className="px-6 py-6 flex items-start gap-5">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-transform duration-200 hover:scale-105">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">DIX — Driver Integration App</h2>
              <p className="text-sm text-muted-foreground mt-1">Enterprise Fleet Management System</p>
            </div>
          </div>
          <div className="px-6 pb-6">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Current Version', value: '4.4' },
                { label: 'Latest Version', value: '4.4' },
              ].map((item, idx) => (
                <div
                  key={item.label}
                  className="p-4 rounded-xl bg-muted/50 text-center animate-fade-in-up transition-all duration-200 hover:bg-muted/80 hover:shadow-sm"
                  style={{ animationDelay: `${160 + idx * 80}ms` }}
                >
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{item.label}</p>
                  <p className="text-xl font-bold text-foreground font-mono">{item.value}</p>
                </div>
              ))}
              <div
                className="p-4 rounded-xl bg-muted/50 text-center animate-fade-in-up transition-all duration-200 hover:bg-muted/80 hover:shadow-sm"
                style={{ animationDelay: '220ms' }}
              >
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Status</p>
                <span className="inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-0.5 text-xs font-medium bg-[#10B981] text-white shadow-sm shadow-emerald-500/20 transition-transform duration-200 hover:scale-105">
                  <CircleCheck className="w-3 h-3" />
                  Up to Date
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
