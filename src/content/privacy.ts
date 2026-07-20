export const privacyMeta = {
  title: 'Privacy Policy',
  updated: 'July 2026',
};

export const privacySections = [
  {
    heading: 'Overview',
    body: [
      'Slumber is a social sleep-tracking app for iOS. You log nights from Apple Health, Google Health (optional), or manually, add context (notes, dreams, photos, tags), and share with friends you mutually approve. An optional web companion lets signed-in users browse their feed, profile, stats, and challenges in a browser and leave kudos and comments. Sleep logging, HealthKit / Google Health sync, and most account management stay in the mobile app.',
      'This policy describes what we collect through the Slumber mobile app and website, how we use it, and the choices you have.',
    ],
  },
  {
    heading: 'Information we collect',
    body: [
      'Account information: email address (for email one-time-code / magic-link sign-in), username, profile photo, sleep goal, and optional profile settings. On iOS you can also sign in with Google or Sign in with Apple.',
      'Sleep data you create: sleep duration, bed and wake times, sleep stages (when available from a wearable), hypnogram samples, titles, location labels, vibes, tags, morning notes, dream journal entries, optional dream mood, and photos you attach to posts.',
      'Manual sleep logs: when you log a night without wearable data, we store the times and duration you enter. Manual logs appear in your social feed but are excluded from competitive stats, personal records, and challenge scoring.',
      'Apple Health data (with your permission): sleep duration and stage data read via HealthKit to populate wearable sleep logs. Slumber only reads Health data you authorize; we do not write to HealthKit on your behalf.',
      'Google Health data (optional, with your permission): if you connect Google Health in Settings, we read sleep duration and stage data from your Google Health account via Google\'s API. OAuth tokens are stored securely on our servers so we can fetch sleep on your behalf. Slumber only reads sleep data you authorize; we do not write sleep data to Google Health.',
      'Social activity: friend relationships, comments, comment likes, kudos, sleep challenges, challenge progress, sleep buddy tags, notifications, and @mentions in notes, dreams, and comments.',
      'Safety and moderation: abuse reports you submit and block lists you maintain.',
      'Service data: standard diagnostics and error information needed to operate and secure the service (e.g. authentication events, API requests).',
    ],
  },
  {
    heading: 'How we use information',
    body: [
      'Provide core features: sleep logging, feed, profile, stats, compare views, challenges, streaks, and notifications.',
      'Sync sleep from Apple Health when you grant access, including upgrading a manual log when newer wearable data becomes available.',
      'Sync sleep from Google Health when you explicitly connect that source in Settings.',
      'Show your posts to friends according to each post\'s privacy settings, and show friends\' posts to you.',
      'Operate social interactions: friend requests, comments, kudos, mentions, sleep buddy tag requests, and challenge invitations.',
      'Review reported content and enforce community guidelines.',
      'Maintain account security, prevent abuse, and improve reliability of the app and website.',
    ],
  },
  {
    heading: 'Apple Health & HealthKit',
    body: [
      'HealthKit data is used only inside Slumber to display sleep metrics, build hypnogram charts, compute stats, and score sleep challenges you join.',
      'Slumber does not sell, trade, or share data obtained through the Apple HealthKit framework with advertising platforms, data brokers, or third-party information resellers.',
      'You can revoke HealthKit access at any time in iOS Settings. Existing posts already saved in Slumber are not automatically deleted when you revoke access.',
    ],
  },
  {
    heading: 'Google Health',
    body: [
      'When you choose to connect Google Health, Slumber does not sell, trade, or share sleep data obtained from Google Health with advertising platforms, data brokers, or third-party information resellers.',
      'Google Health sleep data is used only inside Slumber to display sleep metrics, build hypnogram charts, compute stats, and score sleep challenges you join. We store an OAuth refresh token on our servers (Supabase) solely to read sleep on your behalf until you disconnect.',
      'You can disconnect Google Health at any time in Slumber Settings. You can also revoke Slumber\'s access in your Google account security settings.',
    ],
  },
  {
    heading: 'Who sees your data',
    body: [
      'We do not sell your personal information.',
      'Friends: Slumber uses mutual friend requests. Both people must accept before either can see the other\'s posts. Your feed shows posts from accepted friends and your own posts.',
      'Post visibility: posts default to visible to friends. You can mark an individual post private (hidden from the feed; tagged sleep buddies can still see it).',
      'Dream privacy: you can blur a dream entry so friends see that you logged a dream without reading the text. Mentioned friends may see a minimal indicator when they are @mentioned in a private dream.',
      'Sleep buddies: when you tag a friend on a post, they must accept before the tag appears to other viewers.',
      'Challenges: participants in a challenge you join can see challenge-related sleep contributions according to challenge rules.',
      'Web companion: when you sign in on the website, you can view the same friend-visible content your account can access in the app and interact with kudos and comments. The website does not sync HealthKit or Google Health data and does not support sleep logging.',
      'Service providers: we use infrastructure providers (e.g. Supabase) to host authentication, database, and file storage under contractual safeguards.',
      'Legal requirements: we may disclose information when required by law or to protect the safety of users and the service.',
    ],
  },
  {
    heading: 'Your choices',
    body: [
      'Control post privacy per night (public to friends or private to you).',
      'Blur dream journal entries on individual posts.',
      'Edit or delete your own posts.',
      'Block users. They are removed from your feed, search, and challenge interactions.',
      'Report posts for moderation review.',
      'Delete your account in Settings — removes your login, personal sleep posts, photos, health connections, and social connections; comments and likes you left on others\' posts may remain under an anonymized account name.',
      'Revoke Apple Health access in iOS Settings at any time.',
      'Disconnect Google Health in Slumber Settings.',
    ],
  },
  {
    heading: 'Retention',
    body: [
      'We retain your data while your account is active. When you delete your account, we remove your authentication record and personal sleep data. Comments and likes you left on other people\'s posts may be retained under an anonymized username so those conversations stay intact.',
    ],
  },
  {
    heading: 'Children',
    body: [
      'Slumber is not directed at children under 13. We do not knowingly collect personal information from anyone under 13.',
    ],
  },
  {
    heading: 'Contact',
    body: [
      'Privacy questions or requests: useslumber@gmail.com',
    ],
  },
  {
    heading: 'Changes',
    body: [
      'We may update this policy from time to time. Material changes will be reflected by updating the date at the top of this page.',
    ],
  },
];
