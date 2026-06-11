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
    alt: 'Slumber feed showing friends sleep posts with hypnograms and kudos',
    caption: 'Feed',
    description: 'Friends\' nights with stage timelines, kudos, and comments.',
  },
  {
    src: `${base}screenshots/post-detail.png`,
    alt: 'Sleep post detail with nap day breakdown and stage stats',
    caption: 'Post detail',
    description: 'Hypnogram, stage mix, and nap-day split sessions.',
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
    description: 'Weekly bars, averages, and stage mix at a glance.',
  },
  {
    src: `${base}screenshots/compare.png`,
    alt: 'Compare tab showing sleep metrics between friends',
    caption: 'Compare',
    description: 'Side-by-side sleep stats with friends over any period.',
  },
];
