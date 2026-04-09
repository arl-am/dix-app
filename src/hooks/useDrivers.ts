import { useQuery } from '@tanstack/react-query';
import { isLocal } from '../lib/utils';
import { MOCK_DRIVERS, type Driver } from '../lib/mockData';

async function fetchDrivers(): Promise<Driver[]> {
  if (isLocal) return MOCK_DRIVERS;
  const { Cr6cd_dix_driversService } = await import('../generated');
  const result = await Cr6cd_dix_driversService.getAll({
    select: [
      'cr6cd_dix_driverid', 'cr6cd_dix_name', 'cr6cd_dix_drivercode',
      'cr6cd_dix_contracttype', 'cr6cd_dix_actiontype', 'cr6cd_dix_createdbyname',
      'cr6cd_dix_email', 'cr6cd_dix_phonenumber', 'cr6cd_dix_isactive',
      'cr6cd_dix_onboardingdate', '_cr6cd_dix_agent_value', '_cr6cd_dix_unit_value',
    ],
    orderBy: ['createdon desc'],
  });
  return result.data as unknown as Driver[];
}

export function useDrivers() {
  return useQuery({ queryKey: ['drivers'], queryFn: fetchDrivers });
}
