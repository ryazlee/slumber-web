import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { AVATAR_SIZE } from './Avatar';

export default function ProfileHeroSkeleton() {
  return (
    <Stack spacing={1} sx={{ py: 3, pb: 4, alignItems: 'center' }} aria-label="Loading profile">
      <Skeleton variant="circular" width={AVATAR_SIZE.hero} height={AVATAR_SIZE.hero} />
      <Skeleton variant="rounded" width={140} height={18} sx={{ mt: 0.5 }} />
      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
        <Skeleton variant="rounded" width={72} height={12} />
        <Skeleton variant="rounded" width={88} height={12} />
      </Stack>
    </Stack>
  );
}
