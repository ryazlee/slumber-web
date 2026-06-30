import { Link } from 'react-router-dom';
import HomeScreenshots from '../components/HomeScreenshots';
import { APP_STORE_URL } from '../lib/deepLinks';

export default function Home() {
  return (
    <div className="content-wrap home-page-wrap">
      <div className="home-page">
        <header className="home-hero">
          <p className="eyebrow">iOS · Social sleep tracking</p>
          <h1>Log your nights. Share with friends.</h1>
          <p className="lead">
            Slumber syncs sleep from Apple Health each morning: stages, duration, bed and wake
            times. It turns into posts you share with friends. Compare nights side by side,
            scroll a morning feed, and see how your habits stack up against people you know.
            Hypnograms, vibes, dreams, photos, sleep buddy tags, and challenges.
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
            wear an Apple Watch, Oura, Garmin, Whoop, or anything else that writes to Apple Health.
            Add a title, pick a vibe, tag what might have affected your sleep, tag sleep buddies
            you shared the night with, and jot down a dream (private or shared). Hit publish and
            it shows up in your friends&apos; feeds. Turn on auto-publish in Settings to post
            wearable nights without opening the composer.
          </p>
          <p>
            Sign in with email, a magic link, or Google. Share your personal invite link from
            People so friends can add you in one tap after they install.
          </p>
          <p>
            Miss a day? Backfill up to a week. The app nags you (gently) when HealthKit has data
            you haven&apos;t logged yet.
          </p>
        </section>

        <section className="section">
          <h2>What&apos;s in the app</h2>
          <ul className="feature-list">
            <li>
              <strong>Feed</strong>
              Sleep posts from friends and yourself: hypnograms, stage breakdowns, personal record
              badges, dream logs, kudos, comments, and @mentions.
            </li>
            <li>
              <strong>Sleep buddies</strong>
              Tag accepted friends you shared the night with (partner, roommate, travel crew). They
              confirm before it shows on your post as &ldquo;Slept with @friend.&rdquo;
            </li>
            <li>
              <strong>Stats</strong>
              Weekly chart, 30-day averages, stage mix, personal records, monthly bests, monthly
              bed/wake timing, and log streaks (wearable nights only).
            </li>
            <li>
              <strong>Compare</strong>
              Side by side sleep metrics with friends over today, 7 days, 30 days, or all time.
              Wearable nights only; manual logs stay out of the table.
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
            <Link to="/">useslumber.com</Link>. Sleep logging, HealthKit sync, and connecting with
            friends happen in the iOS app.
          </p>
        </section>

        <section className="section">
          <h2>Devices</h2>
          <p>
            Slumber reads from HealthKit, not from individual wearables. Apple Watch, Oura,
            Garmin, Whoop, Fitbit. If it syncs sleep to Apple Health, Slumber can use it.
            Stage detail (core, deep, REM) depends on what your device writes.
          </p>
          <p>
            No wearable? Log a night manually with notes, dreams, and how you felt. Manual posts
            show in the feed but do not count toward stats, compare, challenges, or personal
            records. If device data arrives later, Slumber can merge it into the post.
          </p>
        </section>

        <p className="platform-note">
          <strong>Available on the App Store</strong> for iPhone (iOS 15.1+). Free account. Slumber
          does not write to Apple Health. Android Health Connect is on the roadmap.
        </p>
      </div>
    </div>
  );
}
