export type CompareParticipant = {
  id: string;
  username: string;
  avatarUrl?: string;
  userRoles?: string[];
  isSelf: boolean;
};
