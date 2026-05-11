import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WriteButton } from '@/components/unipay/WriteButton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Props {
  totalRows: number;
  okCount: number;
  onCommit: (reason?: string) => Promise<void>;
  onBack: () => void;
  committing: boolean;
  committed: boolean;
}

const NEEDS_REASON_THRESHOLD = 100;

export function Step4Confirm({ totalRows, okCount, onCommit, onBack, committing, committed }: Props) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const needsReason = okCount > NEEDS_REASON_THRESHOLD;
  const canCommit = !needsReason || reason.trim().length >= 20;

  if (committed) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6 text-center">
          <CheckCircle2 className="mx-auto size-12 text-success-700" aria-hidden />
          <h2 className="text-lg font-semibold">{t('students.import.step4.success')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('students.import.step4.body', { count: okCount })}
          </p>
          <Button asChild>
            <Link to="/students">{t('students.import.step4.goToList')}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <h2 className="text-lg font-semibold">{t('students.import.step4.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('students.import.step4.body', { count: okCount })}
        </p>

        {needsReason ? (
          <div className="space-y-2">
            <Label htmlFor="import-reason" className="text-sm font-medium">
              {t('common.reasonLabel', { count: 20 })}
            </Label>
            <Textarea
              id="import-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={t('students.import.step4.reasonHint')}
            />
            <p
              className={cn(
                'text-sm',
                reason.trim().length >= 20 ? 'text-success-700' : 'text-muted-foreground',
              )}
            >
              {reason.trim().length} / 20
            </p>
          </div>
        ) : null}

        {committing ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t('students.import.step4.progress', { done: okCount, total: totalRows })}
            </div>
            <Progress value={75} />
          </div>
        ) : null}

        <div className="flex flex-wrap justify-between gap-2">
          <Button type="button" variant="ghost" onClick={onBack} disabled={committing}>
            {t('students.import.step2.cancel')}
          </Button>
          <WriteButton
            type="button"
            disabled={!canCommit || committing}
            loading={committing}
            onClick={() => void onCommit(needsReason ? reason.trim() : undefined)}
          >
            {t('students.import.step4.commit', { count: okCount })}
          </WriteButton>
        </div>
      </CardContent>
    </Card>
  );
}
