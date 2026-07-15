export type HomeScreenshot = {
  src: string;
  alt: string;
  caption: string;
  description: string;
};

const base = import.meta.env.BASE_URL;

export const homeScreenshots: HomeScreenshot[] = [
  {
    src: `${base}screenshots/feed.png`,
    alt: 'Slumber feed with friends sleep posts, hypnograms, vibes, and dream logs',
    caption: 'Feed',
    description: 'Friends\' nights with hypnograms, vibes, PR badges, and dream logs.',
  },
  {
    src: `${base}screenshots/post-detail.png`,
    alt: 'Sleep post detail with hypnogram and stage breakdown',
    caption: 'Post detail',
    description: 'Full hypnogram, stage mix, bedtime, and wake details for the night.',
  },
  {
    src: `${base}screenshots/stats.png`,
    alt: 'My Stats with 30-day averages, stage mix, and personal records',
    caption: 'Stats',
    description: '30-day averages, stage mix, trends, and your personal records.',
  },
  {
    src: `${base}screenshots/compare.png`,
    alt: 'Compare tab with side-by-side sleep stats between friends',
    caption: 'Compare',
    description: 'Side-by-side sleep metrics next to friends for easy compare.',
  },
  {
    src: `${base}screenshots/challenges.png`,
    alt: 'Sleep challenge details with leaderboard and contributing posts',
    caption: 'Challenges',
    description: 'Race friends for most sleep logged, with ranks and contributing posts.',
  },
];
