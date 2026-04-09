import { Link } from 'react-router-dom';
import { Users, FilePenLine, CreditCard, Shield, Plus, ArrowRight } from 'lucide-react';

const templates = [
  {
    title: 'Rider Permit',
    desc: 'Generate rider permit forms for passenger authorization',
    icon: Users,
    color: '#2563EB',
    path: '/documents/rider-permit',
  },
  {
    title: 'Intent of Lease',
    desc: 'Generate intent of lease agreements for driver/vendor/truck',
    icon: FilePenLine,
    color: '#7C3AED',
    path: '/documents/intent-of-lease',
  },
  {
    title: 'IRP Plate Form',
    desc: 'Generate IRP plate registration forms',
    icon: CreditCard,
    color: '#10B981',
    path: '/documents/irp-plate-form',
  },
  {
    title: 'Insurance Form',
    desc: 'Generate insurance enrollment forms with PDI calculation',
    icon: Shield,
    color: '#F59E0B',
    path: '/documents/insurance-form',
  },
];

export default function QuickForms() {
  return (
    <div className="p-6">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Quick Forms</h1>
        <p className="text-muted-foreground mt-1">Generate documents and forms</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {templates.map((t, idx) => {
          const Icon = t.icon;
          return (
            <div
              key={t.title}
              className="group relative bg-card border border-border rounded-xl overflow-hidden shadow-sm animate-fade-in-up transition-all duration-200 ease-out hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 active:scale-[0.98]"
              style={{ animationDelay: `${idx * 70}ms` }}
            >
              <div className="p-6">
                <div className="flex items-start gap-5">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg ring-1 ring-transparent dark:ring-white/10"
                    style={{ backgroundColor: `${t.color}15` }}
                  >
                    <Icon className="w-7 h-7 transition-transform duration-200 group-hover:rotate-3" style={{ color: t.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-1">{t.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{t.desc}</p>
                    <Link
                      to={t.path}
                      className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-9 px-4 py-2 text-white transition-all duration-200 hover:shadow-lg active:scale-95"
                      style={{ backgroundColor: t.color }}
                    >
                      <Plus className="w-4 h-4" />
                      Create New
                      <ArrowRight className="w-4 h-4 opacity-0 -ml-2 transition-all duration-200 group-hover:opacity-100 group-hover:ml-0 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
