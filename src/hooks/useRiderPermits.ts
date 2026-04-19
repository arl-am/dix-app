import { useQuery } from '@tanstack/react-query';
import { isLocal } from '../lib/utils';

export interface RiderPermitRecord {
  id: string;
  proNumber: string;
  driverName: string;
  businessName: string;
  terminal: string;
  unitNumber: string;
  passengerName: string;
  permitStartDate: string;
  permitEndDate: string;
  createdOn: string;
  createdByName: string;
}

async function fetchRiderPermits(): Promise<RiderPermitRecord[]> {
  if (isLocal) {
    return [
      {
        id: '1',
        proNumber: '3473',
        driverName: 'John Smith',
        businessName: 'Smith Trucking LLC',
        terminal: '1683',
        unitNumber: '1001',
        passengerName: 'Jane Smith',
        permitStartDate: '2026-04-01',
        permitEndDate: '2026-04-15',
        createdOn: '2026-04-01T12:00:00Z',
        createdByName: 'Anderson Marquez',
      },
      {
        id: '2',
        proNumber: '3472',
        driverName: 'Carlos Rivera',
        businessName: 'Rivera Logistics',
        terminal: '2010',
        unitNumber: '1435',
        passengerName: 'Maria Rivera',
        permitStartDate: '2026-03-28',
        permitEndDate: '2026-04-10',
        createdOn: '2026-03-28T09:15:00Z',
        createdByName: 'Susan Reisker',
      },
    ];
  }

  const { getClient } = await import('@microsoft/power-apps/data');
  const { dataSourcesInfo } = await import('../../.power/schemas/appschemas/dataSourcesInfo');
  const client = getClient(dataSourcesInfo);

  const result: any = await client.retrieveMultipleRecordsAsync('cr6cd_dixriderpermits', {
    select: [
      'cr6cd_dixriderpermitid', 'cr6cd_pronumber',
      'cr6cd_drivername', 'cr6cd_businessname', 'cr6cd_terminal',
      'cr6cd_unitnumber', 'cr6cd_passengername',
      'cr6cd_permitstartdate', 'cr6cd_permitenddate',
      'createdon', '_createdby_value',
    ],
    orderBy: ['createdon desc'],
    top: 100,
  });

  const data = (result.data || []) as any[];
  return data.map((d) => ({
    id: d.cr6cd_dixriderpermitid || '',
    proNumber: String(d.cr6cd_pronumber ?? ''),
    driverName: d.cr6cd_drivername || '',
    businessName: d.cr6cd_businessname || '',
    terminal: d.cr6cd_terminal || '',
    unitNumber: d.cr6cd_unitnumber || '',
    passengerName: d.cr6cd_passengername || '',
    permitStartDate: d.cr6cd_permitstartdate || '',
    permitEndDate: d.cr6cd_permitenddate || '',
    createdOn: d.createdon || '',
    createdByName: d['_createdby_value@OData.Community.Display.V1.FormattedValue'] || '',
  }));
}

export function useRiderPermits() {
  return useQuery({ queryKey: ['rider-permits'], queryFn: fetchRiderPermits });
}
