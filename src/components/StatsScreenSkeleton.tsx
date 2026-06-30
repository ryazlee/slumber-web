import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

export default function StatsScreenSkeleton() {
  return (
    <Stack spacing={2} aria-label="Loading stats">
      <Skeleton variant="rounded" width={72} height={11} sx={{ mt: 0.5 }} />
      <Skeleton variant="rounded" height={168} />

      <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
        <Skeleton variant="rounded" width="31%" height={64} />
        <Skeleton variant="rounded" width="31%" height={64} />
        <Skeleton variant="rounded" width="31%" height={64} />
      </Stack>

      <Skeleton variant="rounded" width={120} height={11} sx={{ mt: 0.5 }} />
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} variant="rounded" width="23%" height={72} />
        ))}
      </Stack>

      <Skeleton variant="rounded" width={64} height={11} sx={{ mt: 0.5 }} />
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} variant="rounded" width="31%" height={72} />
        ))}
      </Stack>
    </Stack>
  );
}
