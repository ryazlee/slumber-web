import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  'aria-label'?: string;
};

/** Spinner row above skeleton placeholders — one per loading surface. */
export default function SkeletonLoadingShell({ children, 'aria-label': ariaLabel }: Props) {
  return (
    <Box aria-label={ariaLabel}>
      <Box sx={{ display: 'flex', justifyContent: 'center', pb: 2 }}>
        <CircularProgress size={22} color="primary" aria-hidden />
      </Box>
      {children}
    </Box>
  );
}
