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
    alt: 'Slumber feed showing friends sleep posts with hypnograms, vibes, and kudos',
    caption: 'Feed',
    description: 'Friends\' nights with hypnograms, morning vibes, PR badges, kudos, and comments.',
  },
  {
    src: `${base}screenshots/post-detail.png`,
    alt: 'Sleep post detail with nap day sessions, stage percentages, and dream mood',
    caption: 'Post detail',
    description: 'Per-session hypnograms on nap days, stage mix with percentages, and dream mood.',
  },
  {
    src: `${base}screenshots/challenges.png`,
    alt: 'Sleep challenge leaderboard and contributing posts',
    caption: 'Challenges',
    description: 'Group races with progress bars and logged nights.',
  },
  {
    src: `${base}screenshots/stats.png`,
    alt: 'My Stats with weekly sleep chart and 30-day averages',
    caption: 'Stats',
    description: 'Weekly chart, 30-day averages, stage mix, and personal records.',
  },
  {
    src: `${base}screenshots/compare.png`,
    alt: 'Compare tab showing sleep metrics between friends',
    caption: 'Compare',
    description: 'Side-by-side sleep stats with friends over any period.',
  },
];
