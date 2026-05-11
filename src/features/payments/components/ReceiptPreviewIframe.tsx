// HTML "receipt" rendered into an iframe via `srcDoc`. No real PDFs in fixtures — this gives
// a realistic preview that the parent page prints via window.print(). Sandbox restricts to
// same-origin (no scripts, no top-level navigation).
//
// Receipt structure:
//   header  — title + organization name (right-aligned receipt number + date)
//   parties — Плательщик (student) / Получатель (org + TIN)
//   table   — line items: Оплата обучения / Комиссия → Итого
//   meta    — payment channel, transaction ID, status badge
//   footer  — thanks + auto-generation disclaimer
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMoney, formatDateTime } from '@/lib/format';
import { useOrganization } from '@/features/organization/hooks/useOrganization';
import type { PaymentChannel, Transaction } from '@/types/domain';

interface Props {
  transaction: Transaction;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface ReceiptLabels {
  title: string;
  number: string;
  date: string;
  payer: string;
  studentId: string;
  recipient: string;
  tin: string;
  items: string;
  amount: string;
  tuition: string;
  commission: string;
  subtotal: string;
  toInstitution: string;
  paymentChannel: string;
  transactionId: string;
  status: string;
  statusText: string;
  thanks: string;
  disclaimer: string;
  channelLabel: string;
}

interface OrgInfo {
  name: string;
  tin?: string;
}

function buildReceiptHtml(tx: Transaction, org: OrgInfo, labels: ReceiptLabels): string {
  const isRefunded = tx.status === 'refunded';
  const statusColor = isRefunded ? '#b45309' : '#15803d';
  const statusBg = isRefunded ? '#fef3c7' : '#dcfce7';
  return `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 0;
        padding: 24px;
        background: #ffffff;
        color: #1f2937;
        font-size: 13px;
        line-height: 1.5;
      }
      .receipt { max-width: 560px; margin: 0 auto; }
      .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; }
      .header-left h1 { font-size: 18px; font-weight: 600; margin: 0 0 4px; color: #111827; }
      .header-left .org { font-size: 13px; color: #6b7280; margin: 0; }
      .header-right { text-align: right; }
      .header-right .num { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; color: #111827; margin: 0 0 2px; }
      .header-right .date { font-size: 12px; color: #6b7280; font-variant-numeric: tabular-nums; margin: 0; }

      .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
      .party-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 500; margin: 0 0 4px; }
      .party-name { font-size: 14px; font-weight: 500; color: #111827; margin: 0; }
      .party-meta { font-size: 12px; color: #6b7280; margin: 2px 0 0; font-variant-numeric: tabular-nums; }

      table.lines { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
      table.lines th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 500; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
      table.lines th.right, table.lines td.right { text-align: right; }
      table.lines td { padding: 8px 0; font-size: 13px; color: #1f2937; font-variant-numeric: tabular-nums; border-bottom: 1px solid #f3f4f6; }
      table.lines td.muted { color: #6b7280; }

      .totals { margin-top: 4px; }
      .total-row { display: flex; justify-content: space-between; align-items: baseline; padding: 6px 0; font-variant-numeric: tabular-nums; }
      .total-row.subtotal { padding-top: 12px; border-top: 1px solid #e5e7eb; }
      .total-row .label { font-size: 13px; color: #6b7280; }
      .total-row .label-bold { font-size: 14px; color: #111827; font-weight: 600; }
      .total-row .value { font-size: 14px; color: #1f2937; }
      .total-row .value-bold { font-size: 18px; color: #111827; font-weight: 700; }

      .meta { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; }
      .meta-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 500; margin: 0 0 2px; }
      .meta-value { font-size: 13px; color: #1f2937; margin: 0; font-variant-numeric: tabular-nums; }
      .meta-value.mono { font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }

      .status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background: ${statusBg}; color: ${statusColor}; }

      footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; }
      footer .thanks { font-size: 13px; color: #111827; font-weight: 500; margin: 0 0 4px; }
      footer .disclaimer { font-size: 11px; color: #9ca3af; margin: 0; }

      @media print {
        body { padding: 16px; }
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      <div class="header">
        <div class="header-left">
          <h1>${escapeHtml(labels.title)}</h1>
          <p class="org">${escapeHtml(org.name)}</p>
        </div>
        <div class="header-right">
          <p class="num">${escapeHtml(labels.number)} ${escapeHtml(tx.receiptNumber ?? tx.id)}</p>
          <p class="date">${escapeHtml(formatDateTime(tx.createdAt))}</p>
        </div>
      </div>

      <div class="parties">
        <div>
          <p class="party-label">${escapeHtml(labels.payer)}</p>
          <p class="party-name">${escapeHtml(tx.studentName)}</p>
          <p class="party-meta">${escapeHtml(labels.studentId)}: ${escapeHtml(tx.studentId)}</p>
        </div>
        <div>
          <p class="party-label">${escapeHtml(labels.recipient)}</p>
          <p class="party-name">${escapeHtml(org.name)}</p>
          ${org.tin ? `<p class="party-meta">${escapeHtml(labels.tin)}: ${escapeHtml(org.tin)}</p>` : ''}
        </div>
      </div>

      <table class="lines">
        <thead>
          <tr>
            <th>${escapeHtml(labels.items)}</th>
            <th class="right">${escapeHtml(labels.amount)}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${escapeHtml(labels.tuition)}</td>
            <td class="right">${escapeHtml(formatMoney(tx.net))}</td>
          </tr>
          ${Number(tx.commission.amount) > 0 ? `<tr>
            <td class="muted">${escapeHtml(labels.commission)}</td>
            <td class="right muted">${escapeHtml(formatMoney(tx.commission))}</td>
          </tr>` : ''}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row subtotal">
          <span class="label-bold">${escapeHtml(labels.subtotal)}</span>
          <span class="value-bold">${escapeHtml(formatMoney(tx.amount))}</span>
        </div>
        <div class="total-row">
          <span class="label">${escapeHtml(labels.toInstitution)}</span>
          <span class="value">${escapeHtml(formatMoney(tx.net))}</span>
        </div>
      </div>

      <div class="meta">
        <div>
          <p class="meta-label">${escapeHtml(labels.paymentChannel)}</p>
          <p class="meta-value">${escapeHtml(labels.channelLabel)}</p>
        </div>
        <div>
          <p class="meta-label">${escapeHtml(labels.status)}</p>
          <p class="meta-value"><span class="status-badge">${escapeHtml(labels.statusText)}</span></p>
        </div>
        <div style="grid-column: 1 / -1;">
          <p class="meta-label">${escapeHtml(labels.transactionId)}</p>
          <p class="meta-value mono">${escapeHtml(tx.id)}</p>
        </div>
      </div>

      <footer>
        <p class="thanks">${escapeHtml(labels.thanks)}</p>
        <p class="disclaimer">${escapeHtml(labels.disclaimer)}</p>
      </footer>
    </div>
  </body>
</html>`;
}

function localeChannelKey(channel: PaymentChannel): string {
  return `channels.${channel}`;
}

export function ReceiptPreviewIframe({ transaction }: Props) {
  const { t } = useTranslation();
  const orgQuery = useOrganization();

  const srcDoc = useMemo(() => {
    const isRefunded = transaction.status === 'refunded';
    const org: OrgInfo = {
      name: orgQuery.data?.name.ru ?? orgQuery.data?.name.uz ?? 'UNIPAY',
      tin: orgQuery.data?.tin,
    };
    const labels: ReceiptLabels = {
      title: t('payments.detail.receipt.title'),
      number: t('payments.detail.receipt.number'),
      date: t('payments.detail.receipt.date'),
      payer: t('payments.detail.receipt.payer'),
      studentId: t('payments.detail.receipt.studentId'),
      recipient: t('payments.detail.receipt.recipient'),
      tin: t('payments.detail.receipt.tin'),
      items: t('payments.detail.receipt.items'),
      amount: t('payments.detail.receipt.amount'),
      tuition: t('payments.detail.receipt.tuition'),
      commission: t('payments.detail.receipt.commission'),
      subtotal: t('payments.detail.receipt.subtotal'),
      toInstitution: t('payments.detail.receipt.toInstitution'),
      paymentChannel: t('payments.detail.receipt.paymentChannel'),
      transactionId: t('payments.detail.receipt.transactionId'),
      status: t('payments.detail.receipt.status'),
      statusText: isRefunded
        ? t('payments.detail.receipt.refundedStatus')
        : t('payments.detail.receipt.paidStatus'),
      thanks: t('payments.detail.receipt.thanks'),
      disclaimer: t('payments.detail.receipt.disclaimer'),
      channelLabel: t(localeChannelKey(transaction.channel)),
    };
    return buildReceiptHtml(transaction, org, labels);
  }, [transaction, orgQuery.data, t]);

  // Auto-size the iframe to its content so the modal sizes to `max-content`. Measured after
  // the iframe loads via `scrollHeight` on the body of its srcDoc document.
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(560);
  const measure = useCallback(() => {
    const el = iframeRef.current;
    const doc = el?.contentDocument;
    if (!doc) return;
    const h = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight);
    setIframeHeight(h);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc}
      title={t('payments.detail.receiptHeading')}
      style={{ height: iframeHeight }}
      className="w-full rounded-md border border-border bg-white"
      sandbox="allow-same-origin"
      onLoad={measure}
    />
  );
}
