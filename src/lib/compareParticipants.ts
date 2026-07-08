import type { CompareParticipant } from './compareTypes';
import type { WebFriend } from './types';

/** Build compare columns from saved selection — self uses auth user id so selection always matches. */
export function buildCompareParticipants(
  userId: string | undefined,
  me: CompareParticipant | null,
  friends: WebFriend[],
  selectedPeople: string[],
): CompareParticipant[] {
  if (!userId) return [];

  const selected = new Set(selectedPeople);
  const list: CompareParticipant[] = [];

  if (selected.has(userId)) {
    list.push(
      me && me.id === userId
        ? me
        : {
          id: userId,
          username: me?.username ?? 'you',
          avatarUrl: me?.avatarUrl,
          userRoles: me?.userRoles,
          isSelf: true,
        },
    );
  }

  for (const friend of friends) {
    if (friend.id === userId || !selected.has(friend.id)) continue;
    list.push({
      id: friend.id,
      username: friend.username,
      avatarUrl: friend.avatarUrl,
      userRoles: friend.userRoles,
      isSelf: false,
    });
  }

  return list;
}

export function shouldShowCompareTable(
  participants: CompareParticipant[],
  activeMetricCount: number,
): boolean {
  return activeMetricCount > 0 && participants.length > 0;
}
