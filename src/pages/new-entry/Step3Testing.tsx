import { ClipboardCheck, Shield, Mail } from 'lucide-react';
import { cn } from '../../lib/utils';
import Toggle from '../../components/Toggle';

interface Step3Props {
  elpRequired: boolean;
  onElpChange: (v: boolean) => void;
  hazmat: boolean;
  onHazmatChange: (v: boolean) => void;
  homelandSecurity: boolean;
  onHomelandSecurityChange: (v: boolean) => void;
}

export default function Step3Testing({ elpRequired, onElpChange, hazmat, onHazmatChange, homelandSecurity, onHomelandSecurityChange }: Step3Props) {
  const testCard = (
    icon: React.ElementType,
    title: string,
    desc: string,
    checked: boolean,
    onChange: (v: boolean) => void,
    badgeText: string,
    delay: number,
    disabled?: boolean,
    disabledMessage?: string,
  ) => {
    const Icon = icon;
    return (
      <div
        className={cn(
          'transition-all duration-200 ease-out animate-fade-in-up',
          disabled && !checked && 'opacity-50 pointer-events-none',
        )}
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className={cn(
          'bg-card border rounded-xl shadow-sm transition-all duration-200',
          checked ? 'border-primary/30 shadow-md shadow-primary/5' : 'border-border hover:shadow-md hover:border-border/80',
        )}>
          <div className="p-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4 flex-1">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200',
                  checked ? 'bg-primary/10 scale-105' : 'bg-muted dark:bg-white/[0.08]',
                )}>
                  <Icon className={cn('w-6 h-6 transition-colors duration-200', checked ? 'text-primary' : 'text-muted-foreground')} />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-foreground mb-1.5">{title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md">{desc}</p>
                  {disabled && disabledMessage ? (
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                      <span className="w-3 h-3 rounded-full bg-gray-300 animate-pulse" />
                      <span className="text-sm text-muted-foreground">{disabledMessage}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
                      <Toggle checked={checked} onChange={onChange} />
                      <span className={cn(
                        'text-sm font-medium transition-colors duration-200',
                        checked ? 'text-primary' : 'text-muted-foreground',
                      )}>{checked ? 'Test enabled' : 'Test disabled'}</span>
                    </div>
                  )}
                </div>
              </div>
              <span className={cn(
                'shrink-0 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-all duration-200',
                checked ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted dark:bg-white/[0.08] text-muted-foreground border-border',
              )}>
                {badgeText}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex justify-center">
      <div className="w-full max-w-[1000px] space-y-5">
        <div className="text-center mb-2 animate-fade-in">
          <h3 className="text-xl font-semibold text-foreground">Testing & Compliance</h3>
          <p className="text-sm text-muted-foreground">Configure required tests and compliance checks for this driver</p>
        </div>

        {testCard(ClipboardCheck, 'English Proficiency Test (ELP)',
          'An English proficiency assessment will be emailed to the driver when this record is saved.',
          elpRequired, onElpChange, elpRequired ? 'Required' : 'Not Required', 0)}

        {testCard(Shield, 'Hazmat Endorsement Test',
          'Hazmat and Homeland Security tests will be sent to the driver\'s email when this record is saved.',
          hazmat, (v) => { onHazmatChange(v); if (v) onHomelandSecurityChange(true); if (!v) onHomelandSecurityChange(false); },
          hazmat ? 'Enabled' : 'Not Sent Yet', 80)}

        {testCard(Shield, 'Homeland Security Test',
          'This test is automatically enabled when Hazmat is enabled. It will be sent alongside the Hazmat test.',
          homelandSecurity, onHomelandSecurityChange,
          homelandSecurity ? 'Enabled' : 'Not Sent Yet', 160,
          !hazmat, 'Enable Hazmat to include this test')}

        <div className="flex items-center gap-4 p-5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 animate-fade-in-up" style={{ animationDelay: '170ms' }}>
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Tests are sent automatically when you proceed to the next step. Status updates will appear here and on the Review screen as results come in.
          </p>
        </div>
      </div>
    </div>
  );
}
