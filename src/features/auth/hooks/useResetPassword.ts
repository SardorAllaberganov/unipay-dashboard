import { useMutation } from '@tanstack/react-query';
import { resetPassword } from '../api';

interface ResetPayload {
  token: string;
  password: string;
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, password }: ResetPayload) => resetPassword(token, password),
  });
}
