import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import type { Role, StaffStatus } from '@/types/domain';

export interface StaffFiltersValue {
  search: string;
  role: Role | 'all';
  status: StaffStatus | 'all';
}

interface Props {
  value: StaffFiltersValue;
  onChange: (next: StaffFiltersValue) => void;
}

const ROLES: Array<Role | 'all'> = ['all', 'owner', 'finance_manager', 'operator', 'viewer'];
const STATUSES: Array<StaffStatus | 'all'> = ['all', 'active', 'inactive', 'pending'];

export function StaffFilters({ value, onChange }: Props) {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState(value.search);
  const debounced = useDebounce(searchInput, 200);

  // Sync external search value back into the input (e.g. URL change).
  useEffect(() => {
    setSearchInput(value.search);
  }, [value.search]);

  // Push debounced changes back up.
  useEffect(() => {
    if (debounced !== value.search) {
      onChange({ ...value, search: debounced });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className="mb-4 flex flex-col gap-2 py-3 md:flex-row md:items-center md:gap-3">
      <div className="relative flex-1 md:max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t('staff.list.searchPlaceholder')}
          className="pl-9"
          aria-label={t('staff.list.searchPlaceholder')}
        />
      </div>

      <Select
        value={value.role}
        onValueChange={(next) => onChange({ ...value, role: next as Role | 'all' })}
      >
        <SelectTrigger className="md:w-48" aria-label={t('staff.list.columns.role')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((r) => (
            <SelectItem key={r} value={r}>
              {r === 'all' ? t('staff.list.roleAll') : t(`roles.${r}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.status}
        onValueChange={(next) => onChange({ ...value, status: next as StaffStatus | 'all' })}
      >
        <SelectTrigger className="md:w-48" aria-label={t('staff.list.columns.status')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s === 'all' ? t('staff.list.statusAll') : t(`status.${s}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
