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
}

const EQUIPMENT_ITEMS: { key: TransferItemKey; label: string; icon: React.ElementType }[] = [
  { key: 'security_deposit', label: 'Security Deposit', icon: CreditCard },
  { key: 'eld', label: 'ELD', icon: HardDrive },
  { key: 'dashcam', label: 'DashCam', icon: Camera },
  { key: 'plate', label: 'Plate', icon: FileText },
];

function ItemButton({ icon: Icon, label, active, onChange }: {
  icon: React.ElementType; label: string; active: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!active)}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left',
        active
          ? 'bg-primary/10 border-primary/30 shadow-sm'
          : 'bg-muted/40 dark:bg-muted/20 border-border hover:bg-muted/70 dark:hover:bg-muted/40 hover:border-border/80',
      )}
    >
      <div className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200',
        active ? 'bg-primary/15' : 'bg-background dark:bg-muted/50',
      )}>
        <Icon className={cn('w-4.5 h-4.5 transition-colors duration-200', active ? 'text-primary' : 'text-muted-foreground')} />
      </div>
      <span className={cn('text-sm font-medium transition-colors duration-200', active ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
      <div className={cn(
        'ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200',
        active ? 'border-primary bg-primary' : 'border-muted-foreground/30',
      )}>
        {active && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
    </button>
  );
}

export default function Step4Transfers({
  transferOccAcc, onTransferOccAccChange,
  transferEquipment, onTransferEquipmentChange,
  reactivateEquipment, onReactivateEquipmentChange,
  transferItems, onTransferItemChange,
}: Step4Props) {
  const showTransferItems = transferEquipment || reactivateEquipment;

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
                'flex items-center justify-between py-4 px-5 rounded-xl border transition-all duration-200',
                transferEquipment
                  ? 'bg-primary/5 border-primary/20 shadow-sm'
                  : 'bg-muted/40 dark:bg-muted/20 border-border hover:bg-muted/60 dark:hover:bg-muted/30',
              )}>
                <div className="flex items-center gap-3">
                  <Package className={cn('w-5 h-5 transition-colors duration-200', transferEquipment ? 'text-primary' : 'text-muted-foreground')} />
                  <span className={cn('text-sm font-semibold transition-colors duration-200', transferEquipment ? 'text-foreground' : 'text-muted-foreground')}>Transfer Equipment</span>
                </div>
                <Toggle checked={transferEquipment} onChange={onTransferEquipmentChange} />
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
              'flex items-center justify-between py-4 px-5 rounded-xl border transition-all duration-200',
              reactivateEquipment
                ? 'bg-primary/5 border-primary/20 shadow-sm'
                : 'bg-muted/40 dark:bg-muted/20 border-border hover:bg-muted/60 dark:hover:bg-muted/30',
            )}>
              <div className="flex items-center gap-3">
                <RefreshCw className={cn('w-5 h-5 transition-colors duration-200', reactivateEquipment ? 'text-primary' : 'text-muted-foreground')} />
                <span className={cn('text-sm font-semibold transition-colors duration-200', reactivateEquipment ? 'text-foreground' : 'text-muted-foreground')}>Reactivate Equipment</span>
              </div>
              <Toggle checked={reactivateEquipment} onChange={onReactivateEquipmentChange} />
            </div>
          </div>
        </div>

        <div
          className={cn(
            'grid transition-all duration-300 ease-out',
            showTransferItems ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="overflow-hidden">
            <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <div className="p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 flex-shrink-0">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-foreground">Equipment Items</h4>
                    <p className="text-sm text-muted-foreground mt-1">Select which equipment items to {transferEquipment && reactivateEquipment ? 'transfer or reactivate' : transferEquipment ? 'transfer' : 'reactivate'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {EQUIPMENT_ITEMS.map((item) => (
                    <ItemButton
                      key={item.key}
                      icon={item.icon}
                      label={item.label}
                      active={transferItems[item.key]}
                      onChange={(v) => onTransferItemChange(item.key, v)}
                    />
                  ))}
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
