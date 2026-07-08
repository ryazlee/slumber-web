import { Link } from 'react-router-dom';
import HomeScreenshots from '../components/HomeScreenshots';
import { APP_STORE_URL } from '../lib/deepLinks';

export default function Home() {
  return (
    <div className="content-wrap home-page-wrap">
      <div className="home-page">
        <header className="home-hero">
          <p className="eyebrow">iOS · Android in development</p>
          <h1>See how friends slept. Compare side by side.</h1>
          <p className="lead">
            Slumber syncs sleep each morning from Apple Health or Google Health — stages,
            duration, bed and wake times — and turns it into posts you share with friends.
            Your wearable&apos;s morning score isn&apos;t enough on its own; what helps is seeing
            how people you know actually slept and comparing stats side by side. Hypnograms,
            morning vibes, dream moods, nap-day timelines, photos, sleep buddy tags, clubs,
            and challenges.
          </p>

          <div className="home-hero-actions">
            <a
              href={APP_STORE_URL}
              className="home-cta home-cta--primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download on the App Store
            </a>
            <Link to="/" className="home-cta home-cta--secondary">
              Log in on the web
            </Link>
          </div>

          <div className="hypno-demo" aria-hidden="true">
            <div className="hypno-labels">
              <span>10:42 PM</span>
              <span>6:31 AM</span>
            </div>
            <div className="hypno-bar">
              <div className="hypno-seg core" />
              <div className="hypno-seg deep" />
              <div className="hypno-seg rem" />
              <div className="hypno-seg awake" />
              <div className="hypno-seg core" />
              <div className="hypno-seg rem" />
              <div className="hypno-seg deep" />
            </div>
            <div className="hypno-stats">
              <span><strong>7h 12m</strong> asleep</span>
              <span><strong>Core</strong> 3h 40m</span>
              <span><strong>Deep</strong> 1h 28m</span>
              <span><strong>REM</strong> 2h 04m</span>
            </div>
          </div>
        </header>

        <HomeScreenshots />

        <section className="section">
          <h2>How it works</h2>
          <p>
            Open Slumber in the morning. Your last night&apos;s sleep is already there if you
            wear an Apple Watch, Oura, Garmin, Whoop, or anything else that writes to Apple
            Health — or if you connect Google Health in Settings for a Pixel Watch or Fitbit
            that syncs there instead. Pick your data source: Automatic, Apple Health, or Google
            Health. Add a title, pick a morning vibe (Charged, Solid, Meh, Dragging, or Zombie),
            tag what might have affected your sleep, tag sleep buddies you shared the night with,
            and jot down a dream with an optional mood — Nightmare, Weird, Neutral, Good, or
            Vivid — private or shared. Hit publish and it shows up in your friends&apos; feeds.
            Turn on auto-publish in Settings to post wearable nights without opening the composer.
          </p>
          <p>
            Sign in with email, a magic link, or Google. Share your personal invite link from
            People so friends can add you in one tap after they install.
          </p>
          <p>
            Miss a day? Backfill up to a week. The app nags you (gently) when wearable data
            exists for a night you haven&apos;t logged yet. When Apple Health or Google Health
            revises a night — extra sleep, new times, or nap-then-overnight updates — Slumber
            flags your posts so you can refresh them in one tap.
          </p>
        </section>

        <section className="section">
          <h2>What&apos;s in the app</h2>
          <ul className="feature-list">
            <li>
              <strong>Feed</strong>
              Sleep posts from friends and yourself: hypnograms, stage breakdowns, personal record
              badges, morning vibe emoji, dream logs with optional mood, kudos, comments, comment
              likes, and @mentions. Nap days show per-session timelines instead of one combined bar.
            </li>
            <li>
              <strong>Compare</strong>
              Side by side sleep metrics with friends over today, 7 days, 30 days, or all time.
              Wearable nights only; manual logs stay out of the table.
            </li>
            <li>
              <strong>Stats</strong>
              Weekly chart, 30-day averages, stage mix, personal records, monthly bests, monthly
              bed/wake timing, and log streaks (wearable nights only).
            </li>
            <li>
              <strong>Morning vibes &amp; dreams</strong>
              Optional how-you-felt picker on every post. Dreams support a mood chip, private blur,
              and read-more on long entries in the feed — same gradient dream card as the app.
            </li>
            <li>
              <strong>Sleep buddies</strong>
              Tag accepted friends you shared the night with (partner, roommate, travel crew). They
              confirm before it shows on your post as &ldquo;Slept with @friend.&rdquo;
            </li>
            <li>
              <strong>Challenges</strong>
              1v1 or group races for total sleep logged over a set window. Pick preset or custom
              goal hours to end the race early. Highest total asleep through the window wins.
            </li>
            <li>
              <strong>Sleep clubs</strong>
              Named groups for roommates, crews, or households. Filter feed, compare, and
              challenges to a club roster, or join club-wide races. Posts stay friend-only;
              clubs help you organize and compete with the same people.
            </li>
            <li>
              <strong>Wearable sync</strong>
              Posts stay aligned with Apple Health and Google Health. When your wearable adds sleep,
              changes times, or lands overnight after a daytime nap, Slumber surfaces an update on
              your post and in Sleep History for the week.
            </li>
            <li>
              <strong>Privacy &amp; safety</strong>
              Friends are mutual: you both accept. Posts can be private. Dreams can be blurred.
              Report, block, and delete your account in Settings.
            </li>
          </ul>
        </section>

        <section className="section">
          <h2>On the web</h2>
          <p>
            Browse your feed, view stats, compare with friends, and leave kudos and comments at{' '}
            <Link to="/">useslumber.com</Link>. Feed cards and post detail mirror the app:
            hypnograms, nap-day session breakdowns, stage percentages, vibes, dream moods, sleep
            buddies (including pending tags on your own posts), tappable @mentions, and comment
            long-press for reply. Sleep logging, HealthKit / Google Health sync, and connecting with
            friends happen in the iOS app.
          </p>
        </section>

        <section className="section">
          <h2>Devices</h2>
          <p>
            <strong>Apple Health path:</strong> Slumber reads from HealthKit, not from individual
            wearables. Apple Watch, Oura, Garmin, Whoop, Fitbit — if it syncs sleep to Apple
            Health, Slumber can use it. Stage detail (core, deep, REM) depends on what your device
            writes.
          </p>
          <p>
            <strong>Google Health path:</strong> Connect Google Health in Settings when your Pixel
            Watch or Fitbit syncs sleep to Google but not Apple Health. Choose Automatic to try
            the platform hub first, then fall back to Google Health.
          </p>
          <p>
            No wearable? Log a night manually with notes, dreams, and how you felt. Manual posts
            show in the feed but do not count toward stats, compare, challenges, or personal
            records. If device data arrives later, Slumber can merge it into the post.
          </p>
        </section>

        <p className="platform-note">
          <strong>Available on the App Store</strong> for iPhone (iOS 16.4+). Free account.
          Slumber does not write to Apple Health or Google Health. Android (Health Connect) is in
          development.
        </p>
      </div>
    </div>
  );
}
