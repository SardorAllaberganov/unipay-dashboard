import { useMutation } from '@tanstack/react-query';
import { comingSoonApi, type NotifyMeBody } from '../api';

export function useNotifyMe() {
  return useMutation({
    mutationFn: (body: NotifyMeBody) => comingSoonApi.notify(body),
  });
}
