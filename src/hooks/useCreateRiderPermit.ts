import { useMutation } from '@tanstack/react-query';
import { isLocal } from '../lib/utils';

export interface RiderPermitInput {
  driverName: string;
  businessName: string;
  terminalCode: string;
  unitNumber: string;
  passengerName: string;
  permitStartDate: string;
  permitEndDate: string;
  rate: number;
  daysCovered: number;
}

export interface RiderPermitCreated {
  id: string;
  proNumber: string;
}

async function createRiderPermit(input: RiderPermitInput): Promise<RiderPermitCreated> {
  if (isLocal) {
    await new Promise((r) => setTimeout(r, 600));
    return { id: 'mock-id', proNumber: String(3474 + Math.floor(Math.random() * 50)) };
  }

  const { getClient } = await import('@microsoft/power-apps/data');
  const { dataSourcesInfo } = await import('../../.power/schemas/appschemas/dataSourcesInfo');
  const client = getClient(dataSourcesInfo);

  const body: Record<string, any> = {
    cr6cd_name: `${input.driverName} - Rider Permit`,
    cr6cd_drivername: input.driverName,
    cr6cd_businessname: input.businessName,
    cr6cd_terminal: input.terminalCode,
    cr6cd_unitnumber: input.unitNumber,
    cr6cd_passengername: input.passengerName,
    cr6cd_permitstartdate: input.permitStartDate,
    cr6cd_permitenddate: input.permitEndDate,
    cr6cd_rate: input.rate,
    cr6cd_dayscovered: input.daysCovered,
  };

  const result: any = await client.createRecordAsync('cr6cd_dixriderpermits', body);
  const data = result.data || result;

  return {
    id: data.cr6cd_dixriderpermitid || data.id || '',
    proNumber: String(data.cr6cd_pronumber ?? ''),
  };
}

export function useCreateRiderPermit() {
  return useMutation({ mutationFn: createRiderPermit });
}
