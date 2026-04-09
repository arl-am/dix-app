import { useQuery } from '@tanstack/react-query';
import { isLocal } from '../lib/utils';
import { MOCK_CANCELLATIONS, type Cancellation } from '../lib/mockData';

async function fetchCancellations(): Promise<Cancellation[]> {
  if (isLocal) return MOCK_CANCELLATIONS;
  const { Cr6cd_dix_cancellationsService } = await import('../generated');
  const result = await Cr6cd_dix_cancellationsService.getAll({
    select: [
      'cr6cd_dix_cancellationid', 'cr6cd_dix_name', 'cr6cd_dix_cancellationreason',
      'cr6cd_dix_requestdate', 'cr6cd_dix_notes', 'cr6cd_dix_approved',
      'cr6cd_dix_amount', 'cr6cd_dix_deductiondate', 'cr6cd_dix_reason',
      '_cr6cd_dix_cancdriver_value',
    ],
    orderBy: ['cr6cd_dix_requestdate desc'],
  });
  return result.data as unknown as Cancellation[];
}

export function useCancellations() {
  return useQuery({ queryKey: ['cancellations'], queryFn: fetchCancellations });
}
