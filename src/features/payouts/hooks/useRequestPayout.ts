import { useMutation, useQueryClient } from '@tanstack/react-query';
import { payoutsApi, type RequestPayoutBody } from '../api';
import { PAYOUTS_QUERY_KEY } from './usePayouts';

export function useRequestPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RequestPayoutBody) => payoutsApi.request(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PAYOUTS_QUERY_KEY });
    },
  });
}
