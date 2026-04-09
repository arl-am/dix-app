import { ArrowRightLeft, Shield, Package, RefreshCw, Compass } from 'lucide-react';
import { cn } from '../../lib/utils';
import Toggle from '../../components/Toggle';

interface Step4Props {
  transferOccAcc: boolean;
  onTransferOccAccChange: (v: boolean) => void;
  transferEquipment: boolean;
  onTransferEquipmentChange: (v: boolean) => void;
  reactivateEquipment: boolean;
  onReactivateEquipmentChange: (v: boolean) => void;
}

function ToggleRow({ icon: Icon, label, checked, onChange, color, iconColor }: {
  icon: React.ElementType; label: string; checked: boolean; onChange: (v: boolean) => void; color: 'emerald' | 'orange'; iconColor: string;
}) {
  return (
    <div className={cn(
      'flex items-center justify-between py-5 px-6 rounded-xl transition-all duration-200',
      checked
        ? cn(color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 shadow-sm' : 'bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 shadow-sm')
        : cn(color === 'emerald' ? 'bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-50/60 dark:bg-emerald-950/40' : 'bg-orange-50/30 dark:bg-orange-950/20 hover:bg-orange-50/60 dark:bg-orange-950/40'),
    )}>
      <div className="flex items-center gap-4">
        <Icon className={cn('w-6 h-6 transition-all duration-200', iconColor, checked && 'scale-110')} />
        <span className="text-base font-semibold text-foreground">{label}</span>
      </div>
      <Toggle checked={checked} onChange={onChange} color={color} />
    </div>
  );
}

export default function Step4Transfers({ transferOccAcc, onTransferOccAccChange, transferEquipment, onTransferEquipmentChange, reactivateEquipment, onReactivateEquipmentChange }: Step4Props) {
  return (
    <div className="flex-1 flex justify-center">
      <div className="w-full max-w-[1000px] space-y-8">
        <div className="text-center mb-2 animate-fade-in">
          <h3 className="text-xl font-semibold text-foreground">Transfers & Reactivation</h3>
          <p className="text-sm text-muted-foreground">Configure transfer and reactivation options for this driver</p>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in-up transition-all duration-200 hover:shadow-md" style={{ animationDelay: '0ms' }}>
          <div className="p-8">
            <div className="flex items-start gap-5 mb-6">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/50 transition-transform duration-200 hover:scale-105">
                <ArrowRightLeft className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground">Transfer from Previous Record</h4>
                <p className="text-sm text-muted-foreground mt-1">Transfer insurance or equipment from a previous driver record</p>
              </div>
            </div>
            <div className="space-y-4">
              <ToggleRow icon={Shield} label="Transfer Occ/Acc Insurance" checked={transferOccAcc} onChange={onTransferOccAccChange} color="emerald" iconColor="text-emerald-500" />
              <ToggleRow icon={Package} label="Transfer Equipment" checked={transferEquipment} onChange={onTransferEquipmentChange} color="emerald" iconColor="text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm animate-fade-in-up transition-all duration-200 hover:shadow-md" style={{ animationDelay: '70ms' }}>
          <div className="p-8">
            <div className="flex items-start gap-5 mb-6">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-orange-100 dark:bg-orange-900/50 transition-transform duration-200 hover:scale-105">
                <RefreshCw className="w-7 h-7 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground">Reactivate Equipment</h4>
                <p className="text-sm text-muted-foreground mt-1">Reactivate previously decommissioned equipment for this driver</p>
              </div>
            </div>
            <ToggleRow icon={RefreshCw} label="Reactivate Equipment" checked={reactivateEquipment} onChange={onReactivateEquipmentChange} color="orange" iconColor="text-orange-500" />
          </div>
        </div>

        <div className="flex items-center gap-4 p-6 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 animate-fade-in-up" style={{ animationDelay: '140ms' }}>
          <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center flex-shrink-0">
            <Compass className="w-6 h-6 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-sky-800 dark:text-sky-200">No transfers or reactivations needed?</p>
            <p className="text-sm text-sky-700 dark:text-sky-300 mt-0.5">Simply click Next to continue to the deductions step.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
