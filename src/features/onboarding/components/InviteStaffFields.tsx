import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { INVITE_ROLES, type Step5Values } from '../schemas';

interface Props {
  index: number;
  onRemove: () => void;
}

export function InviteStaffFields({ index, onRemove }: Props) {
  const { t } = useTranslation();
  const form = useFormContext<Step5Values>();

  return (
    <div className="space-y-4 rounded-lg border border-border p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t('onboarding.invite.invitationTitle', { num: index + 1 })}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="size-4" aria-hidden />
          {t('common.actions.delete')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name={`invites.${index}.email`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('onboarding.invite.emailLabel')}</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`invites.${index}.role`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('onboarding.invite.roleLabel')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('onboarding.invite.rolePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {INVITE_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {t(`roles.${role}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name={`invites.${index}.note`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('onboarding.invite.noteLabel')}</FormLabel>
            <FormControl>
              <Textarea {...field} rows={2} placeholder={t('onboarding.invite.notePlaceholder')} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
