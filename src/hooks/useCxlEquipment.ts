import { useQuery } from '@tanstack/react-query';
import { isLocal } from '../lib/utils';
import { MOCK_CXL_EQUIPMENT, type CxlEquipment } from '../lib/mockData';

const SELECT = [
  'cr6cd_dixcxlequipmentid', 'cr6cd_name',
  'cr6cd_equipmentkey', 'cr6cd_displayname', 'cr6cd_lifecyclestate',
  'cr6cd_returneddate', 'cr6cd_notes',
  'cr6cd_istransferred', 'cr6cd_isreactivated',
  '_cr6cd_equipmentcancellation_value', 'createdon',
];

async function fetchEquipmentForCancellation(cancellationId: string): Promise<CxlEquipment[]> {
  if (isLocal) {
    return MOCK_CXL_EQUIPMENT.filter((e) => e._cr6cd_equipmentcancellation_value === cancellationId);
  }
  const { getClient } = await import('@microsoft/power-apps/data');
  const { dataSourcesInfo } = await import('../../.power/schemas/appschemas/dataSourcesInfo');
  const client = getClient(dataSourcesInfo);

  const result: any = await client.retrieveMultipleRecordsAsync('cr6cd_dixcxlequipments', {
    select: SELECT,
    filter: `_cr6cd_equipmentcancellation_value eq ${cancellationId}`,
    orderBy: ['createdon asc'],
    top: 50,
  });
  return (result.data || []) as CxlEquipment[];
}

export function useCxlEquipment(cancellationId: string | null) {
  return useQuery({
    queryKey: ['cxl-equipment', cancellationId],
    queryFn: () => fetchEquipmentForCancellation(cancellationId!),
    enabled: !!cancellationId,
  });
}

async function fetchAllEquipment(): Promise<CxlEquipment[]> {
  if (isLocal) return MOCK_CXL_EQUIPMENT;
  const { getClient } = await import('@microsoft/power-apps/data');
  const { dataSourcesInfo } = await import('../../.power/schemas/appschemas/dataSourcesInfo');
  const client = getClient(dataSourcesInfo);
  const result: any = await client.retrieveMultipleRecordsAsync('cr6cd_dixcxlequipments', {
    select: SELECT,
    top: 5000,
  });
  return (result.data || []) as CxlEquipment[];
}

export function useAllCxlEquipment() {
  return useQuery({ queryKey: ['cxl-equipment-all'], queryFn: fetchAllEquipment });
}
