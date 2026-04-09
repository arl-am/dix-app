import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ClipboardCheck, Shield, Mail, AlertTriangle, Info,
  Star, Minus, Clock, CheckCircle, XCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Agent } from '../../lib/mockData';
import Toggle from '../../components/Toggle';

export type TestStatus = '' | 'Queued' | 'Sent' | 'Passed' | 'Failed';

interface Step3Props {
  agent: Agent | null;
  elpRequired: boolean;
  onElpChange: (v: boolean) => void;
  hazmat: boolean;
  onHazmatChange: (v: boolean) => void;
  hazmatStatus: TestStatus;
  homelandStatus: TestStatus;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; classes: string; label: string }> = {
  notRequired: {
    icon: Star,
    classes: 'bg-muted/80 dark:bg-muted/50 text-muted-foreground border-border',
    label: 'Not Required',
  },
  notSent: {
    icon: Minus,
    classes: 'bg-muted/80 dark:bg-muted/50 text-muted-foreground border-border',
    label: 'Not Sent Yet',
  },
  Queued: {
    icon: Clock,
    classes: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    label: 'Queued',
  },
  Sent: {
    icon: Mail,
    classes: 'bg-primary/10 text-primary border-primary/20',
    label: 'Sent',
  },
  Passed: {
    icon: CheckCircle,
    classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    label: 'Passed',
  },
  Failed: {
    icon: XCircle,
    classes: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    label: 'Failed',
  },
};

function StatusBadge({ status, required }: { status: TestStatus; required: boolean }) {
  const key = !required ? 'notRequired' : (!status ? 'notSent' : status);
  const cfg = STATUS_CONFIG[key];
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium', cfg.classes)}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

export default function Step3Testing({ agent, elpRequired, onElpChange, hazmat, onHazmatChange, hazmatStatus, homelandStatus }: Step3Props) {
  const [showElpConfirm, setShowElpConfirm] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);

  const hazmatRequired = agent?.cr6cd_hazmatrequired ?? false;

  const handleElpToggle = (v: boolean) => {
    if (!v) setShowElpConfirm(true);
    else onElpChange(true);
  };

  const closeModal = () => {
    setModalClosing(true);
  };

  useEffect(() => {
    if (modalClosing) {
      const t = setTimeout(() => { setShowElpConfirm(false); setModalClosing(false); }, 200);
      return () => clearTimeout(t);
    }
  }, [modalClosing]);

  const testCard = (
    icon: React.ElementType,
    title: string,
    desc: string,
    checked: boolean,
    onChange: ((v: boolean) => void) | null,
    badge: React.ReactNode,
    delay: number,
    footer?: React.ReactNode,
  ) => {
    const Icon = icon;
    return (
      <div className="animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
        <div className={cn(
          'bg-card border rounded-xl shadow-sm transition-all duration-200',
          checked ? 'border-primary/30 shadow-md shadow-primary/5' : 'border-border hover:shadow-md hover:border-border/80',
        )}>
          <div className="p-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4 flex-1">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200',
                  checked ? 'bg-primary/10 scale-105' : 'bg-muted/80 dark:bg-muted/50',
                )}>
                  <Icon className={cn('w-6 h-6 transition-colors duration-200', checked ? 'text-primary' : 'text-muted-foreground')} />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-semibold text-foreground mb-1.5">{title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md">{desc}</p>
                  {onChange ? (
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
                      <Toggle checked={checked} onChange={onChange} />
                      <span className={cn('text-sm font-medium transition-colors duration-200', checked ? 'text-primary' : 'text-muted-foreground')}>
                        {checked ? 'Test enabled' : 'Test disabled'}
                      </span>
                    </div>
                  ) : footer ? (
                    <div className="mt-4 pt-3 border-t border-border">{footer}</div>
                  ) : null}
                </div>
              </div>
              {badge}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const disabledCard = (icon: React.ElementType, title: string, delay: number) => {
    const Icon = icon;
    return (
      <div className="animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
        <div className="bg-card border border-border rounded-xl shadow-sm opacity-50">
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-muted/80 dark:bg-muted/50 flex-shrink-0">
              <Icon className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold text-foreground">{title}</h4>
              <p className="text-sm text-muted-foreground mt-1">Not required for this terminal</p>
            </div>
            <StatusBadge status="" required={false} />
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

        {testCard(
          ClipboardCheck,
          'English Proficiency Test (ELP)',
          'An English proficiency assessment will be emailed to the driver when this record is saved.',
          elpRequired,
          handleElpToggle,
          <StatusBadge status={elpRequired ? '' : ''} required={true} />,
          0,
        )}

        {!hazmatRequired ? disabledCard(Shield, 'Hazmat Endorsement Test', 80) : testCard(
          Shield,
          'Hazmat Endorsement Test',
          'Hazmat and Homeland Security tests will be sent to the driver\'s email when this record is saved.',
          hazmat,
          onHazmatChange,
          <StatusBadge status={hazmatStatus} required={true} />,
          80,
        )}

        {!hazmatRequired ? disabledCard(Shield, 'Homeland Security Test', 160) : testCard(
          Shield,
          'Homeland Security Test',
          'This test is automatically enabled when Hazmat is enabled. It will be sent alongside the Hazmat test.',
          hazmat,
          null,
          <StatusBadge status={homelandStatus} required={true} />,
          160,
          <div className="flex items-center gap-2">
            <span className={cn('w-2.5 h-2.5 rounded-full transition-colors duration-200', hazmat ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30')} />
            <span className={cn('text-sm font-medium transition-colors duration-200', hazmat ? 'text-primary' : 'text-muted-foreground')}>
              {hazmat ? 'Linked to Hazmat — enabled' : 'Enable Hazmat to include this test'}
            </span>
          </div>,
        )}

        <div className="animate-fade-in-up" style={{ animationDelay: '240ms' }}>
          <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 flex-shrink-0">
                <Info className="w-4.5 h-4.5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tests are sent automatically when you proceed to the next step. Status updates will appear here and on the Review screen as results come in.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showElpConfirm && createPortal(
        <div
          className={cn(
            'fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-200',
            modalClosing ? 'opacity-0' : 'opacity-100',
          )}
        >
          <div
            className={cn(
              'absolute inset-0 backdrop-blur-md transition-all duration-200',
              modalClosing ? 'bg-transparent' : 'bg-white/10 dark:bg-black/10',
            )}
            onClick={closeModal}
          />
          <div
            className={cn(
              'relative w-full max-w-md mx-4 bg-card border border-border/80 rounded-2xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-200',
              modalClosing
                ? 'opacity-0 scale-95 translate-y-2'
                : 'opacity-100 scale-100 translate-y-0 animate-fade-in-up',
            )}
          >
            <div className="px-6 py-5 flex items-center gap-3 border-b border-border">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-500/10 flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Disable ELP Test?</h3>
                <p className="text-sm text-muted-foreground">This action requires acknowledgment</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-foreground leading-relaxed">
                The English Language Proficiency (ELP) test is <span className="font-semibold">mandatory for all drivers</span>. By disabling this test, you acknowledge that:
              </p>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  You are personally responsible for confirming this driver does not require an ELP test.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  You have obtained management approval, if necessary, to waive this requirement.
                </li>
              </ul>
            </div>
            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 bg-muted/30">
              <button
                onClick={closeModal}
                className="inline-flex items-center justify-center rounded-lg text-sm font-medium h-9 px-4 py-2 border border-input bg-background shadow-sm transition-all duration-200 hover:bg-accent active:scale-95"
              >
                Keep Enabled
              </button>
              <button
                onClick={() => { onElpChange(false); closeModal(); }}
                className="inline-flex items-center justify-center rounded-lg text-sm font-medium h-9 px-4 py-2 bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 transition-all duration-200 hover:bg-orange-500/20 active:scale-95"
              >
                I Understand, Disable ELP
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
