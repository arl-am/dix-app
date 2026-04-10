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
      'cr6cd_dix_email', 'cr6cd_dix_phonenumber', 'cr6cd_dix_ssn',
      'cr6cd_dix_licensenumber', 'cr6cd_dix_licensestate', 'cr6cd_dix_licenseexpdate',
      'cr6cd_dix_fuelcardnumber',
      'cr6cd_dix_streetaddress', 'cr6cd_dix_city', 'cr6cd_dix_state', 'cr6cd_dix_zipcode',
      'cr6cd_dix_isactive', 'cr6cd_dix_onboardingdate', 'createdon',
      'cr6cd_dix_elprequired', 'cr6cd_dix_hazmat', 'cr6cd_dix_homelandsecurity',
      'cr6cd_dix_transferoccacc', 'cr6cd_dix_transferequipment', 'cr6cd_dix_reactivateequipment',
      '_cr6cd_dix_agent_value', '_cr6cd_dix_unit_value', '_cr6cd_dix_vendor_value', '_createdby_value',
    ],
    orderBy: ['createdon desc'],
  });
  const drivers = (result.data || []) as any[];
  return drivers.map((d: any) => ({
    ...d,
    cr6cd_dix_agentname: d.cr6cd_dix_agentname || d['_cr6cd_dix_agent_value@OData.Community.Display.V1.FormattedValue'] || '',
    cr6cd_dix_unitname: d.cr6cd_dix_unitname || d['_cr6cd_dix_unit_value@OData.Community.Display.V1.FormattedValue'] || '',
    cr6cd_dix_createdbyname: d.cr6cd_dix_createdbyname || d['_createdby_value@OData.Community.Display.V1.FormattedValue'] || '',
  })) as unknown as Driver[];
}

export function useDrivers() {
  return useQuery({ queryKey: ['drivers'], queryFn: fetchDrivers });
}
