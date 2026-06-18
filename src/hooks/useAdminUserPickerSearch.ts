import type { UserSearchFilters } from '../lib/admin';
import { useAdminUserSearch } from './useAdmin';

type Options = {
  activeLimit?: number;
  defaultLimit?: number;
  defaultJoinedWithinDays?: number;
  /** Filters used when the search box is empty or below min length. */
  inactive?: UserSearchFilters;
};

export function useAdminUserPickerSearch(trimmedQuery: string, isActive: boolean, options: Options = {}) {
  const {
    activeLimit = 50,
    defaultLimit = 25,
    defaultJoinedWithinDays = 30,
    inactive,
  } = options;

  const inactiveFilters = inactive ?? {
    limit: defaultLimit,
    joinedWithinDays: defaultJoinedWithinDays,
  };

  return useAdminUserSearch(
    isActive
      ? { query: trimmedQuery, limit: activeLimit }
      : inactiveFilters,
  );
}
