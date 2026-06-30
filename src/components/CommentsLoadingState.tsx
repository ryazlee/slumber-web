import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

type Props = {
  rows?: number;
};

export default function CommentsLoadingState({ rows = 2 }: Props) {
  return (
    <Stack
      spacing={1.25}
      sx={{ py: 0.5, pb: 1 }}
      aria-label="Loading comments"
    >
      {Array.from({ length: rows }, (_, index) => (
        <Stack key={index} direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
          <Skeleton variant="circular" width={28} height={28} />
          <Stack spacing={1} sx={{ flex: 1, pt: 0.25 }}>
            <Skeleton variant="rounded" width={88} height={10} />
            <Skeleton
              variant="rounded"
              width={index % 2 === 0 ? '62%' : '84%'}
              height={10}
              sx={{ opacity: 0.75 }}
            />
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}
