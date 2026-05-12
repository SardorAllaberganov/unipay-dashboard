import { useTranslation } from 'react-i18next';
import { formatUZS } from '@/lib/format';

// Static sample data — purely visual; the point is showing rhythm changes when
// `data-density` / `data-tabular-nums` flip on <html>.
const ROWS: Array<{ id: string; period: string; gross: number; net: number }> = [
  { id: 'PAY-2026-0117', period: '2026-04-29 — 2026-05-05', gross: 312_400_000, net: 308_700_000 },
  { id: 'PAY-2026-0116', period: '2026-04-22 — 2026-04-28', gross: 287_600_000, net: 284_100_000 },
  { id: 'PAY-2026-0115', period: '2026-04-15 — 2026-04-21', gross: 421_780_000, net: 416_600_000 },
  { id: 'PAY-2026-0114', period: '2026-04-08 — 2026-04-14', gross: 168_990_000, net: 167_080_000 },
];

export function PreferencesLivePreview() {
  const { t } = useTranslation();
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full">
        <thead className="bg-muted/40">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
              {t('settings.preferences.preview.cols.id')}
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
              {t('settings.preferences.preview.cols.period')}
            </th>
            <th className="whitespace-nowrap px-4 py-2 text-right text-sm font-medium text-muted-foreground">
              {t('settings.preferences.preview.cols.gross')}
            </th>
            <th className="whitespace-nowrap px-4 py-2 text-right text-sm font-medium text-muted-foreground">
              {t('settings.preferences.preview.cols.net')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {ROWS.map((row) => (
            <tr key={row.id} style={{ height: 'var(--row-h, 40px)' }}>
              <td className="whitespace-nowrap px-4 text-sm text-muted-foreground tabular font-mono">
                {row.id}
              </td>
              <td className="whitespace-nowrap px-4 text-sm text-foreground tabular">
                {row.period}
              </td>
              <td className="whitespace-nowrap px-4 text-right text-sm text-foreground tabular">
                {formatUZS(row.gross)}
              </td>
              <td className="whitespace-nowrap px-4 text-right text-sm font-medium text-foreground tabular">
                {formatUZS(row.net)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
