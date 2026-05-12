import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { FilterStack } from '@/components/shared/FilterStack';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AUDIT_ACTIONS, type AuditAction } from '@/types/domain';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuditFiltersFromUrl } from '../hooks/useAuditLog';

export function AuditFiltersBar() {
  const { t } = useTranslation();
  const { filters, setFilters, reset } = useAuditFiltersFromUrl();

  const hasFilters = Boolean(
    filters.actor || filters.action || filters.from || filters.to,
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <FilterStack label={t('settings.audit.filters.actorLabel')}>
        <Input
          placeholder={t('settings.audit.filters.actorPlaceholder')}
          value={filters.actor}
          onChange={(e) => setFilters({ actor: e.target.value })}
          className="w-56"
        />
      </FilterStack>

      <FilterStack label={t('settings.audit.filters.actionLabel')}>
        <Select
          value={filters.action || 'all'}
          onValueChange={(v) =>
            setFilters({ action: (v === 'all' ? '' : (v as AuditAction)) })
          }
        >
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('settings.audit.filters.actionAll')}</SelectItem>
            {AUDIT_ACTIONS.map((action) => (
              <SelectItem key={action} value={action}>
                {t(`settings.audit.actions.${action}`, action)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterStack>

      <FilterStack label={t('settings.audit.filters.fromLabel')}>
        <Input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters({ from: e.target.value })}
          className="w-44"
        />
      </FilterStack>

      <FilterStack label={t('settings.audit.filters.toLabel')}>
        <Input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters({ to: e.target.value })}
          className="w-44"
        />
      </FilterStack>

      {hasFilters ? (
        <Button variant="outline" size="sm" onClick={reset}>
          <X className="size-3.5" aria-hidden />
          {t('settings.audit.filters.clear')}
        </Button>
      ) : null}
    </div>
  );
}
