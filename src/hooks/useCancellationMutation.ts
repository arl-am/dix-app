import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isLocal } from '../lib/utils';
import {
  EQUIPMENT_CATALOG,
  defaultLifecycleForType,
  defaultDueDate,
} from '../lib/cancellationConstants';
import type { CxlEquipment } from '../lib/mockData';

function strip(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== ''));
}

async function getDV() {
  const { getClient } = await import('@microsoft/power-apps/data');
  const { dataSourcesInfo } = await import('../../.power/schemas/appschemas/dataSourcesInfo');
  return getClient(dataSourcesInfo);
}

// ─────────────────────── Step 1 ───────────────────────
export interface SaveSubmitInput {
  cancellationId?: string;
  agentId: string;
  canceltype: number;
  cancelreason: number;
  reasondetails: string;
  unitnumber: string;
  vendorcode: string;
  vendorname: string;
  drivercode: string;
  drivername: string;
  driverphone: string;
  trailercode: string;
  startdate: string;
  canceldate: string;
  submittedby: string;
}

export interface SaveSubmitResult { cancellationId: string }

async function saveSubmit(input: SaveSubmitInput): Promise<SaveSubmitResult> {
  const primaryName = input.unitnumber || input.drivername || input.vendorname || 'Cancellation';

  const fields: Record<string, unknown> = {
    cr6cd_dix_name: primaryName,
    cr6cd_dix_canceltype: input.canceltype,
    cr6cd_dix_cancelreason: input.cancelreason,
    cr6cd_dix_reasondetails: input.reasondetails || undefined,
    cr6cd_dix_unitnumber: input.unitnumber || undefined,
    cr6cd_dix_vendorcode: input.vendorcode || undefined,
    cr6cd_dix_vendorname: input.vendorname || undefined,
    cr6cd_dix_drivercode: input.drivercode || undefined,
    cr6cd_dix_drivername: input.drivername || undefined,
    cr6cd_dix_driverphone: input.driverphone || undefined,
    cr6cd_dix_trailercode: input.trailercode || undefined,
    cr6cd_dix_startdate: input.startdate || undefined,
    cr6cd_dix_canceldate: input.canceldate || undefined,
    cr6cd_dix_duedate: defaultDueDate(input.canceldate) || undefined,
    cr6cd_dix_submittedby: input.submittedby || undefined,
    cr6cd_dix_requestdate: input.canceldate || new Date().toISOString().slice(0, 10),
    cr6cd_dix_status: 100000000,
  };
  if (input.agentId) {
    fields['cr6cd_dix_cancagent@odata.bind'] = `/cr6cd_agentses(${input.agentId})`;
  }
  const payload = strip(fields);

  if (isLocal) {
    const id = input.cancellationId || crypto.randomUUID();
    console.log('[mock] saveSubmit →', id, payload);
    return { cancellationId: id };
  }

  const client = await getDV();
  if (input.cancellationId) {
    await client.updateRecordAsync('cr6cd_dix_cancellations', input.cancellationId, payload);
    return { cancellationId: input.cancellationId };
  }
  const result: any = await client.createRecordAsync('cr6cd_dix_cancellations', payload);
  const id = result.data?.cr6cd_dix_cancellationid || result.cr6cd_dix_cancellationid;
  return { cancellationId: id };
}

export function useSaveSubmit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveSubmit,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cancellations'] }),
  });
}

// ─────────────────────── Step 2: seed equipment ───────────────────────
export interface SeedEquipmentInput {
  cancellationId: string;
  canceltype: number;
}

async function seedEquipment(input: SeedEquipmentInput): Promise<void> {
  if (isLocal) {
    console.log('[mock] seedEquipment →', input);
    return;
  }
  const client = await getDV();
  const existing: any = await client.retrieveMultipleRecordsAsync('cr6cd_dixcxlequipments', {
    select: ['cr6cd_dixcxlequipmentid'],
    filter: `_cr6cd_equipmentcancellation_value eq ${input.cancellationId}`,
    top: 50,
  });
  if ((existing.data || []).length > 0) return;

  for (const item of EQUIPMENT_CATALOG) {
    const lifecycle = defaultLifecycleForType(item.category, input.canceltype);
    await client.createRecordAsync('cr6cd_dixcxlequipments', {
      cr6cd_name: `${item.displayName}`,
      cr6cd_equipmentkey: item.key,
      cr6cd_displayname: item.displayName,
      cr6cd_lifecyclestate: lifecycle,
      'cr6cd_equipmentcancellation@odata.bind': `/cr6cd_dix_cancellations(${input.cancellationId})`,
    });
  }
}

export function useSeedEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: seedEquipment,
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['cxl-equipment', vars.cancellationId] }),
  });
}

// ─────────────────────── Step 3: update equipment row ───────────────────────
export interface UpdateEquipmentInput {
  cancellationId: string;
  equipmentId: string;
  lifecycleState?: number;
  returneddate?: string | null;
  notes?: string;
  istransferred?: boolean;
  isreactivated?: boolean;
}

async function updateEquipment(input: UpdateEquipmentInput): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (input.lifecycleState !== undefined) payload.cr6cd_lifecyclestate = input.lifecycleState;
  if (input.returneddate !== undefined)   payload.cr6cd_returneddate = input.returneddate || null;
  if (input.notes !== undefined)          payload.cr6cd_notes = input.notes;
  if (input.istransferred !== undefined)  payload.cr6cd_istransferred = input.istransferred;
  if (input.isreactivated !== undefined)  payload.cr6cd_isreactivated = input.isreactivated;
  if (Object.keys(payload).length === 0) return;
  if (isLocal) {
    console.log('[mock] updateEquipment →', input.equipmentId, payload);
    return;
  }
  const client = await getDV();
  await client.updateRecordAsync('cr6cd_dixcxlequipments', input.equipmentId, payload);
}

export function useUpdateEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateEquipment,
    onMutate: async (input) => {
      const queryKey = ['cxl-equipment', input.cancellationId];
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<CxlEquipment[]>(queryKey);
      qc.setQueryData<CxlEquipment[]>(queryKey, (old) => {
        if (!old) return old;
        return old.map((e) => {
          if (e.cr6cd_dixcxlequipmentid !== input.equipmentId) return e;
          const next = { ...e };
          if (input.lifecycleState !== undefined) next.cr6cd_lifecyclestate = input.lifecycleState;
          if (input.returneddate !== undefined)   next.cr6cd_returneddate = input.returneddate || undefined;
          if (input.notes !== undefined)          next.cr6cd_notes = input.notes;
          if (input.istransferred !== undefined)  next.cr6cd_istransferred = input.istransferred;
          if (input.isreactivated !== undefined)  next.cr6cd_isreactivated = input.isreactivated;
          return next;
        });
      });
      return { previous, queryKey };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous && ctx?.queryKey) qc.setQueryData(ctx.queryKey, ctx.previous);
    },
    onSettled: (_data, _err, vars) =>
      qc.invalidateQueries({ queryKey: ['cxl-equipment', vars.cancellationId] }),
  });
}

// ─────────────────────── Step 2: conditional intake fields ───────────────────────
export interface SaveIntakeExtrasInput {
  cancellationId: string;
  transferredtounit?: string;
  prepassnumber?: string;
  rfidnumber?: string;
  platenumber?: string;
  fleetnumber?: string;
  logsfromdate?: string;
  logstodate?: string;
}

async function saveIntakeExtras(input: SaveIntakeExtrasInput): Promise<void> {
  const payload = strip({
    cr6cd_dix_transferredtounit: input.transferredtounit,
    cr6cd_dix_prepassnumber: input.prepassnumber,
    cr6cd_dix_rfidnumber: input.rfidnumber,
    cr6cd_dix_platenumber: input.platenumber,
    cr6cd_dix_fleetnumber: input.fleetnumber,
    cr6cd_dix_logsfromdate: input.logsfromdate,
    cr6cd_dix_logstodate: input.logstodate,
  });
  if (isLocal) { console.log('[mock] saveIntakeExtras →', input.cancellationId, payload); return; }
  const client = await getDV();
  await client.updateRecordAsync('cr6cd_dix_cancellations', input.cancellationId, payload);
}

export function useSaveIntakeExtras() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveIntakeExtras,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cancellations'] }),
  });
}

// ─────────────────────── Step 3: bypass agent address ───────────────────────
export interface SaveBypassInput {
  cancellationId: string;
  bypass: boolean;
}

async function saveBypass(input: SaveBypassInput): Promise<void> {
  if (isLocal) { console.log('[mock] saveBypass →', input); return; }
  const client = await getDV();
  await client.updateRecordAsync('cr6cd_dix_cancellations', input.cancellationId, {
    cr6cd_dix_bypassagentaddress: input.bypass,
  });
}

export function useSaveBypass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveBypass,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cancellations'] }),
  });
}

// ─────────────────────── Step 4: final release ───────────────────────
export interface SaveFinalReleaseInput {
  cancellationId: string;
  lastitemreceived?: string;
  allitemsrcvddate?: string;
  forfeit: boolean;
  elddeposit?: number;
  dashcamdeposit?: number;
  pdideposit?: number;
  notes?: string;
  requestreturnlabel: boolean;
  rltrackingnumber?: string;
  returnlabelurl?: string;
}

async function saveFinalRelease(input: SaveFinalReleaseInput): Promise<void> {
  const payload = strip({
    cr6cd_dix_lastitemreceived: input.lastitemreceived,
    cr6cd_dix_allitemsrcvddate: input.allitemsrcvddate,
    cr6cd_dix_forfeit: input.forfeit,
    cr6cd_dix_elddeposit: input.elddeposit,
    cr6cd_dix_dashcamdeposit: input.dashcamdeposit,
    cr6cd_dix_pdideposit: input.pdideposit,
    cr6cd_dix_notes: input.notes,
    cr6cd_dix_requestreturnlabel: input.requestreturnlabel,
    cr6cd_dix_rltrackingnumber: input.rltrackingnumber,
    cr6cd_dix_returnlabelurl: input.returnlabelurl,
  });
  if (isLocal) {
    console.log('[mock] saveFinalRelease →', input.cancellationId, payload);
    return;
  }
  const client = await getDV();
  await client.updateRecordAsync('cr6cd_dix_cancellations', input.cancellationId, payload);
}

export function useSaveFinalRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveFinalRelease,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cancellations'] }),
  });
}

// ─────────────────────── Status pipeline transitions ───────────────────────
export interface SetStatusInput { cancellationId: string; status: number }

async function setStatus(input: SetStatusInput): Promise<void> {
  if (isLocal) {
    console.log('[mock] setStatus →', input);
    return;
  }
  const client = await getDV();
  await client.updateRecordAsync('cr6cd_dix_cancellations', input.cancellationId, {
    cr6cd_dix_status: input.status,
  });
}

export function useSetStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: setStatus,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cancellations'] }),
  });
}

// ─────────────────────── Delete ───────────────────────
async function deleteCancellation(id: string): Promise<void> {
  if (isLocal) { console.log('[mock] deleteCancellation →', id); return; }
  const client = await getDV();
  await client.deleteRecordAsync('cr6cd_dix_cancellations', id);
}

export function useDeleteCancellation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCancellation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cancellations'] }),
  });
}
