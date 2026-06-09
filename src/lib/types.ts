export type StageSegment = {
  type: 'CORE' | 'DEEP' | 'REM' | 'AWAKE' | 'ASLEEP';
  minutes: number;
};

export type SleepPost = {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  title: string;
  sleepDate: string;
  bedtime: string;
  wakeTime: string;
  asleepMinutes: number;
  inBedMinutes: number;
  efficiency: number;
  coreMinutes: number;
  deepMinutes: number;
  remMinutes: number;
  awakeMinutes: number;
  stageSegments: StageSegment[];
  tags: string[];
  dreamLog?: string;
  blurDream: boolean;
  notes?: string;
  isPrivate: boolean;
  kudosCount: number;
  commentCount: number;
  isPR: boolean;
  createdAt: string;
  sourceDevice: string;
};

export type WebProfile = {
  id: string;
  username: string;
  avatarUrl?: string;
  friendsCount: number;
  postsCount: number;
  streak: number;
  longestStreak: number;
  avgAsleepMinutes: number;
  bestNightMinutes: number;
  sleepGoalMinutes: number;
  challengeRecord: { wins: number; losses: number; ties: number };
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
  inviteStatus: 'pending' | 'accepted' | 'declined' | 'left';
  role: 'creator' | 'participant';
};

export type Comment = {
  id: string;
  postId: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  text: string;
  createdAt: string;
};

export type KudosUser = {
  id: string;
  username: string;
  avatarUrl?: string;
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
