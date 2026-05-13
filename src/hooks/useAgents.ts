import { useQuery } from '@tanstack/react-query';
import { isLocal } from '../lib/utils';
import { MOCK_AGENTS, type Agent } from '../lib/mockData';

const NUMERIC_FIELDS = [
  'cr6cd_occaccmonthly', 'cr6cd_occaccbiweekly', 'cr6cd_bobtailvalue',
  'cr6cd_securitydepositweeklyvalue', 'cr6cd_securitydepositfullvalue',
  'cr6cd_elddepositvalue', 'cr6cd_elddepositfullvalue',
  'cr6cd_elddatafeevalue', 'cr6cd_dashcamdepositvalue', 'cr6cd_buydownvalue',
  'cr6cd_iftavalue', 'cr6cd_platedepositvalue', 'cr6cd_platedepositfullvalue',
  'cr6cd_plateweeklyvalue', 'cr6cd_plateadminfee',
  'cr6cd_prepassbypass', 'cr6cd_prepasstollsbypass',
  'cr6cd_rfidvalue', 'cr6cd_trailerusagevalue', 'cr6cd_trailerusageadminfee',
] as const;

const BOOLEAN_FIELDS = [
  'cr6cd_elddatafeerequired', 'cr6cd_trailerusagerequired', 'cr6cd_hazmatrequired',
  'cr6cd_inventoryterminal', 'cr6cd_platemandatory', 'cr6cd_prepassrequiredifarlplate',
  'cr6cd_rfidmandatory', 'cr6cd_marylandliquorpermit',
] as const;

function pickCaseInsensitive(row: Record<string, unknown>, target: string): unknown {
  if (target in row) return row[target];
  const lower = target.toLowerCase();
  for (const k of Object.keys(row)) {
    if (k.toLowerCase() === lower) return row[k];
  }
  return undefined;
}

function toNumber(v: unknown): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string') {
    const cleaned = v.replace(/[$,\s]/g, '');
    if (cleaned === '') return undefined;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function toBoolean(v: unknown): boolean {
  if (v === true || v === 1) return true;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === 'yes' || s === 'true' || s === '1';
  }
  return false;
}

async function fetchAgents(): Promise<Agent[]> {
  if (isLocal) return MOCK_AGENTS;
  const { Cr6cd_agentsesService } = await import('../generated');
  const result = await Cr6cd_agentsesService.getAll({
    select: [
      'cr6cd_agentsid', 'cr6cd_terminal', 'cr6cd_title', 'cr6cd_division',
      'cr6cd_divisionformal', 'cr6cd_company', 'cr6cd_motorcarrier', 'cr6cd_motorcarriercode',
      'cr6cd_scac', 'cr6cd_occaccmonthly', 'cr6cd_occaccbiweekly', 'cr6cd_bobtailvalue',
      'cr6cd_securitydepositweeklyvalue', 'cr6cd_securitydepositfullvalue',
      'cr6cd_elddepositvalue', 'cr6cd_elddepositfullvalue', 'cr6cd_elddatafeerequired',
      'cr6cd_elddatafeevalue', 'cr6cd_dashcamdepositvalue', 'cr6cd_buydownvalue',
      'cr6cd_iftavalue', 'cr6cd_platedepositvalue', 'cr6cd_platedepositfullvalue',
      'cr6cd_plateweeklyvalue', 'cr6cd_plateadminfee', 'cr6cd_platemandatory',
      'cr6cd_prepassbypass', 'cr6cd_prepasstollsbypass', 'cr6cd_prepassrequiredifarlplate',
      'cr6cd_rfidvalue', 'cr6cd_rfidmandatory', 'cr6cd_trailerusagevalue',
      'cr6cd_trailerusagerequired', 'cr6cd_trailerusageadminfee', 'cr6cd_hazmatrequired',
      'cr6cd_workerscomprequired', 'cr6cd_complianceagentemails', 'cr6cd_addmoveagentemail',
      'cr6cd_inventoryterminal', 'cr6cd_inventoryreturnaddress', 'cr6cd_noninventoryreturnaddress',
      'cr6cd_marylandliquorpermit',
    ],
    orderBy: ['cr6cd_terminal asc'],
  });
  const rows = (result.data ?? []) as unknown as Record<string, unknown>[];
  return rows.map((r) => {
    const out: Record<string, unknown> = { ...r };
    for (const f of NUMERIC_FIELDS) {
      out[f] = toNumber(pickCaseInsensitive(r, f));
    }
    for (const f of BOOLEAN_FIELDS) {
      out[f] = toBoolean(pickCaseInsensitive(r, f));
    }
    return out;
  }) as unknown as Agent[];
}

export function useAgents() {
  return useQuery({ queryKey: ['agents'], queryFn: fetchAgents });
}
