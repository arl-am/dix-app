import { useQuery } from '@tanstack/react-query';

const isLocal = window.location.hostname === 'localhost';

const MOCK_SETTINGS: Record<string, string> = {
  fastpass_flow_url: 'https://1196a9169d8ee019909181689db188.08.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/53bf28240ad1411982e1744c4068ae6d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=kkZojCpVCuCHrozgK648GR64b9wZyH9tS3aisF9P29I',
};

async function fetchAppSetting(name: string): Promise<string | null> {
  if (isLocal) {
    return MOCK_SETTINGS[name] || null;
  }
  const { Cr6cd_dix_appsettingsService } = await import('../generated');
  const result = await Cr6cd_dix_appsettingsService.getAll({
    select: ['cr6cd_dix_value'],
    filter: `cr6cd_dix_name eq '${name}' and cr6cd_dix_isactive eq true`,
    top: 1,
  });
  const records = result.data ?? [];
  return records[0]?.cr6cd_dix_value || null;
}

export function useAppSetting(name: string) {
  return useQuery({
    queryKey: ['app-setting', name],
    queryFn: () => fetchAppSetting(name),
    staleTime: 1000 * 60 * 30,
  });
}
