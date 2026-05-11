import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  paymentsApi,
  type BulkRemindInput,
  type InitiateRefundInput,
  type ManualPaymentInput,
} from '../api';
import { TRANSACTIONS_QUERY_KEY } from './useTransactions';
import { REFUNDS_QUERY_KEY } from './useRefunds';
import { PENDING_QUERY_KEY } from './usePendingOverdue';

export function useManualPayment() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: ManualPaymentInput) => paymentsApi.manualPayment(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: PENDING_QUERY_KEY });
      toast.success(t('payments.manualEntry.success'));
    },
  });
}

export function useInitiateRefund(txId: string | undefined) {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: InitiateRefundInput) => {
      if (!txId) throw new Error('tx_id_required');
      return paymentsApi.initiateRefund(txId, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: REFUNDS_QUERY_KEY });
      toast.success(t('payments.refund.dialog.successToast'));
    },
  });
}

export function useApproveRefund() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => paymentsApi.approveRefund(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REFUNDS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
      toast.success(t('payments.refunds.approve.success'));
    },
  });
}

export function useRejectRefund() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (args: { id: string; reason: string }) =>
      paymentsApi.rejectRefund(args.id, args.reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: REFUNDS_QUERY_KEY });
      toast.success(t('payments.refunds.reject.success'));
    },
  });
}

export function useBulkRemind() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: BulkRemindInput) => paymentsApi.bulkRemind(input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: PENDING_QUERY_KEY });
      toast.success(t('payments.pending.bulk.remindSuccess', { count: data.sent }));
    },
  });
}

export function useBulkExport() {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: {
      studentIds?: string[];
      from?: string;
      to?: string;
      format?: import('../api').ExportFormat;
    }) => paymentsApi.bulkExport(input),
    onSuccess: () => {
      toast.success(t('payments.pending.bulk.exportSuccess'));
    },
  });
}
