import { Link, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Database,
  CirclePlus,
  CircleX,
  FileText,
} from 'lucide-react';
import { cn } from '../lib/utils';
import dixLogo from '../assets/dix-logo.png';
import { assetUrl } from '../utils/assetUrl';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutGrid },
  { label: 'Search Records', path: '/drivers', icon: Database },
  { label: 'New Entry', path: '/new-driver', icon: CirclePlus },
  { label: 'New Cancellation', path: '/cancellations', icon: CircleX, disabled: true },
  { label: 'Quick Forms', path: '/documents', icon: FileText },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="h-screen sticky top-0 flex flex-col bg-[#1E293B] text-white flex-shrink-0 w-[260px] [&_*]:border-[#283548]">
      <div className="py-5 flex items-center justify-center px-4 border-b">
        <img
          src={assetUrl(dixLogo)}
          alt="DIX"
          className="h-16 w-auto object-contain animate-fade-in"
        />
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item, idx) => {
          const isActive = !item.disabled && location.pathname === item.path;
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <div
                key={item.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg relative cursor-not-allowed opacity-40 select-none"
                style={{ animationDelay: `${idx * 50}ms` }}
                title="Coming Soon"
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium truncate">{item.label}</span>
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-white/70 bg-white/10 px-1.5 py-0.5 rounded">Soon</span>
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg group relative',
                'transition-all duration-200 ease-out',
                'active:scale-[0.97]',
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-white/70 hover:text-white hover:bg-white/8 hover:translate-x-0.5',
              )}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full -ml-2 animate-scale-in" />
              )}
              <Icon className={cn(
                'w-5 h-5 flex-shrink-0 transition-transform duration-200',
                isActive ? 'scale-110' : 'group-hover:scale-110',
              )} />
              <span className="text-sm font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
