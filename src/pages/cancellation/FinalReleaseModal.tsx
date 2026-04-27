import { useEffect, useMemo, useState } from 'react';
import { Truck, ShieldX, FileSignature, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '../../components/Modal';
import DatePicker from '../../components/DatePicker';
import { cn, formatDate } from '../../lib/utils';
import { tentativeReleaseDate } from '../../lib/cancellationConstants';
import { useSaveFinalRelease } from '../../hooks/useCancellationMutation';
import type { Cancellation } from '../../lib/mockData';

interface Props {
  cancellation: Cancellation | null;
  onClose: () => void;
}

interface Form {
  lastitemreceived: string;
  forfeit: boolean;
  elddeposit: string;
  dashcamdeposit: string;
  pdideposit: string;
  notes: string;
  requestreturnlabel: boolean;
  rltrackingnumber: string;
  returnlabelurl: string;
}

export default function FinalReleaseModal({ cancellation, onClose }: Props) {
  const isOpen = cancellation != null;
  const saveFinalRelease = useSaveFinalRelease();

  const initial: Form = useMemo(() => ({
    lastitemreceived: cancellation?.cr6cd_dix_lastitemreceived || '',
    forfeit: !!cancellation?.cr6cd_dix_forfeit,
    elddeposit: cancellation?.cr6cd_dix_elddeposit != null ? String(cancellation.cr6cd_dix_elddeposit) : '',
    dashcamdeposit: cancellation?.cr6cd_dix_dashcamdeposit != null ? String(cancellation.cr6cd_dix_dashcamdeposit) : '',
    pdideposit: cancellation?.cr6cd_dix_pdideposit != null ? String(cancellation.cr6cd_dix_pdideposit) : '',
    notes: cancellation?.cr6cd_dix_notes || '',
    requestreturnlabel: !!cancellation?.cr6cd_dix_requestreturnlabel,
    rltrackingnumber: cancellation?.cr6cd_dix_rltrackingnumber || '',
    returnlabelurl: cancellation?.cr6cd_dix_returnlabelurl || '',
  }), [cancellation]);

  const [form, setForm] = useState<Form>(initial);
  useEffect(() => { setForm(initial); }, [initial]);

  const tentative = tentativeReleaseDate(form.lastitemreceived);

  const update = <K extends keyof Form>(field: K, value: Form[K]) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = () => {
    if (!cancellation) return;
    saveFinalRelease.mutate(
      {
        cancellationId: cancellation.cr6cd_dix_cancellationid,
        lastitemreceived: form.lastitemreceived || undefined,
        allitemsrcvddate: form.lastitemreceived || undefined,
        forfeit: form.forfeit,
        elddeposit: form.elddeposit ? parseFloat(form.elddeposit) : undefined,
        dashcamdeposit: form.dashcamdeposit ? parseFloat(form.dashcamdeposit) : undefined,
        pdideposit: form.pdideposit ? parseFloat(form.pdideposit) : undefined,
        notes: form.notes || undefined,
        requestreturnlabel: form.requestreturnlabel,
        rltrackingnumber: form.rltrackingnumber || undefined,
        returnlabelurl: form.returnlabelurl || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Final release saved');
          onClose();
        },
        onError: (e) => toast.error('Save failed: ' + (e instanceof Error ? e.message : String(e))),
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} widthClassName="w-[min(720px,94vw)]">
      {cancellation && (
        <>
          <div className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileSignature className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground tracking-tight">Final Release</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Capture deposits, forfeit status, and last-item-received date for {cancellation.cr6cd_dix_name}.
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Return Label</h3>
              <label className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-200',
                form.requestreturnlabel ? 'bg-primary/10 border-primary/30' : 'bg-card border-border hover:border-muted-foreground/40',
              )}>
                <input
                  type="checkbox"
                  checked={form.requestreturnlabel}
                  onChange={(e) => update('requestreturnlabel', e.target.checked)}
                  className="accent-primary w-4 h-4"
                />
                <span className={cn('text-sm font-medium', form.requestreturnlabel ? 'text-primary' : 'text-muted-foreground')}>
                  Request a return label for the driver
                </span>
              </label>
              {form.requestreturnlabel && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in-down">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Tracking Number</label>
                    <input
                      type="text"
                      value={form.rltrackingnumber}
                      onChange={(e) => update('rltrackingnumber', e.target.value)}
                      placeholder="e.g. 8706 5380 0618"
                      className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Label URL</label>
                    <input
                      type="text"
                      value={form.returnlabelurl}
                      onChange={(e) => update('returnlabelurl', e.target.value)}
                      placeholder="SharePoint or share link"
                      className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-4">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Release Details</h3>
              <label className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-200',
                form.forfeit ? 'bg-destructive/10 border-destructive/30' : 'bg-card border-border hover:border-muted-foreground/40',
              )}>
                <input
                  type="checkbox"
                  checked={form.forfeit}
                  onChange={(e) => update('forfeit', e.target.checked)}
                  className="accent-destructive w-4 h-4"
                />
                <ShieldX className={cn('w-4 h-4', form.forfeit ? 'text-destructive' : 'text-muted-foreground')} />
                <div className="flex-1">
                  <span className={cn('text-sm font-semibold', form.forfeit ? 'text-destructive' : 'text-foreground')}>Forfeit</span>
                  <p className="text-[11px] text-muted-foreground">Forfeits all deposits</p>
                </div>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(['elddeposit', 'dashcamdeposit', 'pdideposit'] as const).map((k) => {
                  const labels: Record<typeof k, string> = {
                    elddeposit: 'ELD Deposit',
                    dashcamdeposit: 'DashCam Deposit',
                    pdideposit: 'PDI Deposit',
                  } as Record<typeof k, string>;
                  return (
                    <div key={k} className="space-y-1">
                      <label className="text-xs text-muted-foreground">{labels[k]} ($)</label>
                      <input
                        type="number"
                        value={form[k]}
                        onChange={(e) => update(k, e.target.value)}
                        placeholder="0.00"
                        className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Last Item Received
                  </label>
                  <DatePicker
                    value={form.lastitemreceived}
                    onChange={(v) => update('lastitemreceived', v)}
                    placeholder="Pick a date"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Truck className="w-3 h-3" /> Tentative Release
                  </label>
                  <div className="h-9 rounded-lg border border-dashed border-input bg-muted/30 px-3 flex items-center text-sm text-muted-foreground">
                    {tentative ? `${formatDate(tentative)} (Last Item + 45 days)` : 'Pick "Last Item Received"'}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Corporate Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  placeholder="Internal notes for ops/billing..."
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-input bg-background h-9 px-4 hover:bg-accent transition-all duration-200 active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saveFinalRelease.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium h-9 px-5 bg-[#2563EB] text-white hover:bg-[#1D4ED8] hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saveFinalRelease.isPending ? 'Saving…' : 'Save Final Release'}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
