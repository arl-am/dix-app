import { useQuery } from '@tanstack/react-query';
import { isLocal } from '../lib/utils';
import { MOCK_CANCELLATIONS, MOCK_AGENTS, type Cancellation } from '../lib/mockData';

const SELECT = [
  'cr6cd_dix_cancellationid', 'cr6cd_dix_name',
  'cr6cd_dix_canceltype', 'cr6cd_dix_status', 'cr6cd_dix_cancelreason',
  'cr6cd_dix_reasondetails', 'cr6cd_dix_unitnumber',
  'cr6cd_dix_vendorcode', 'cr6cd_dix_vendorname',
  'cr6cd_dix_drivercode', 'cr6cd_dix_drivername', 'cr6cd_dix_driverphone',
  'cr6cd_dix_trailercode',
  'cr6cd_dix_startdate', 'cr6cd_dix_canceldate', 'cr6cd_dix_duedate',
  'cr6cd_dix_allitemsrcvddate', 'cr6cd_dix_lastitemreceived',
  'cr6cd_dix_submittedby', 'cr6cd_dix_assignee',
  'cr6cd_dix_requestreturnlabel', 'cr6cd_dix_returnlabelurl', 'cr6cd_dix_rltrackingnumber',
  'cr6cd_dix_forfeit',
  'cr6cd_dix_elddeposit', 'cr6cd_dix_dashcamdeposit', 'cr6cd_dix_pdideposit',
  'cr6cd_dix_transferredtounit', 'cr6cd_dix_prepassnumber', 'cr6cd_dix_rfidnumber',
  'cr6cd_dix_platenumber', 'cr6cd_dix_fleetnumber',
  'cr6cd_dix_logsfromdate', 'cr6cd_dix_logstodate', 'cr6cd_dix_bypassagentaddress',
  'cr6cd_dix_notes', 'cr6cd_dix_requestdate',
  '_cr6cd_dix_cancagent_value', '_cr6cd_dix_cancdriver_value',
  'createdon', 'modifiedon',
];

async function fetchCancellations(): Promise<Cancellation[]> {
  if (isLocal) {
    return MOCK_CANCELLATIONS.map((c) => ({
      ...c,
      terminal: c.terminal || (MOCK_AGENTS.find((a) => a.cr6cd_agentsid === c._cr6cd_dix_cancagent_value)?.cr6cd_terminal ?? ''),
    }));
  }
  const { getClient } = await import('@microsoft/power-apps/data');
  const { dataSourcesInfo } = await import('../../.power/schemas/appschemas/dataSourcesInfo');
  const client = getClient(dataSourcesInfo);

  // Fetch cancellations + agents in parallel so we can resolve the terminal
  // lookup to its numeric `cr6cd_terminal` (the agent's primary name shows up
  // as "1683 - 1683" via the formatted-value annotation, which is wrong).
  const [cxlResult, agentResult]: [any, any] = await Promise.all([
    client.retrieveMultipleRecordsAsync('cr6cd_dix_cancellations', {
      select: SELECT,
      orderBy: ['createdon desc'],
      top: 500,
    }),
    client.retrieveMultipleRecordsAsync('cr6cd_agentses', {
      select: ['cr6cd_agentsid', 'cr6cd_terminal'],
      top: 500,
    }),
  ]);
  const agentTerminalById = new Map<string, string>();
  for (const a of (agentResult.data || []) as any[]) {
    agentTerminalById.set(a.cr6cd_agentsid, a.cr6cd_terminal || '');
  }
  const data = (cxlResult.data || []) as any[];
  return data.map((d) => ({
    ...d,
    terminal: agentTerminalById.get(d._cr6cd_dix_cancagent_value || '') || '',
    driverName: d.cr6cd_dix_drivername || '',
    driverCode: d.cr6cd_dix_drivercode || '',
    unitNumber: d.cr6cd_dix_unitnumber || '',
  })) as unknown as Cancellation[];
}

export function useCancellations() {
  return useQuery({ queryKey: ['cancellations'], queryFn: fetchCancellations });
}

async function fetchCancellation(id: string): Promise<Cancellation | null> {
  if (isLocal) {
    return MOCK_CANCELLATIONS.find((c) => c.cr6cd_dix_cancellationid === id) || null;
  }
  const { getClient } = await import('@microsoft/power-apps/data');
  const { dataSourcesInfo } = await import('../../.power/schemas/appschemas/dataSourcesInfo');
  const client = getClient(dataSourcesInfo);

  const result: any = await client.retrieveRecordAsync('cr6cd_dix_cancellations', id, { select: SELECT });
  const d = result.data;
  if (!d) return null;
  return {
    ...d,
    terminal: d['_cr6cd_dix_cancagent_value@OData.Community.Display.V1.FormattedValue'] || '',
    driverName: d.cr6cd_dix_drivername || '',
    driverCode: d.cr6cd_dix_drivercode || '',
    unitNumber: d.cr6cd_dix_unitnumber || '',
  } as unknown as Cancellation;
}

export function useCancellation(id: string | null) {
  return useQuery({
    queryKey: ['cancellation', id],
    queryFn: () => fetchCancellation(id!),
    enabled: !!id,
  });
}
