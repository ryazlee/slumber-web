import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { AVATAR_SIZE } from './Avatar';

type Props = {
  rows?: number;
};

export default function UserListRowsSkeleton({ rows = 4 }: Props) {
  return (
    <Stack aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <Stack
          key={index}
          direction="row"
          spacing={1.5}
          sx={{ py: 1, alignItems: 'center' }}
        >
          <Skeleton variant="circular" width={AVATAR_SIZE.row} height={AVATAR_SIZE.row} />
          <Stack spacing={1} sx={{ flex: 1 }}>
            <Skeleton variant="rounded" width={120} height={12} />
            <Skeleton
              variant="rounded"
              width={index % 2 === 0 ? '55%' : '72%'}
              height={10}
              sx={{ opacity: 0.75 }}
            />
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}
