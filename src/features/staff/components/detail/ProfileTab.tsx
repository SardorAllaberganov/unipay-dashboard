import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WriteButton } from '@/components/unipay/WriteButton';
import { formatDate, formatDateTime, formatRelative } from '@/lib/format';
import type { StaffMember } from '@/types/domain';
import { editProfileSchema, type EditProfileValues } from '../../schemas';
import { useUpdateStaffProfile } from '../../hooks/useStaffMutations';
import { useStaffById } from '../../hooks/useStaffById';
import { StaffAvatar } from '../shared/StaffAvatar';

interface Props {
  staff: StaffMember;
  /** When true, the editable section starts in edit mode (defaults to false). */
  initialEdit?: boolean;
}

const LOCALES = ['ru', 'uz'] as const;
const TIMEZONES = ['Asia/Tashkent', 'Asia/Samarkand', 'UTC'];

function ReadField({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-foreground">{value || '—'}</div>
    </div>
  );
}

export function ProfileTab({ staff, initialEdit }: Props) {
  const { t } = useTranslation();
  const schema = useMemo(() => editProfileSchema(t), [t]);
  const mutation = useUpdateStaffProfile();
  const [editing, setEditing] = useState(!!initialEdit);

  // Copy-to-clipboard for the staff member id (mono).
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  // Resolve the inviter so "Приглашён" can render "Имя Фамилия [ID]" and link to their profile.
  // useStaffById is a no-op when invitedBy is undefined (its `enabled` guard handles that).
  const inviterQuery = useStaffById(staff.invitedBy);
  const inviter = inviterQuery.data;

  const form = useForm<EditProfileValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: staff.fullName,
      email: staff.email,
      phone: staff.phone ?? '',
      locale: staff.locale,
      timezone: staff.timezone ?? 'Asia/Tashkent',
    },
  });

  useEffect(() => {
    form.reset({
      fullName: staff.fullName,
      email: staff.email,
      phone: staff.phone ?? '',
      locale: staff.locale,
      timezone: staff.timezone ?? 'Asia/Tashkent',
    });
  }, [staff, form]);

  const onSubmit = async (values: EditProfileValues): Promise<void> => {
    try {
      await mutation.mutateAsync({
        id: staff.id,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone || undefined,
        locale: values.locale,
        timezone: values.timezone || undefined,
      });
      toast.success(t('staff.profileTab.successToast'));
      setEditing(false);
    } catch {
      toast.error(t('staff.profileTab.errorToast'));
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(staff.id);
    } catch {
      // Non-secure context fallback.
      const tex = document.createElement('textarea');
      tex.value = staff.id;
      document.body.appendChild(tex);
      tex.select();
      try {
        document.execCommand('copy');
      } finally {
        document.body.removeChild(tex);
      }
    }
    if (typeof navigator.vibrate === 'function') navigator.vibrate(10);
    toast.success(t('common.actions.copied'));
    setCopied(true);
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className="p-5">
      {/* Identity header — avatar + name + email. Always visible regardless of edit state
         (the avatar/name don't change inline; rename happens via the editable section below). */}
      <div className="flex items-start gap-4 border-b border-border pb-5">
        <StaffAvatar
          fullName={staff.fullName}
          email={staff.email}
          size="lg"
          className="shrink-0"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="truncate text-base font-semibold text-foreground">
            {staff.fullName || staff.email}
          </h2>
          <p className="truncate text-sm text-muted-foreground">{staff.email}</p>
        </div>
      </div>

      {/* Editable personal info. Read view shows fields as static text + Edit button;
         edit view swaps to RHF + Inputs with Save / Cancel. */}
      <div className="border-b border-border py-5">
        {!editing ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReadField
                label={t('staff.profileTab.fullNameLabel')}
                value={staff.fullName}
              />
              <ReadField
                label={t('staff.identityCard.email')}
                value={staff.email}
              />
              <ReadField
                label={t('staff.profileTab.phoneLabel')}
                value={staff.phone ?? '—'}
              />
              <ReadField
                label={t('staff.profileTab.localeLabel')}
                value={staff.locale ? staff.locale.toUpperCase() : '—'}
              />
              <ReadField
                label={t('staff.profileTab.timezoneLabel')}
                value={staff.timezone ?? 'Asia/Tashkent'}
                className="sm:col-span-2"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              {t('staff.profileTab.editButton')}
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="profile-fullName">
                  {t('staff.profileTab.fullNameLabel')}
                </Label>
                <Input id="profile-fullName" {...form.register('fullName')} />
                {form.formState.errors.fullName ? (
                  <p className="text-sm text-danger-700">
                    {form.formState.errors.fullName.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-email">
                  {t('staff.identityCard.email')}
                </Label>
                <Input
                  id="profile-email"
                  type="email"
                  autoComplete="off"
                  {...form.register('email')}
                />
                {form.formState.errors.email ? (
                  <p className="text-sm text-danger-700">
                    {form.formState.errors.email.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-phone">
                  {t('staff.profileTab.phoneLabel')}
                </Label>
                <Input
                  id="profile-phone"
                  type="tel"
                  placeholder={t('staff.profileTab.phonePlaceholder')}
                  {...form.register('phone')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-locale">
                  {t('staff.profileTab.localeLabel')}
                </Label>
                <Select
                  value={form.watch('locale') ?? undefined}
                  onValueChange={(v) =>
                    form.setValue('locale', v as 'ru' | 'uz', {
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger id="profile-locale">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCALES.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-timezone">
                  {t('staff.profileTab.timezoneLabel')}
                </Label>
                <Select
                  value={form.watch('timezone') || 'Asia/Tashkent'}
                  onValueChange={(v) =>
                    form.setValue('timezone', v, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="profile-timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <WriteButton type="submit" loading={mutation.isPending}>
                {t('staff.profileTab.saveButton')}
              </WriteButton>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setEditing(false);
                }}
                disabled={mutation.isPending}
              >
                {t('staff.profileTab.cancelButton')}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* System metadata — read-only always. Email is editable in the section above. */}
      <div className="pt-5">
        <h3 className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">
          {t('staff.identityCard.title')}
        </h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ReadField
            label={t('staff.identityCard.memberId')}
            value={
              <button
                type="button"
                onClick={() => void handleCopyId()}
                className="group inline-flex max-w-full items-center gap-2 rounded-md -mx-2 px-2 py-1 text-left hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                aria-label={`${t('common.actions.copy')}: ${staff.id}`}
              >
                <span className="truncate font-mono text-xs">{staff.id}</span>
                {copied ? (
                  <Check
                    className="size-3.5 shrink-0 text-success-700"
                    aria-hidden
                  />
                ) : (
                  <Copy
                    className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                    aria-hidden
                  />
                )}
                <span className="sr-only" role="status" aria-live="polite">
                  {copied ? t('common.actions.copied') : ''}
                </span>
              </button>
            }
          />
          <ReadField
            label={t('staff.identityCard.createdAt')}
            value={formatDate(staff.createdAt)}
          />
          <ReadField
            label={t('staff.identityCard.lastLoginAt')}
            value={
              staff.lastLoginAt ? (
                <>
                  <span className="tabular">
                    {formatDateTime(staff.lastLoginAt)}
                  </span>
                  <p className="mt-0.5 text-sm font-normal text-muted-foreground tabular">
                    {formatRelative(staff.lastLoginAt)}
                  </p>
                </>
              ) : (
                t('staff.identityCard.lastLoginNever')
              )
            }
          />
          <ReadField
            label={t('staff.identityCard.createdBy')}
            value={
              staff.invitedBy ? (
                <Link
                  to={`/staff/${staff.invitedBy}`}
                  className="inline-flex max-w-full flex-wrap items-baseline gap-1.5 text-sm font-medium text-brand-700 hover:underline dark:text-brand-300"
                >
                  <span className="truncate">
                    {inviter?.fullName || inviter?.email || staff.invitedBy}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    [{staff.invitedBy}]
                  </span>
                </Link>
              ) : (
                t('staff.identityCard.createdByUnknown')
              )
            }
            className="sm:col-span-2"
          />
        </dl>
      </div>
    </Card>
  );
}
