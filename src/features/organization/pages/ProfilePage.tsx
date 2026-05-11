import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ReceiptPreview } from '@/components/shared/ReceiptPreview';
import { WriteButton } from '@/components/unipay/WriteButton';
import { useNetworkState } from '@/hooks/useNetworkState';
import { LEGAL_FORMS } from '@/types/domain';
import { UZ_REGIONS } from '@/features/onboarding/fixtures/uzRegions';
import {
  PanelErrorState,
  PanelOfflineState,
  PanelPartialNote,
} from '@/components/shared/PanelStates';
import { profileSchema, type ProfileValues } from '../schemas';
import { useOrganization } from '../hooks/useOrganization';
import { useUpdateOrganization } from '../hooks/useUpdateOrganization';
import { useBranding } from '../hooks/useBranding';

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const orgQuery = useOrganization();
  const brandingQuery = useBranding();
  const updateMutation = useUpdateOrganization();
  const online = useNetworkState();

  const schema = useMemo(() => profileSchema(t), [t]);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nameRu: '',
      nameUz: '',
      nameEn: '',
      legalForm: 'llc',
      region: '',
      address: '',
      website: '',
      foundedYear: undefined,
    },
  });

  // Hydrate form when org data arrives.
  useEffect(() => {
    if (!orgQuery.data) return;
    form.reset({
      nameRu: orgQuery.data.name.ru,
      nameUz: orgQuery.data.name.uz ?? '',
      nameEn: orgQuery.data.name.en ?? '',
      legalForm: orgQuery.data.legalForm,
      region: orgQuery.data.region,
      address: orgQuery.data.address,
      website: orgQuery.data.website,
      foundedYear: orgQuery.data.foundedYear,
    });
  }, [orgQuery.data, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!orgQuery.data) return;
    try {
      await updateMutation.mutateAsync({
        name: {
          ru: values.nameRu,
          uz: values.nameUz || undefined,
          en: values.nameEn || undefined,
        },
        legalForm: values.legalForm,
        region: values.region,
        address: values.address,
        website: values.website ?? '',
        foundedYear: values.foundedYear,
      });
      toast.success(t('organization.profile.savedToast'));
    } catch {
      toast.error(t('organization.profile.saveErrorToast'));
    }
  });

  // ----- 6 states -----
  if (orgQuery.isPending) {
    return <ProfileSkeleton />;
  }
  if (orgQuery.isError) {
    if (!online && !orgQuery.data) {
      return <PanelOfflineState />;
    }
    return <PanelErrorState onRetry={() => orgQuery.refetch()} />;
  }
  if (!orgQuery.data) {
    return <PanelOfflineState />;
  }

  const org = orgQuery.data;
  const branding = brandingQuery.data;
  const regionLocale = i18n.language === 'uz' ? 'uz' : 'ru';

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {!online && orgQuery.data ? (
        <PanelPartialNote shown={1} total={1} />
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        {/* LEFT — General */}
        <div className="space-y-4">
          <Form {...form}>
            <FormField
              control={form.control}
              name="nameRu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('organization.profile.nameRuLabel')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nameUz"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('organization.profile.nameUzLabel')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nameEn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('organization.profile.nameEnLabel')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormItem>
                <FormLabel>{t('organization.profile.typeLabel')}</FormLabel>
                <FormControl>
                  <Input
                    value={t(`organization.orgTypes.${org.type}`)}
                    readOnly
                    disabled
                  />
                </FormControl>
              </FormItem>

              <FormItem>
                <FormLabel>{t('organization.profile.tinLabel')}</FormLabel>
                <FormControl>
                  <Input value={org.tin} readOnly disabled className="tabular" />
                </FormControl>
              </FormItem>
            </div>

            <FormField
              control={form.control}
              name="legalForm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('organization.profile.legalFormLabel')}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEGAL_FORMS.map((v) => (
                          <SelectItem key={v} value={v}>
                            {t(`organization.legalForms.${v}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('organization.profile.regionLabel')}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UZ_REGIONS.map((r) => (
                          <SelectItem key={r.code} value={r.code}>
                            {regionLocale === 'uz' ? r.nameUz : r.nameRu}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('organization.profile.addressLabel')}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('organization.profile.websiteLabel')}</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="foundedYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('organization.profile.foundedYearLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1900}
                        max={new Date().getFullYear()}
                        className="tabular"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? undefined : Number(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </div>

        {/* RIGHT — Branding preview */}
        <aside className="space-y-4">
          <div className="space-y-3 rounded-xl border border-border bg-card p-5">
            <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {t('organization.profile.brandingPreviewLabel')}
            </div>
            <div className="flex items-center gap-3">
              {branding?.logoDataUrl ? (
                <img
                  src={branding.logoDataUrl}
                  alt=""
                  className="size-32 rounded-lg border border-border object-contain"
                />
              ) : (
                <div className="flex size-32 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                  {t('organization.profile.noLogo')}
                </div>
              )}
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {t('organization.profile.primaryColorLabel')}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="inline-block size-6 rounded border border-border"
                    style={{ backgroundColor: branding?.primaryColor ?? '#1558B0' }}
                  />
                  <span className="font-mono tabular text-sm uppercase">
                    {branding?.primaryColor ?? '#1558B0'}
                  </span>
                </div>
              </div>
            </div>
            <Link
              to="/organization/branding"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline dark:text-brand-300"
            >
              {t('organization.profile.editBrandingLink')}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <ReceiptPreview
            orgName={form.watch('nameRu') || org.name.ru}
            logoDataUrl={branding?.logoDataUrl}
            primaryColor={branding?.primaryColor}
            receiptFooter={branding?.receiptFooter}
          />
        </aside>
      </div>

      <div className="flex justify-end">
        <WriteButton type="submit" loading={updateMutation.isPending}>
          {t('organization.profile.saveCta')}
        </WriteButton>
      </div>
    </form>
  );
}

function ProfileSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <aside>
        <Skeleton className="h-64 w-full rounded-xl" />
      </aside>
    </div>
  );
}
