import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import SkeletonLoadingShell from './SkeletonLoadingShell';
import { AVATAR_SIZE } from './Avatar';

type Props = {
  columns?: number;
  rows?: number;
  withSpinner?: boolean;
};

export default function CompareTableSkeleton({
  columns = 3,
  rows = 6,
  withSpinner = true,
}: Props) {
  const content = (
    <Box aria-label={withSpinner ? undefined : 'Loading compare table'}>
      <Skeleton variant="rounded" width={160} height={14} sx={{ mb: 1.5 }} />

      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 1.5,
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ width: 88, flexShrink: 0, minHeight: 72, borderRight: 1, borderColor: 'divider' }} />
          {Array.from({ length: columns }, (_, i) => (
            <Stack
              key={i}
              spacing={0.75}
              sx={{
                flex: 1,
                minWidth: 72,
                minHeight: 72,
                p: 0.75,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Skeleton variant="circular" width={AVATAR_SIZE.tab} height={AVATAR_SIZE.tab} />
              <Skeleton variant="rounded" width={40} height={9} />
            </Stack>
          ))}
        </Stack>

        {Array.from({ length: rows }, (_, rowIndex) => (
          <Stack
            key={rowIndex}
            direction="row"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Box
              sx={{
                width: 88,
                flexShrink: 0,
                minHeight: 40,
                display: 'flex',
                alignItems: 'center',
                pl: 1,
                borderRight: 1,
                borderColor: 'divider',
              }}
            >
              <Skeleton variant="rounded" width={56} height={10} />
            </Box>
            {Array.from({ length: columns }, (_, colIndex) => (
              <Box
                key={colIndex}
                sx={{
                  flex: 1,
                  minWidth: 72,
                  minHeight: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Skeleton variant="rounded" width={36} height={10} sx={{ opacity: 0.8 }} />
              </Box>
            ))}
          </Stack>
        ))}
      </Box>
    </Box>
  );

  if (!withSpinner) return content;

  return (
    <SkeletonLoadingShell aria-label="Loading compare table">
      {content}
    </SkeletonLoadingShell>
  );
}
