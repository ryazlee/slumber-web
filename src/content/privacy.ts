export const privacyMeta = {
  title: 'Privacy Policy',
  updated: 'June 2026',
};

export const privacySections = [
  {
    heading: 'Overview',
    body: [
      'Slumber is a social sleep-tracking app for iOS. You log nights from Apple Health or manually, add context (notes, dreams, photos, tags), and share with friends you mutually approve. An optional web companion lets signed-in users browse their feed, profile, stats, and challenges in a browser—and leave kudos and comments. Sleep logging, HealthKit sync, and most account management stay in the mobile app.',
      'This policy describes what we collect through the Slumber mobile app and website, how we use it, and the choices you have.',
    ],
  },
  {
    heading: 'Information we collect',
    body: [
      'Account information: email address (for one-time-code sign-in), username, profile photo, sleep goal, and optional profile settings.',
      'Sleep data you create: sleep duration, bed and wake times, sleep stages (when available from a wearable), hypnogram samples, titles, location labels, vibes, tags, morning notes, dream journal entries, and photos you attach to posts.',
      'Manual sleep logs: when you log a night without wearable data, we store the times and duration you enter. Manual logs appear in your social feed but are excluded from competitive stats, personal records, and challenge scoring.',
      'Apple Health data (with your permission): sleep duration and stage data read via HealthKit to populate wearable sleep logs. Slumber only reads Health data you authorize; we do not write to HealthKit on your behalf.',
      'Social activity: friend relationships, comments, kudos, sleep challenges, challenge progress, notifications, and @mentions in notes, dreams, and comments.',
      'Safety and moderation: abuse reports you submit and block lists you maintain.',
      'Service data: standard diagnostics and error information needed to operate and secure the service (e.g. authentication events, API requests).',
    ],
  },
  {
    heading: 'How we use information',
    body: [
      'Provide core features: sleep logging, feed, profile, stats, compare views, challenges, streaks, and notifications.',
      'Sync sleep from Apple Health when you grant access, including upgrading a manual log when newer wearable data becomes available.',
      'Show your posts to friends according to each post\'s privacy settings, and show friends\' posts to you.',
      'Operate social interactions: friend requests, comments, kudos, mentions, and challenge invitations.',
      'Review reported content and enforce community guidelines.',
      'Maintain account security, prevent abuse, and improve reliability of the app and website.',
    ],
  },
  {
    heading: 'Apple Health & HealthKit',
    body: [
      'HealthKit data is used only inside Slumber—to display sleep metrics, build hypnogram charts, compute stats, and score sleep challenges you join.',
      'Slumber does not sell, trade, or share data obtained through the Apple HealthKit framework with advertising platforms, data brokers, or third-party information resellers.',
      'You can revoke HealthKit access at any time in iOS Settings. Existing posts already saved in Slumber are not automatically deleted when you revoke access.',
    ],
  },
  {
    heading: 'Who sees your data',
    body: [
      'We do not sell your personal information.',
      'Friends: Slumber uses mutual friend requests—both people must accept before either can see the other\'s posts. Your feed shows posts from accepted friends and your own posts.',
      'Post visibility: posts default to visible to friends. You can mark an individual post private (visible only to you).',
      'Dream privacy: you can blur a dream entry so friends see that you logged a dream without reading the text. Mentioned friends may see a minimal indicator when they are @mentioned in a private dream.',
      'Challenges: participants in a challenge you join can see challenge-related sleep contributions according to challenge rules.',
      'Web companion: when you sign in on the website, you can view the same friend-visible content your account can access in the app and interact with kudos and comments. The website does not sync HealthKit data or support sleep logging.',
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
      'Block users—they are removed from your feed, search, and challenge interactions.',
      'Report posts for moderation review.',
      'Delete your account in Settings, which permanently removes your authentication record, profile, posts, and associated social data.',
      'Revoke Apple Health access in iOS Settings at any time.',
    ],
  },
  {
    heading: 'Retention',
    body: [
      'We retain your data while your account is active. When you delete your account, we remove your authentication record and associated profile, posts, photos, and social data from our systems.',
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
