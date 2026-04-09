import { ArrowRightLeft, Shield, Package, RefreshCw, Info, CreditCard, HardDrive, Camera, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import Toggle from '../../components/Toggle';

export type TransferItemKey = 'security_deposit' | 'eld' | 'dashcam' | 'plate';

interface Step4Props {
  transferOccAcc: boolean;
  onTransferOccAccChange: (v: boolean) => void;
  transferEquipment: boolean;
  onTransferEquipmentChange: (v: boolean) => void;
  reactivateEquipment: boolean;
  onReactivateEquipmentChange: (v: boolean) => void;
  transferItems: Record<TransferItemKey, boolean>;
  onTransferItemChange: (key: TransferItemKey, v: boolean) => void;
  reactivateItems: Record<TransferItemKey, boolean>;
  onReactivateItemChange: (key: TransferItemKey, v: boolean) => void;
}

const EQUIPMENT_ITEMS: { key: TransferItemKey; label: string; icon: React.ElementType }[] = [
  { key: 'security_deposit', label: 'Security Deposit', icon: CreditCard },
  { key: 'eld', label: 'ELD', icon: HardDrive },
  { key: 'dashcam', label: 'DashCam', icon: Camera },
  { key: 'plate', label: 'Plate', icon: FileText },
];

function EquipmentToggles({ items, onItemChange, color }: {
  items: Record<TransferItemKey, boolean>;
  onItemChange: (key: TransferItemKey, v: boolean) => void;
  color: 'emerald' | 'purple';
}) {
  const colorMap = {
    emerald: {
      activeBg: 'bg-emerald-500/10',
      activeBorder: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-500',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      trackActive: 'bg-emerald-500',
    },
    purple: {
      activeBg: 'bg-purple-500/10',
      activeBorder: 'border-purple-500/30',
      iconBg: 'bg-purple-500/15',
      iconColor: 'text-purple-500',
      textColor: 'text-purple-700 dark:text-purple-400',
      trackActive: 'bg-purple-500',
    },
  };
  const c = colorMap[color];

  return (
    <div className="grid grid-cols-2 gap-2.5 mt-3">
      {EQUIPMENT_ITEMS.map(({ key, label, icon: Icon }) => {
        const active = items[key];
        return (
          <button
            key={key}
            onClick={() => onItemChange(key, !active)}
            className={cn(
              'flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border transition-all duration-200 text-left',
              active
                ? `${c.activeBg} ${c.activeBorder} shadow-sm`
                : 'bg-muted/30 dark:bg-muted/15 border-border hover:bg-muted/60 dark:hover:bg-muted/30',
            )}
          >
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200',
              active ? c.iconBg : 'bg-background dark:bg-muted/50',
            )}>
              <Icon className={cn('w-4 h-4 transition-colors duration-200', active ? c.iconColor : 'text-muted-foreground')} />
            </div>
            <span className={cn('text-sm font-medium transition-colors duration-200 flex-1', active ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
            <div className={cn(
              'w-8 h-[18px] rounded-full transition-all duration-200 flex items-center px-0.5 flex-shrink-0',
              active ? c.trackActive : 'bg-muted-foreground/20',
            )}>
              <div className={cn(
                'w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all duration-200',
                active ? 'translate-x-[14px]' : 'translate-x-0',
              )} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default function Step4Transfers({
  transferOccAcc, onTransferOccAccChange,
  transferEquipment, onTransferEquipmentChange,
  reactivateEquipment, onReactivateEquipmentChange,
  transferItems, onTransferItemChange,
  reactivateItems, onReactivateItemChange,
}: Step4Props) {
  return (
    <div className="flex-1 flex justify-center">
      <div className="w-full max-w-[1000px] space-y-6">
        <div className="text-center mb-2 animate-fade-in">
          <h3 className="text-xl font-semibold text-foreground">Transfers & Reactivation</h3>
          <p className="text-sm text-muted-foreground">Configure transfer and reactivation options for this driver</p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in-up transition-all duration-200 hover:shadow-md">
          <div className="p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 flex-shrink-0">
                <ArrowRightLeft className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground">Transfer from Previous Record</h4>
                <p className="text-sm text-muted-foreground mt-1">Transfer insurance or equipment from a previous driver record</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className={cn(
                'flex items-center justify-between py-4 px-5 rounded-xl border transition-all duration-200',
                transferOccAcc
                  ? 'bg-primary/5 border-primary/20 shadow-sm'
                  : 'bg-muted/40 dark:bg-muted/20 border-border hover:bg-muted/60 dark:hover:bg-muted/30',
              )}>
                <div className="flex items-center gap-3">
                  <Shield className={cn('w-5 h-5 transition-colors duration-200', transferOccAcc ? 'text-primary' : 'text-muted-foreground')} />
                  <span className={cn('text-sm font-semibold transition-colors duration-200', transferOccAcc ? 'text-foreground' : 'text-muted-foreground')}>Transfer Occ/Acc Insurance</span>
                </div>
                <Toggle checked={transferOccAcc} onChange={onTransferOccAccChange} />
              </div>

              <div className={cn(
                'rounded-xl border transition-all duration-200',
                transferEquipment
                  ? 'bg-primary/5 border-primary/20 shadow-sm'
                  : 'bg-muted/40 dark:bg-muted/20 border-border hover:bg-muted/60 dark:hover:bg-muted/30',
              )}>
                <div className="flex items-center justify-between py-4 px-5">
                  <div className="flex items-center gap-3">
                    <Package className={cn('w-5 h-5 transition-colors duration-200', transferEquipment ? 'text-primary' : 'text-muted-foreground')} />
                    <span className={cn('text-sm font-semibold transition-colors duration-200', transferEquipment ? 'text-foreground' : 'text-muted-foreground')}>Transfer Equipment</span>
                  </div>
                  <Toggle checked={transferEquipment} onChange={onTransferEquipmentChange} />
                </div>
                <div className={cn(
                  'grid transition-all duration-300 ease-out',
                  transferEquipment ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                )}>
                  <div className="overflow-hidden">
                    <div className="px-5 pb-4 border-t border-emerald-500/15">
                      <EquipmentToggles items={transferItems} onItemChange={onTransferItemChange} color="emerald" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in-up transition-all duration-200 hover:shadow-md" style={{ animationDelay: '70ms' }}>
          <div className="p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-500/10 flex-shrink-0">
                <RefreshCw className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground">Reactivate Equipment</h4>
                <p className="text-sm text-muted-foreground mt-1">Reactivate previously decommissioned equipment for this driver</p>
              </div>
            </div>
            <div className={cn(
              'rounded-xl border transition-all duration-200',
              reactivateEquipment
                ? 'bg-primary/5 border-primary/20 shadow-sm'
                : 'bg-muted/40 dark:bg-muted/20 border-border hover:bg-muted/60 dark:hover:bg-muted/30',
            )}>
              <div className="flex items-center justify-between py-4 px-5">
                <div className="flex items-center gap-3">
                  <RefreshCw className={cn('w-5 h-5 transition-colors duration-200', reactivateEquipment ? 'text-primary' : 'text-muted-foreground')} />
                  <span className={cn('text-sm font-semibold transition-colors duration-200', reactivateEquipment ? 'text-foreground' : 'text-muted-foreground')}>Reactivate Equipment</span>
                </div>
                <Toggle checked={reactivateEquipment} onChange={onReactivateEquipmentChange} />
              </div>
              <div className={cn(
                'grid transition-all duration-300 ease-out',
                reactivateEquipment ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
              )}>
                <div className="overflow-hidden">
                  <div className="px-5 pb-4 border-t border-purple-500/15">
                    <EquipmentToggles items={reactivateItems} onItemChange={onReactivateItemChange} color="purple" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: '140ms' }}>
          <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 flex-shrink-0">
                <Info className="w-4.5 h-4.5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No transfers or reactivations needed? Simply click Next to continue to the deductions step.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
