import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { LogoUploader } from '@/components/shared/LogoUploader';
import { ColorPicker } from '@/components/shared/ColorPicker';
import { ReceiptPreview } from '@/components/shared/ReceiptPreview';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { WriteButton } from '@/components/unipay/WriteButton';
import { useNetworkState } from '@/hooks/useNetworkState';
import {
  PanelErrorState,
  PanelOfflineNote,
  PanelOfflineState,
} from '@/components/shared/PanelStates';
import { brandingSchema, type BrandingValues } from '../schemas';
import { useBranding } from '../hooks/useBranding';
import { useUpdateBranding } from '../hooks/useUpdateBranding';
import { useOrganization } from '../hooks/useOrganization';

const RECEIPT_FOOTER_MAX = 200;
const LOGO_MAX = 2 * 1024 * 1024;

export default function BrandingPage() {
  const { t } = useTranslation();
  const brandingQuery = useBranding();
  const orgQuery = useOrganization();
  const updateMutation = useUpdateBranding();
  const online = useNetworkState();
  const [deleteLogoOpen, setDeleteLogoOpen] = useState(false);

  const schema = useMemo(() => brandingSchema(t), [t]);
  const form = useForm<BrandingValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      logoDataUrl: '',
      primaryColor: '#1558B0',
      receiptFooter: '',
    },
  });

  useEffect(() => {
    if (!brandingQuery.data) return;
    form.reset({
      logoDataUrl: brandingQuery.data.logoDataUrl,
      primaryColor: brandingQuery.data.primaryColor,
      receiptFooter: brandingQuery.data.receiptFooter,
    });
  }, [brandingQuery.data, form]);

  const watched = form.watch();

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({
        logoDataUrl: values.logoDataUrl,
        primaryColor: values.primaryColor,
        receiptFooter: values.receiptFooter,
      });
      toast.success(t('organization.branding.savedToast'));
    } catch {
      toast.error(t('organization.branding.saveErrorToast'));
    }
  });

  const onDeleteLogo = async () => {
    form.setValue('logoDataUrl', '', { shouldDirty: true });
    try {
      await updateMutation.mutateAsync({ logoDataUrl: '' });
      toast.success(t('organization.branding.logoDeletedToast'));
      setDeleteLogoOpen(false);
    } catch {
      toast.error(t('organization.branding.logoDeleteErrorToast'));
    }
  };

  // ----- 6 states -----
  if (brandingQuery.isPending) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }
  if (brandingQuery.isError && !brandingQuery.data) {
    if (!online) return <PanelOfflineState />;
    return <PanelErrorState onRetry={() => brandingQuery.refetch()} />;
  }
  if (!brandingQuery.data) {
    return <PanelOfflineState />;
  }

  const orgName = orgQuery.data?.name.ru ?? '';

  return (
    <>
      {!online ? <PanelOfflineNote className="mb-4" /> : null}

      <Form {...form}>
        <form onSubmit={onSubmit} className="grid gap-6 md:grid-cols-2">
          {/* LEFT — Inputs */}
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="logoDataUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('organization.branding.logoLabel')}</FormLabel>
                  <FormControl>
                    <LogoUploader
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      maxSizeBytes={LOGO_MAX}
                      minDimensions={{ width: 256, height: 256 }}
                      labels={{
                        dropHint: t('organization.branding.logoDropHint'),
                        choose: t('organization.branding.logoChoose'),
                        remove: t('organization.branding.logoRemove'),
                        errorType: t('organization.branding.errors.logoType'),
                        errorSize: t('organization.branding.errors.logoSize'),
                        errorDimensions: t('organization.branding.errors.logoDimensions'),
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {brandingQuery.data.logoDataUrl ? (
              <WriteButton
                variant="destructive"
                size="sm"
                onClick={() => setDeleteLogoOpen(true)}
              >
                <Trash2 className="size-4" aria-hidden />
                {t('organization.branding.deleteLogoCta')}
              </WriteButton>
            ) : null}

            <FormField
              control={form.control}
              name="primaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('organization.branding.primaryColorLabel')}</FormLabel>
                  <FormControl>
                    <ColorPicker value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    {t('organization.branding.primaryColorHint')}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receiptFooter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('organization.branding.receiptFooterLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      maxLength={RECEIPT_FOOTER_MAX}
                      placeholder={t('organization.branding.receiptFooterPlaceholder')}
                    />
                  </FormControl>
                  <div className="tabular text-sm text-muted-foreground">
                    {(field.value ?? '').length} / {RECEIPT_FOOTER_MAX}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <WriteButton type="submit" loading={updateMutation.isPending}>
                {t('common.actions.save')}
              </WriteButton>
            </div>
          </div>

          {/* RIGHT — Receipt preview */}
          <aside className="space-y-3">
            <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {t('organization.branding.previewLabel')}
            </div>
            <ReceiptPreview
              orgName={orgName}
              logoDataUrl={watched.logoDataUrl}
              primaryColor={watched.primaryColor}
              receiptFooter={watched.receiptFooter}
            />
          </aside>
        </form>
      </Form>

      <ConfirmDialog
        open={deleteLogoOpen}
        onOpenChange={setDeleteLogoOpen}
        title={t('organization.branding.deleteLogoTitle')}
        description={t('organization.branding.deleteLogoBody')}
        destructive
        requireReason
        loading={updateMutation.isPending}
        onConfirm={onDeleteLogo}
        confirmLabel={t('organization.branding.deleteLogoCta')}
      />
    </>
  );
}
