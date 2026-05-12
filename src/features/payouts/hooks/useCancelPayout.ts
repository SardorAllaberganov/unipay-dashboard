import { useMutation, useQueryClient } from '@tanstack/react-query';
import { payoutsApi, type CancelPayoutBody } from '../api';
import { PAYOUTS_QUERY_KEY } from './usePayouts';

export function useCancelPayout(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CancelPayoutBody) => payoutsApi.cancel(id!, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYOUTS_QUERY_KEY });
    },
  });
}
