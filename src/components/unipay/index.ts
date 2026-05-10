// Domain primitives. Existing shared/ exports re-exposed here under their canonical names.
export { Money } from './Money';
export { MaskedAccount } from './MaskedAccount';
export { WriteButton } from './WriteButton';
export { KeyboardHint } from './KeyboardHint';

// Re-export from shared (canonical home for now; the unipay/ folder is the new public surface).
export { StatusBadge, type StatusBadgeVariant } from '@/components/shared/StatusBadge';
export { ChannelBadge } from '@/components/shared/ChannelBadge';
export { RoleBadge } from '@/components/shared/RoleBadge';
export { BackLink } from '@/components/shared/BackLink';
export { EmptyState } from '@/components/shared/EmptyState';
export { LoadingTable } from '@/components/shared/LoadingTable';
export { LoadingChart } from '@/components/shared/LoadingChart';
export { LoadingCard } from '@/components/shared/LoadingCard';
export { ErrorState } from '@/components/shared/ErrorState';
export { OfflineState as OfflineSurface } from '@/components/shared/OfflineState';

// Layout primitives kept under layout/ for now.
export { DetailHeader } from '@/components/layout/DetailHeader';
export { DetailActionBar } from '@/components/layout/DetailActionBar';
