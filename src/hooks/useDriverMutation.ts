import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isLocal } from '../lib/utils';
import type { TransferItemKey } from '../pages/new-entry/Step4Transfers';

const ACTION_TYPE_MAP: Record<string, number> = {
  new: 100000000,
  move: 100000001,
};

function strip(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

export interface SaveDetailsInput {
  driverId?: string;
  vendorId?: string;
  unitId?: string;
  selectedAgent: string;
  actionType: string;
  contractType: number | null;
  startDate: string;
  form: Record<string, string>;
}

export interface SaveDetailsResult {
  driverId: string;
  vendorId?: string;
  unitId?: string;
}

async function saveDetails(input: SaveDetailsInput): Promise<SaveDetailsResult> {
  const f = input.form;

  const driverFields: Record<string, unknown> = {
    cr6cd_dix_name: `${f.firstName || ''} ${f.lastName || ''}`.trim() || 'Unnamed',
    cr6cd_dix_email: f.email || undefined,
    cr6cd_dix_phonenumber: f.phone || undefined,
    cr6cd_dix_ssn: f.ssn || undefined,
    cr6cd_dix_drivercode: f.driverCode || undefined,
    cr6cd_dix_licensenumber: f.licenseNumber || undefined,
    cr6cd_dix_licensestate: f.licenseState || undefined,
    cr6cd_dix_licenseexpdate: f.licenseExpDate || undefined,
    cr6cd_dix_streetaddress: f.streetAddress || undefined,
    cr6cd_dix_city: f.city || undefined,
    cr6cd_dix_state: f.state || undefined,
    cr6cd_dix_zipcode: f.zipCode || undefined,
    cr6cd_dix_fuelcardnumber: f.fuelCardNumber || undefined,
    cr6cd_dix_onboardingdate: input.startDate || undefined,
    cr6cd_dix_contracttype: input.contractType ?? undefined,
    cr6cd_dix_actiontype: ACTION_TYPE_MAP[input.actionType] ?? undefined,
    cr6cd_dix_isactive: true,
  };

  if (input.selectedAgent) {
    driverFields['cr6cd_dix_agent@odata.bind'] = `/cr6cd_agentses(${input.selectedAgent})`;
  }

  const driverPayload = strip(driverFields);

  const hasVendor = f.businessName || f.vendorCode || f.einNumber;
  const vendorPayload = hasVendor
    ? strip({
        cr6cd_dix_name: f.businessName || f.vendorCode || 'Vendor',
        cr6cd_dix_businessname: f.businessName || undefined,
        cr6cd_dix_vendorcode: f.vendorCode || undefined,
        cr6cd_dix_einnumber: f.einNumber || undefined,
        cr6cd_dix_phonenumber: f.vendorPhone || undefined,
        cr6cd_dix_streetaddress: f.vendorAddress || undefined,
        cr6cd_dix_city: f.vendorCity || undefined,
        cr6cd_dix_state: f.vendorState || undefined,
        cr6cd_dix_zipcode: f.vendorZipCode || undefined,
      })
    : null;

  const hasUnit = f.unitNumber || f.vin || f.make;
  const unitPayload = hasUnit
    ? strip({
        cr6cd_dix_name: f.unitNumber || f.vin || 'Unit',
        cr6cd_dix_unitnumber: f.unitNumber || undefined,
        cr6cd_dix_year: f.year ? parseInt(f.year, 10) : undefined,
        cr6cd_dix_make: f.make || undefined,
        cr6cd_dix_model: f.model || undefined,
        cr6cd_dix_vin: f.vin || undefined,
        cr6cd_dix_color: f.color || undefined,
        cr6cd_dix_truckvalue: f.truckValue ? parseFloat(f.truckValue) : undefined,
        cr6cd_dix_unladenweight: f.unladenWeight ? parseFloat(f.unladenWeight) : undefined,
        cr6cd_dix_purchasedate: f.purchaseDate || undefined,
      })
    : null;

  if (isLocal) {
    const mockDriverId = input.driverId || crypto.randomUUID();
    const mockVendorId = vendorPayload ? (input.vendorId || crypto.randomUUID()) : undefined;
    const mockUnitId = unitPayload ? (input.unitId || crypto.randomUUID()) : undefined;
    console.log('[mock] saveDetails →', { driverId: mockDriverId, driverPayload, vendorPayload, unitPayload });
    return { driverId: mockDriverId, vendorId: mockVendorId, unitId: mockUnitId };
  }

  const { Cr6cd_dix_driversService } = await import('../generated');
  const { Cr6cd_dix_vendorsService } = await import('../generated');
  const { Cr6cd_dix_unitsService } = await import('../generated');

  let vendorId = input.vendorId;
  if (vendorPayload) {
    if (vendorId) {
      await Cr6cd_dix_vendorsService.update(vendorId, vendorPayload as any);
    } else {
      const vr = await Cr6cd_dix_vendorsService.create(vendorPayload as any);
      if (!vr.success || !vr.data) throw new Error(JSON.stringify(vr.error) || 'Failed to save vendor');
      vendorId = (vr.data as any).cr6cd_dix_vendorid;
    }
    driverPayload['cr6cd_dix_vendor@odata.bind'] = `/cr6cd_dix_vendors(${vendorId})`;
  }

  let unitId = input.unitId;
  if (unitPayload) {
    if (unitId) {
      await Cr6cd_dix_unitsService.update(unitId, unitPayload as any);
    } else {
      const ur = await Cr6cd_dix_unitsService.create(unitPayload as any);
      if (!ur.success || !ur.data) throw new Error(JSON.stringify(ur.error) || 'Failed to save unit');
      unitId = (ur.data as any).cr6cd_dix_unitid;
    }
    driverPayload['cr6cd_dix_unit@odata.bind'] = `/cr6cd_dix_units(${unitId})`;
  }

  let driverId = input.driverId;
  if (driverId) {
    const dr = await Cr6cd_dix_driversService.update(driverId, driverPayload as any);
    if (!dr.success) throw new Error(JSON.stringify(dr.error) || 'Failed to update driver');
  } else {
    const dr = await Cr6cd_dix_driversService.create(driverPayload as any);
    if (!dr.success || !dr.data) throw new Error(JSON.stringify(dr.error) || 'Failed to create driver');
    driverId = (dr.data as any).cr6cd_dix_driverid;
  }

  return { driverId: driverId!, vendorId, unitId };
}

export function useSaveDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveDetails,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drivers'] }),
  });
}

export interface SaveTestingInput {
  driverId: string;
  elpRequired: boolean;
  hazmat: boolean;
}

async function saveTesting(input: SaveTestingInput): Promise<void> {
  const payload: Record<string, unknown> = {
    cr6cd_dix_elprequired: input.elpRequired,
    cr6cd_dix_hazmat: input.hazmat,
    cr6cd_dix_homelandsecurity: input.hazmat,
  };

  if (isLocal) {
    console.log('[mock] saveTesting →', input.driverId, payload);
    return;
  }

  const { Cr6cd_dix_driversService } = await import('../generated');
  const result = await Cr6cd_dix_driversService.update(input.driverId, payload as any);
  if (!result.success) throw new Error('Failed to save testing fields');
}

export function useSaveTesting() {
  return useMutation({ mutationFn: saveTesting });
}

export interface SaveTransfersInput {
  driverId: string;
  transferOccAcc: boolean;
  transferEquipment: boolean;
  reactivateEquipment: boolean;
  transferItems: Record<TransferItemKey, boolean>;
  reactivateItems: Record<TransferItemKey, boolean>;
}

async function saveTransfers(input: SaveTransfersInput): Promise<void> {
  const payload: Record<string, unknown> = {
    cr6cd_dix_transferoccacc: input.transferOccAcc,
    cr6cd_dix_transferequipment: input.transferEquipment,
    cr6cd_dix_reactivateequipment: input.reactivateEquipment,
  };

  if (isLocal) {
    console.log('[mock] saveTransfers →', input.driverId, payload, { transferItems: input.transferItems, reactivateItems: input.reactivateItems });
    return;
  }

  const { Cr6cd_dix_driversService } = await import('../generated');
  const result = await Cr6cd_dix_driversService.update(input.driverId, payload as any);
  if (!result.success) throw new Error('Failed to save transfer fields');

  const { Cr6cd_dix_driverdeductionsService } = await import('../generated');
  const subKeys = [
    ...Object.entries(input.transferItems).filter(([, v]) => v).map(([k]) => `transfer_${k}`),
    ...Object.entries(input.reactivateItems).filter(([, v]) => v).map(([k]) => `reactivate_${k}`),
  ];
  for (const key of subKeys) {
    await Cr6cd_dix_driverdeductionsService.create({
      cr6cd_dix_name: key,
      cr6cd_dix_deductionkey: key,
      cr6cd_dix_selected: true,
      'cr6cd_dix_deductiondriver@odata.bind': `/cr6cd_dix_drivers(${input.driverId})`,
    } as any);
  }
}

export function useSaveTransfers() {
  return useMutation({ mutationFn: saveTransfers });
}

export interface SaveDeductionsInput {
  driverId: string;
  deductionSelections: Record<string, boolean>;
  iftaNumber: string;
  maintenanceAmount: string;
}

async function saveDeductions(input: SaveDeductionsInput): Promise<void> {
  const selected = Object.entries(input.deductionSelections)
    .filter(([, v]) => v)
    .map(([key]) => key);

  if (isLocal) {
    console.log('[mock] saveDeductions →', input.driverId, selected);
    return;
  }

  const { Cr6cd_dix_driverdeductionsService } = await import('../generated');

  for (const key of selected) {
    const record: Record<string, unknown> = {
      cr6cd_dix_name: key,
      cr6cd_dix_deductionkey: key,
      cr6cd_dix_selected: true,
      'cr6cd_dix_deductiondriver@odata.bind': `/cr6cd_dix_drivers(${input.driverId})`,
    };
    if (key === 'ifta' && input.iftaNumber) {
      record.cr6cd_dix_iftanumber = input.iftaNumber;
    }
    if (key === 'maintenance_fund' && input.maintenanceAmount) {
      record.cr6cd_dix_customvalue = parseFloat(input.maintenanceAmount);
    }
    await Cr6cd_dix_driverdeductionsService.create(record as any);
  }
}

export function useSaveDeductions() {
  return useMutation({ mutationFn: saveDeductions });
}

async function deleteDriver(driverId: string): Promise<void> {
  if (isLocal) {
    console.log('[mock] deleteDriver →', driverId);
    return;
  }
  const { Cr6cd_dix_driversService } = await import('../generated');
  await Cr6cd_dix_driversService.delete(driverId);
}

export function useDeleteDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drivers'] }),
  });
}
