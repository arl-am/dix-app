import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isLocal } from '../lib/utils';
import type { TransferItemKey } from '../pages/new-entry/Step4Transfers';

export interface CreateDriverInput {
  selectedAgent: string;
  actionType: string;
  contractType: number | null;
  startDate: string;
  form: Record<string, string>;
  elpRequired: boolean;
  hazmat: boolean;
  transferOccAcc: boolean;
  transferEquipment: boolean;
  reactivateEquipment: boolean;
  transferItems: Record<TransferItemKey, boolean>;
  reactivateItems: Record<TransferItemKey, boolean>;
  deductionSelections: Record<string, boolean>;
  iftaNumber: string;
  maintenanceAmount: string;
  pdiMonthly: number;
  pdiPercentage: number;
}

const ACTION_TYPE_MAP: Record<string, number> = {
  new: 100000000,
  move: 100000001,
};

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

async function createDriver(input: CreateDriverInput): Promise<string> {
  const f = input.form;

  const driverRecord: Record<string, unknown> = {
    cr6cd_dix_name: `${f.firstName || ''} ${f.lastName || ''}`.trim(),
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
    cr6cd_dix_onboardingdate: input.startDate,
    cr6cd_dix_contracttype: input.contractType ?? undefined,
    cr6cd_dix_actiontype: ACTION_TYPE_MAP[input.actionType] ?? undefined,
    cr6cd_dix_isactive: true,
    cr6cd_dix_elprequired: input.elpRequired,
    cr6cd_dix_hazmat: input.hazmat,
    cr6cd_dix_homelandsecurity: input.hazmat,
    cr6cd_dix_transferoccacc: input.transferOccAcc,
    cr6cd_dix_transferequipment: input.transferEquipment,
    cr6cd_dix_reactivateequipment: input.reactivateEquipment,
  };

  if (input.selectedAgent) {
    driverRecord['cr6cd_dix_agent@odata.bind'] = `/cr6cd_agentses(${input.selectedAgent})`;
  }

  const driverPayload = stripUndefined(driverRecord);

  const hasVendorData = f.businessName || f.vendorCode || f.einNumber;
  const vendorRecord: Record<string, unknown> | null = hasVendorData
    ? {
        cr6cd_dix_businessname: f.businessName || undefined,
        cr6cd_dix_vendorcode: f.vendorCode || undefined,
        cr6cd_dix_einnumber: f.einNumber || undefined,
        cr6cd_dix_phonenumber: f.vendorPhone || undefined,
        cr6cd_dix_streetaddress: f.vendorAddress || undefined,
        cr6cd_dix_city: f.vendorCity || undefined,
        cr6cd_dix_state: f.vendorState || undefined,
        cr6cd_dix_zipcode: f.vendorZipCode || undefined,
      }
    : null;

  const hasUnitData = f.unitNumber || f.vin || f.make;
  const unitRecord: Record<string, unknown> | null = hasUnitData
    ? {
        cr6cd_dix_unitnumber: f.unitNumber || undefined,
        cr6cd_dix_year: f.year ? parseInt(f.year, 10) : undefined,
        cr6cd_dix_make: f.make || undefined,
        cr6cd_dix_model: f.model || undefined,
        cr6cd_dix_vin: f.vin || undefined,
        cr6cd_dix_color: f.color || undefined,
        cr6cd_dix_truckvalue: f.truckValue ? parseFloat(f.truckValue) : undefined,
        cr6cd_dix_unladenweight: f.unladenWeight ? parseFloat(f.unladenWeight) : undefined,
        cr6cd_dix_purchasedate: f.purchaseDate || undefined,
        cr6cd_dix_lienholdername: f.lienholderName || undefined,
        cr6cd_dix_lienholderaddress: f.lienholderAddress || undefined,
      }
    : null;

  if (isLocal) {
    const mockId = crypto.randomUUID();
    console.log('[mock] createDriver →', mockId, driverPayload);
    if (vendorRecord) console.log('[mock] createVendor →', stripUndefined(vendorRecord));
    if (unitRecord) console.log('[mock] createUnit →', stripUndefined(unitRecord));
    const selectedDeductions = Object.entries(input.deductionSelections)
      .filter(([, v]) => v)
      .map(([key]) => key);
    if (selectedDeductions.length) console.log('[mock] deductions →', selectedDeductions);
    return mockId;
  }

  const { getClient } = await import('@microsoft/power-apps/data');
  const { dataSourcesInfo } = await import('../../.power/schemas/appschemas/dataSourcesInfo');
  const client = getClient(dataSourcesInfo);

  // Create vendor record first if present, then bind to driver
  if (vendorRecord) {
    const vendorPayload = stripUndefined(vendorRecord);
    vendorPayload.cr6cd_dix_name = f.businessName || f.vendorCode || 'Vendor';
    const vendorResult = await client.createRecordAsync('cr6cd_dix_vendors', vendorPayload);
    if (vendorResult.success && vendorResult.data) {
      const vendorId = (vendorResult.data as Record<string, string>).cr6cd_dix_vendorid;
      driverPayload['cr6cd_dix_vendor@odata.bind'] = `/cr6cd_dix_vendors(${vendorId})`;
    }
  }

  // Create unit record first if present, then bind to driver
  if (unitRecord) {
    const unitPayload = stripUndefined(unitRecord);
    unitPayload.cr6cd_dix_name = f.unitNumber || f.vin || 'Unit';
    const unitResult = await client.createRecordAsync('cr6cd_dix_units', unitPayload);
    if (unitResult.success && unitResult.data) {
      const unitId = (unitResult.data as Record<string, string>).cr6cd_dix_unitid;
      driverPayload['cr6cd_dix_unit@odata.bind'] = `/cr6cd_dix_units(${unitId})`;
    }
  }

  // Create the driver record
  const result = await client.createRecordAsync('cr6cd_dix_drivers', driverPayload);
  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to create driver record');
  }
  const driverId = (result.data as Record<string, string>).cr6cd_dix_driverid;

  // Save deduction selections — one row per selected deduction
  const selectedDeductions = Object.entries(input.deductionSelections)
    .filter(([, v]) => v)
    .map(([key]) => key);

  for (const key of selectedDeductions) {
    const deductionRecord: Record<string, unknown> = {
      cr6cd_dix_name: key,
      cr6cd_dix_deductionkey: key,
      cr6cd_dix_selected: true,
      'cr6cd_dix_deductiondriver@odata.bind': `/cr6cd_dix_drivers(${driverId})`,
    };
    if (key === 'ifta' && input.iftaNumber) {
      deductionRecord.cr6cd_dix_iftanumber = input.iftaNumber;
    }
    if (key === 'maintenance_fund' && input.maintenanceAmount) {
      deductionRecord.cr6cd_dix_customvalue = parseFloat(input.maintenanceAmount);
    }
    await client.createRecordAsync('cr6cd_dix_driverdeductions', deductionRecord);
  }

  return driverId;
}

export function useCreateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });
}
