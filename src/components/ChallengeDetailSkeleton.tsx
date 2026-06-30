import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { AVATAR_SIZE } from './Avatar';

export default function ChallengeDetailSkeleton() {
  return (
    <Stack spacing={1.5} aria-label="Loading challenge">
      <Skeleton variant="rounded" width="70%" height={22} />
      <Skeleton variant="rounded" width={120} height={12} sx={{ opacity: 0.75 }} />
      <Skeleton variant="rounded" width="55%" height={12} sx={{ opacity: 0.75 }} />

      <Stack spacing={1.25} sx={{ mt: 1 }}>
        {Array.from({ length: 3 }, (_, i) => (
          <Stack key={i} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Skeleton variant="circular" width={AVATAR_SIZE.row} height={AVATAR_SIZE.row} />
            <Stack spacing={1} sx={{ flex: 1 }}>
              <Skeleton variant="rounded" width={96} height={12} />
              <Skeleton variant="rounded" width="100%" height={8} />
            </Stack>
            <Skeleton variant="rounded" width={48} height={12} />
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
