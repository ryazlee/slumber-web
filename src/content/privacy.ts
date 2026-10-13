export const privacyMeta = {
  title: 'Privacy Policy',
  updated: 'August 13, 2026',
};

export const privacySections = [
  {
    heading: 'Overview',
    body: [
      'Slumber is a social sleep-tracking app for iOS and Android. You log nights and naps from Apple Health, Health Connect, Google Health (optional), or manually, add context (notes, dreams, photos, tags), and share with friends you mutually approve. You can also join sleep clubs, compare with friends, see who you sleep most like, open a monthly recap, appear on optional leaderboards, and race in challenges.',
      'An optional web companion lets signed-in users browse their feed, profile, stats, Compare, Leaderboards, Clubs, Friends, and challenges in a browser and leave kudos and comments. Sleep logging, health sync, contacts matching, auto-publish, and most account and privacy settings stay in the mobile app.',
      'This policy describes what we collect through the Slumber mobile app and website, how we use it, and the choices you have.',
    ],
  },
  {
    heading: 'Information we collect',
    body: [
      'Account information: email address (for email one-time-code / magic-link sign-in), username, profile photo, sleep goal, and optional profile and privacy settings. You can also sign in with Google. On iOS you can Sign in with Apple.',
      'Sleep data you create: sleep duration, bed and wake times, sleep stages (when available from a wearable), hypnogram samples, titles, optional typed location labels (not GPS), vibes, tags, morning notes, dream journal entries, optional dream mood, and photos you attach to posts. Wearable source names (for example Apple Watch or Whoop) may be stored on a post when the health platform provides them. Slumber does not connect to wearable vendor accounts directly, except optional Google Health.',
      'Manual sleep logs: when you log a night without wearable data, we store the times and duration you enter. Manual logs appear in your social feed but are excluded from competitive stats, personal records, leaderboards, club analytics, and challenge scoring.',
      'Offline drafts (on device): if you save a sleep post while offline, the draft (including any photos you attach) is stored temporarily in the app’s on-device storage until it syncs to our servers when you reconnect. Offline drafts are not visible to friends until sync succeeds.',
      'Apple Health data (with your permission): sleep duration and stage data read via HealthKit to populate wearable sleep logs. On iOS, optional background delivery can refresh last-night sleep so auto-publish can run without opening the app. Slumber only reads Health data you authorize; we do not write to HealthKit on your behalf.',
      'Health Connect data (Android, with your permission): sleep duration and stage data read via Health Connect to populate wearable sleep logs. Slumber only reads Health Connect data you authorize; we do not write sleep data back to Health Connect on your behalf.',
      'Google Health data (optional, with your permission): if you connect Google Health in Settings, we read sleep duration and stage data from your Google Health account via Google\'s API using the restricted scope googlehealth.sleep.readonly. OAuth refresh tokens are stored on our servers (never on your device) so we can fetch sleep on your behalf. Slumber only reads sleep data you authorize; we do not write sleep data to Google Health. See "Data protection" below for how we safeguard this data.',
      'Photos: you can pick images from your photo library for your avatar and sleep posts (stored in our file storage). Share cards can be saved back to your photo library if you choose. Slumber does not use the camera.',
      'Social activity: friend relationships, friend-of-friend suggestions, comments, comment likes, kudos, sleep clubs, club membership and invites, sleep challenges, challenge progress, sleep buddy tags, notifications, invite links, and @mentions in notes, dreams, and comments.',
      'Contact hashes (optional, with your permission): if you use Find from contacts, we receive one-way SHA-256 hashes of emails and phone numbers from your address book (and hashes of your account email, and of a phone on your auth record if one exists). We never upload your raw address book. Slumber does not use phone numbers for sign-in.',
      'Push tokens (with your permission): if you allow notifications, we store a device push token so we can send alerts for social events, invites, and auto-publish confirmations.',
      'Safety and moderation: abuse reports you submit and block lists you maintain.',
      'Service data: standard diagnostics and error information needed to operate and secure the service (for example authentication events, API requests, and app version). We do not use third-party advertising or product-analytics SDKs, and we do not track you across other companies’ apps or websites.',
    ],
  },
  {
    heading: 'How we use information',
    body: [
      'Provide core features: sleep logging, feed, profile, stats, Compare, clubs, leaderboards, challenges, streaks, personal records, share images, and notifications.',
      'Sync sleep from Apple Health or Health Connect when you grant access, including upgrading a manual log when newer wearable data becomes available, and optionally auto-publishing a wearable night when you turn that setting on.',
      'Sync sleep from Google Health when you explicitly connect that source in Settings.',
      'Show your posts to friends according to each post\'s privacy settings, and show friends\' posts to you.',
      'Operate social interactions: friend requests, comments, kudos, mentions, sleep buddy tag requests, club invites, challenge invitations, and friend / club / challenge invite links.',
      'Match hashed contact identifiers (when you grant Contacts access) so you can find friends already on Slumber, and so others can find you if you leave Findable by contacts on.',
      'Suggest people who share mutual friends when you are growing your friend list.',
      'Review reported content and enforce community guidelines.',
      'Maintain account security, prevent abuse, and improve reliability of the app and website.',
      'If you subscribe to Slumber Premium, confirm your entitlement so gated features work on your account.',
    ],
  },
  {
    heading: 'Apple Health & HealthKit',
    body: [
      'HealthKit data is used only inside Slumber to display sleep metrics, build hypnogram charts, compute stats, score sleep challenges you join, contribute to leaderboards and club analytics, and (if you enable it) auto-publish last night.',
      'Slumber does not sell, trade, or share data obtained through the Apple HealthKit framework with advertising platforms, data brokers, or third-party information resellers.',
      'You can revoke HealthKit access at any time in iOS Settings. Existing posts already saved in Slumber are not automatically deleted when you revoke access.',
    ],
  },
  {
    heading: 'Health Connect',
    body: [
      'Health Connect data is used only inside Slumber to display sleep metrics, build hypnogram charts, compute stats, score sleep challenges you join, contribute to leaderboards and club analytics, and (if you enable it) auto-publish last night.',
      'Slumber does not sell, trade, or share data obtained through Health Connect with advertising platforms, data brokers, or third-party information resellers.',
      'You can revoke Health Connect access at any time in Android settings. Existing posts already saved in Slumber are not automatically deleted when you revoke access.',
    ],
  },
  {
    heading: 'Google Health',
    body: [
      'When you choose to connect Google Health, Slumber does not sell, trade, or share sleep data obtained from Google Health with advertising platforms, data brokers, or third-party information resellers.',
      'Google Health sleep data is used only inside Slumber to display sleep metrics, build hypnogram charts, compute stats, score sleep challenges you join, and contribute to leaderboards and club analytics. We store an OAuth refresh token on our servers (Supabase) solely to read sleep on your behalf until you disconnect.',
      'You can disconnect Google Health at any time in Slumber Settings. You can also revoke Slumber\'s access in your Google account security settings.',
    ],
  },
  {
    heading: 'Data protection',
    body: [
      'We protect personal information and Google user data (including Google Health sleep data and OAuth credentials) with the following mechanisms:',
      'Encryption in transit: All client–server and server–Google API traffic uses HTTPS / TLS.',
      'Encryption at rest: Account data, sleep posts, and OAuth credentials are stored in our hosted database (Supabase / PostgreSQL), which encrypts data at rest.',
      'On-device offline drafts: Queued posts saved while offline live in app-protected storage on your device until sync; they are uploaded over HTTPS when connectivity returns. The app may also cache friend-visible content on device for a limited time so the feed still works after a restart.',
      'Credential isolation: Google Health OAuth refresh tokens are never stored on your device or exposed to the mobile/web client. Tokens are stored server-side and usable only by authenticated backend services (Edge Functions with a service role). Database row-level security and revoked client grants prevent anonymous or signed-in users from reading other users\' tokens or Google Health credentials.',
      'Least privilege: We request only the Google Health sleep read-only scope needed to sync sleep. We do not request write access to Google Health.',
      'Access control: Sleep and account data are scoped to your authenticated account. Friend-visible content is limited by mutual friendship and per-post privacy settings. Administrative access to production systems is limited to authorized operators and used for security, reliability, and abuse investigation.',
      'Deletion and revocation: Disconnecting Google Health clears the stored refresh token. Deleting your account removes your authentication record, personal sleep data, photos, health connections, contact hashes, and push tokens. You may also revoke Slumber in your Google Account security settings.',
      'We do not use Google user data for advertising, credit decisions, or sale to data brokers.',
    ],
  },
  {
    heading: 'Who sees your data',
    body: [
      'We do not sell your personal information.',
      'Friends: Slumber uses mutual friend requests. Both people must accept before either can see the other\'s posts. Your feed shows posts from accepted friends and your own posts.',
      'Find from contacts (optional): hashes emails and phones on your device and checks whether matching Slumber accounts exist. Your address book is never uploaded. People who turn off Findable by contacts in Settings are excluded from matching.',
      'Post visibility: posts default to visible to friends. You can mark an individual post private (hidden from friends\' feeds; tagged sleep buddies can still open it). Offline drafts stay on your device only until they sync.',
      'Private nights and aggregates: marking a post private hides it from friends\' feeds and from Compare with friends. Wearable minutes from private nights can still count toward challenges, global and club leaderboards, and club analytics.',
      'Dream privacy: you can blur a dream entry so friends see that you logged a dream without reading the text. Mentioned friends may see a minimal indicator when they are @mentioned in a private dream.',
      'Personal records: all-time and 30-day PR chips on posts are on by default. You can hide best and/or worst PRs from friends in Settings. You still see your own.',
      'Sleep buddies: when you tag a friend on a post, they must accept before the tag appears to other viewers. Pending or accepted buddies can open a private post they were tagged on.',
      'Compare: you can put your wearable sleep next to selected friends (including from their profile, and on the website). Compare follows normal post visibility, so friends do not see your private nights there.',
      'Clubs: clubs are named groups independent of friendship. Joining a club does not unlock other members\' feed posts — you still need to be friends to see nights in the feed. Club analytics can aggregate accepted members\' wearable nights, including private posts, into averages and similar summaries. Last-night club analytics are available to members; longer ranges may be offered as Premium.',
      'Leaderboards: any signed-in user can see Social → Leaderboards (usernames and wearable averages). You are included by default. You can opt out in Settings → Privacy → Appear on leaderboards. Club leaderboards among accepted members are separate and are not controlled by that global opt-out. Blocked users are excluded.',
      'Challenges: participants in a challenge you join can see challenge-related sleep contributions according to challenge rules. Wearable nights, including private posts, can count toward challenge scoring.',
      'Invite links: you can share friend, club, and challenge links. Logged-out web pages may show a limited preview (for example a username, or a non-private post title and sleep date). Accepting a link creates the relevant relationship.',
      'Friend suggestions: if you have few friends, Slumber may suggest people who share mutual friends, including via @username.',
      'Web companion: when you sign in on the website, you can view the same friend-visible content your account can access in the app and interact with kudos and comments. The website does not sync Apple Health, Health Connect, or Google Health, does not log sleep, and does not run Find from contacts or auto-publish.',
      'Service providers: we use infrastructure providers to host and operate the service under contractual safeguards, including Supabase (authentication, database, and file storage), Expo and Apple/Google push services (notifications), Apple (HealthKit, Sign in with Apple, App Store), Google (sign-in, Google Health, Play, and push), and RevenueCat (subscription entitlements if you purchase Slumber Premium).',
      'Legal requirements: we may disclose information when required by law or to protect the safety of users and the service.',
    ],
  },
  {
    heading: 'Your choices',
    body: [
      'Control post privacy per night (visible to friends or private).',
      'Blur dream journal entries on individual posts.',
      'Show or hide personal-record chips on your posts.',
      'Turn auto-publish on or off in Settings. When on, Slumber can create a friend-visible wearable post for last night as soon as health data is available (on iOS this may happen in the background).',
      'Edit or delete your own posts (including deleting an offline draft before it syncs).',
      'Appear on leaderboards, or opt out in Settings → Privacy.',
      'Stay findable by hashed contacts, or turn Findable by contacts off (this clears your stored hashes).',
      'Block users. They are removed from your feed, search, leaderboards, and challenge interactions.',
      'Report posts for moderation review.',
      'Revoke notification permission in system settings. We delete stored push tokens on logout and when you delete your account.',
      'Delete your account in Settings, or request deletion on the web at useslumber.com/delete-account. You can also request data deletion at useslumber.com/delete-data. That removes your login, personal sleep posts, photos, health connections, contact hashes, push tokens, and social connections. An anonymized profile stub may remain so comments and likes you left on others\' posts, and some challenge history, can stay intact.',
      'Revoke Apple Health access in iOS Settings at any time.',
      'Revoke Health Connect access in Android settings at any time.',
      'Disconnect Google Health in Slumber Settings.',
    ],
  },
  {
    heading: 'Slumber Premium',
    body: [
      'Some features may be offered as Slumber Premium, billed as an auto-renewable subscription through the App Store or Google Play. If you subscribe, Apple or Google process the payment. We receive an entitlement tied to your Slumber account (via RevenueCat) so gated features unlock. The website does not sell subscriptions.',
      'Cancel in your Apple ID or Google Play subscription settings. Deleting your Slumber account does not automatically cancel a store subscription.',
    ],
  },
  {
    heading: 'Retention',
    body: [
      'We retain your data while your account is active. Offline drafts remain on your device until they sync or you delete them. When you delete your account, we remove your authentication record and personal sleep data and anonymize the remaining profile stub. Comments and likes you left on other people\'s posts may be retained under an anonymized username so those conversations stay intact.',
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
