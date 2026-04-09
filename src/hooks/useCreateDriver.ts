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
}

const ACTION_TYPE_MAP: Record<string, number> = {
  new: 100000000,
  move: 100000001,
};

async function createDriver(input: CreateDriverInput): Promise<string> {
  const driverRecord: Record<string, unknown> = {
    cr6cd_dix_name: `${input.form.firstName || ''} ${input.form.lastName || ''}`.trim(),
    cr6cd_dix_email: input.form.email || undefined,
    cr6cd_dix_phonenumber: input.form.phone || undefined,
    cr6cd_dix_ssn: input.form.ssn || undefined,
    cr6cd_dix_drivercode: input.form.driverCode || undefined,
    cr6cd_dix_licensenumber: input.form.licenseNumber || undefined,
    cr6cd_dix_licensestate: input.form.licenseState || undefined,
    cr6cd_dix_licenseexpdate: input.form.licenseExpDate || undefined,
    cr6cd_dix_streetaddress: input.form.streetAddress || undefined,
    cr6cd_dix_city: input.form.city || undefined,
    cr6cd_dix_state: input.form.state || undefined,
    cr6cd_dix_zipcode: input.form.zipCode || undefined,
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
    cr6cd_dix_fuelcardnumber: input.form.fuelCardNumber || undefined,
  };

  if (input.selectedAgent) {
    driverRecord['cr6cd_dix_agent@odata.bind'] = `/cr6cd_agentses(${input.selectedAgent})`;
  }

  // Strip undefined values so Dataverse doesn't receive null fields
  const payload = Object.fromEntries(
    Object.entries(driverRecord).filter(([, v]) => v !== undefined),
  );

  if (isLocal) {
    const mockId = crypto.randomUUID();
    console.log('[mock] createDriver →', mockId, payload);
    return mockId;
  }

  const { getClient } = await import('@microsoft/power-apps/data');
  const { dataSourcesInfo } = await import('../../.power/schemas/appschemas/dataSourcesInfo');
  const client = getClient(dataSourcesInfo);
  const result = await client.createRecordAsync('cr6cd_dix_drivers', payload);
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
