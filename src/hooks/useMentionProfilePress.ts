import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserIdByUsername } from '../lib/profile';

/** Resolve @username taps to profile navigation. */
export function useMentionProfilePress() {
  const navigate = useNavigate();
  return useCallback(async (username: string) => {
    const userId = await getUserIdByUsername(username);
    if (userId) navigate(`/profile/${userId}`);
  }, [navigate]);
}
