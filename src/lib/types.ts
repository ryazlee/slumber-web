export type StageSegment = {
  type: 'CORE' | 'DEEP' | 'REM' | 'AWAKE' | 'ASLEEP';
  minutes: number;
};

export type Vibe = 'CHARGED' | 'DRAGGING' | 'ZOMBIE';

export type SleepSessionData = {
  bedtime: string;
  wakeTime: string;
  asleepMinutes: number;
  inBedMinutes: number;
  coreMinutes: number;
  deepMinutes: number;
  remMinutes: number;
  awakeMinutes: number;
  awakeEvents: number;
  segments: StageSegment[];
};

export type SleepPost = {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  userRoles?: string[];
  title: string;
  sleepDate: string;
  bedtime: string;
  wakeTime: string;
  asleepMinutes: number;
  inBedMinutes: number;
  coreMinutes: number;
  deepMinutes: number;
  remMinutes: number;
  awakeMinutes: number;
  awakeEvents: number;
  stageSegments: StageSegment[];
  sessionBreakdown?: SleepSessionData[];
  vibe?: Vibe;
  photoUrls?: string[];
  photoThumbUrls?: string[];
  locationLabel?: string;
  tags: string[];
  dreamLog?: string;
  blurDream: boolean;
  notes?: string;
  isPrivate: boolean;
  kudosCount: number;
  hasKudoed: boolean;
  commentCount: number;
  isPR: boolean;
  prTypes?: string[];
  monthlyPrTypes?: string[];
  createdAt: string;
  sourceDevice: string;
  isCustom?: boolean;
};

export type WebProfile = {
  id: string;
  username: string;
  avatarUrl?: string;
  userRoles?: string[];
  friendsCount: number;
  postsCount: number;
  streak: number;
  longestStreak: number;
  avgAsleepMinutes: number;
  sleepGoalMinutes: number;
  challengeRecord: { wins: number; losses: number; ties: number };
  isOwnProfile: boolean;
  friendStatus: 'none' | 'request_sent' | 'request_received' | 'friends';
};

export type ChallengeStatus =
  | 'pending'
  | 'active'
  | 'pending_completion'
  | 'completed'
  | 'declined'
  | 'cancelled';

export type ChallengeParticipant = {
  userId: string;
  username: string;
  avatarUrl?: string;
  userRoles?: string[];
  inviteStatus: 'pending' | 'accepted' | 'declined' | 'left';
  role: 'creator' | 'participant';
};

export type Comment = {
  id: string;
  postId: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  userRoles?: string[];
  text: string;
  createdAt: string;
};

export type KudosUser = {
  id: string;
  username: string;
  avatarUrl?: string;
  userRoles?: string[];
  createdAt: string;
};

export type Challenge = {
  id: string;
  title: string | null;
  isGroup: boolean;
  goalMinutes: number;
  noExpiration: boolean;
  status: ChallengeStatus;
  createdAt: string;
  startedAt: string | null;
  expiresAt: string | null;
  goalReachedAt: string | null;
  winnerId: string | null;
  participants: ChallengeParticipant[];
};

export type ChallengeProgress = {
  userId: string;
  username: string;
  avatarUrl?: string;
  accruedMinutes: number;
  goalMinutes: number;
  nightsLogged: number;
  expiresAt: string | null;
};

export type ChallengeContributionPost = {
  postId: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  sleepDate: string;
  asleepMinutes: number;
  title: string;
  bedtime: string | null;
  wakeTime: string | null;
  createdAt: string;
  isPrivate: boolean;
};

export type ClubRole = 'owner' | 'admin' | 'member';
export type ClubInviteStatus = 'pending' | 'accepted' | 'declined' | 'left';

export type WebFriend = {
  id: string;
  username: string;
  avatarUrl?: string;
  userRoles?: string[];
  friendsSince: string;
};

export type WebFriendRequest = {
  requesterId: string;
  username: string;
  avatarUrl?: string;
  userRoles?: string[];
  requestedAt: string;
};

export type WebClub = {
  id: string;
  name: string;
  emoji: string | null;
  description: string | null;
  memberCount: number;
  myRole: ClubRole;
  myInviteStatus: ClubInviteStatus;
};

export type WebClubMember = {
  userId: string;
  username: string;
  avatarUrl?: string;
  role: ClubRole;
  inviteStatus: ClubInviteStatus;
};
