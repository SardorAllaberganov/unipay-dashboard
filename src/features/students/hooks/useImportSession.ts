import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { ImportRow, ImportSession } from '@/types/domain';
import { studentsApi } from '../api';

/**
 * State container for the import wizard's multi-step session. Holds the active
 * `ImportSession`, the local copy of its rows (patched as the user inline-edits
 * during Step 3 Review), and the upload/commit mutations.
 */
export function useImportSession() {
  const [session, setSession] = useState<ImportSession | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);

  const parse = useMutation({
    mutationFn: (file: File) => studentsApi.importParse(file),
    onSuccess: (data) => {
      setSession(data);
      setRows(data.rows);
    },
  });

  const patchRow = useMutation({
    mutationFn: ({ index, patch }: { index: number; patch: Partial<ImportRow['raw']> }) => {
      if (!session) throw new Error('no_session');
      return studentsApi.importPatchRow(session.id, index, patch);
    },
    onSuccess: (data) => {
      setRows((prev) => {
        const next = [...prev];
        const idx = next.findIndex((r) => r.index === data.index);
        if (idx !== -1) next[idx] = data;
        return next;
      });
    },
  });

  const commit = useMutation({
    mutationFn: (reason?: string) => {
      if (!session) throw new Error('no_session');
      return studentsApi.importCommit(session.id, reason);
    },
  });

  const errorReport = useMutation({
    mutationFn: () => {
      if (!session) throw new Error('no_session');
      return studentsApi.importErrorReport(session.id);
    },
  });

  const reset = useCallback(() => {
    setSession(null);
    setRows([]);
    parse.reset();
    patchRow.reset();
    commit.reset();
    errorReport.reset();
  }, [parse, patchRow, commit, errorReport]);

  const okCount = rows.filter((r) => r.errors.length === 0).length;
  const errorCount = rows.length - okCount;

  return {
    session,
    rows,
    okCount,
    errorCount,
    parse,
    patchRow,
    commit,
    errorReport,
    reset,
  };
}
