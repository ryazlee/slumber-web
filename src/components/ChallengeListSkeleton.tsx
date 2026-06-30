import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

type Props = {
  count?: number;
};

export default function ChallengeListSkeleton({ count = 3 }: Props) {
  return (
    <Stack spacing={1} aria-label="Loading challenges">
      {Array.from({ length: count }, (_, index) => (
        <Box
          key={index}
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1.5,
            p: 1.75,
          }}
        >
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Skeleton variant="rounded" width="62%" height={14} />
              <Skeleton variant="rounded" width={56} height={20} />
            </Stack>
            <Skeleton variant="rounded" width="48%" height={10} sx={{ opacity: 0.75 }} />
            <Stack direction="row" spacing={0.75}>
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton variant="circular" width={24} height={24} />
            </Stack>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
