import { useMutation, useQueryClient } from '@tanstack/react-query';
import { payoutsApi, type ConfirmPayoutBody } from '../api';
import { PAYOUTS_QUERY_KEY } from './usePayouts';

export function useConfirmPayout(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ConfirmPayoutBody) => payoutsApi.confirm(id!, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYOUTS_QUERY_KEY });
    },
  });
}
