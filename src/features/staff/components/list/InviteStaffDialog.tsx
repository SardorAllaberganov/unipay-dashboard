import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResponsiveSheet } from '@/components/shared/ResponsiveSheet';
import { WriteButton } from '@/components/unipay/WriteButton';
import { STAFF_INVITABLE_ROLES } from '@/types/domain';
import { inviteStaffSchema, type InviteStaffValues } from '../../schemas';
import { useInviteStaff } from '../../hooks/useStaffMutations';
import { DepartmentTreePicker } from '../shared/DepartmentTreePicker';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteStaffDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const schema = useMemo(() => inviteStaffSchema(t), [t]);
  const inviteMutation = useInviteStaff();

  const form = useForm<InviteStaffValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      fullName: '',
      role: 'operator',
      departmentIds: [],
      note: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        email: '',
        fullName: '',
        role: 'operator',
        departmentIds: [],
        note: '',
      });
    }
  }, [open, form]);

  const onSubmit = async (values: InviteStaffValues): Promise<void> => {
    try {
      await inviteMutation.mutateAsync({
        email: values.email,
        fullName: values.fullName || undefined,
        role: values.role,
        departmentIds: values.departmentIds,
        note: values.note || undefined,
      });
      toast.success(t('staff.invite.successToast', { email: values.email }));
      onOpenChange(false);
    } catch {
      toast.error(t('staff.invite.errorToast'));
    }
  };

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('staff.invite.title')}
      description={t('staff.invite.description')}
      footer={
        <>
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={inviteMutation.isPending}
          >
            {t('common.actions.cancel')}
          </Button>
          <WriteButton
            type="submit"
            form="staff-invite-form"
            loading={inviteMutation.isPending}
          >
            {t('staff.invite.submit')}
          </WriteButton>
        </>
      }
    >
      <form
        id="staff-invite-form"
        onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="invite-email">
            {t('staff.invite.emailLabel')}
          </Label>
          <Input
            id="invite-email"
            type="email"
            autoComplete="off"
            placeholder={t('staff.invite.emailPlaceholder')}
            {...form.register('email')}
          />
          {form.formState.errors.email ? (
            <p className="text-sm text-danger-700">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="invite-name">
            {t('staff.invite.fullNameLabel')}
          </Label>
          <Input
            id="invite-name"
            placeholder={t('staff.invite.fullNamePlaceholder')}
            {...form.register('fullName')}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="invite-role">{t('staff.invite.roleLabel')}</Label>
          <Controller
            control={form.control}
            name="role"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAFF_INVITABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {t(`roles.${r}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t('staff.invite.departmentsLabel')}</Label>
          <Controller
            control={form.control}
            name="departmentIds"
            render={({ field }) => (
              <DepartmentTreePicker
                value={field.value ?? []}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="invite-note">{t('staff.invite.noteLabel')}</Label>
          <Textarea
            id="invite-note"
            rows={3}
            placeholder={t('staff.invite.notePlaceholder')}
            maxLength={300}
            {...form.register('note')}
          />
          {form.formState.errors.note ? (
            <p className="text-sm text-danger-700">
              {form.formState.errors.note.message}
            </p>
          ) : null}
        </div>
      </form>
    </ResponsiveSheet>
  );
}
