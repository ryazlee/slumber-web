import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import { AVATAR_SIZE } from './Avatar';

type Props = {
  count?: number;
};

export default function FeedPostsSkeleton({ count = 3 }: Props) {
  return (
    <Stack spacing={1.25} aria-label="Loading posts">
      {Array.from({ length: count }, (_, index) => (
        <Box
          key={index}
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            p: 2,
          }}
        >
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <Skeleton variant="circular" width={AVATAR_SIZE.inline} height={AVATAR_SIZE.inline} />
              <Stack spacing={0.75} sx={{ flex: 1 }}>
                <Skeleton variant="rounded" width={108} height={12} />
                <Skeleton variant="rounded" width={72} height={9} sx={{ opacity: 0.7 }} />
              </Stack>
            </Stack>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Skeleton variant="rounded" width={96} height={24} />
              <Skeleton variant="circular" width={24} height={24} />
            </Stack>
            <Skeleton variant="rounded" height={8} />
            <Stack direction="row" spacing={1.5}>
              <Skeleton variant="rounded" width={64} height={10} />
              <Skeleton variant="rounded" width={52} height={10} />
              <Skeleton variant="rounded" width={58} height={10} />
            </Stack>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
