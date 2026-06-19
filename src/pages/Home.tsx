import HomeScreenshots from '../components/HomeScreenshots';

export default function Home() {
  return (
    <div className="content-wrap home-page-wrap">
      <div className="home-page">
        <header className="home-hero">
          <p className="eyebrow">iOS · Sleep tracking</p>
          <h1>Log your nights. Share with friends.</h1>
          <p className="lead">
            Slumber pulls sleep from Apple Health each morning—stages, duration, bed and wake
            times—and lets you add context: how you felt, what you did the night before, dreams,
            photos. Friends see your feed. You can race each other in sleep challenges.
          </p>

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
            wear an Apple Watch, Oura, Garmin, or anything else that writes to Apple Health.
            Add a title, pick a vibe, tag what might have affected your sleep, jot down a dream.
            Hit publish—it shows up in your friends&apos; feeds.
          </p>
          <p>
            Miss a day? You can backfill up to a week. The app nags you (gently) when
            HealthKit has data you haven&apos;t logged yet.
          </p>
        </section>

        <section className="section">
          <h2>What&apos;s in the app</h2>
          <ul className="feature-list">
            <li>
              <strong>Feed</strong>
              Sleep posts from friends and yourself—timelines, stage breakdowns, kudos,
              comments, @mentions.
            </li>
            <li>
              <strong>Stats</strong>
              Averages, streaks, personal records, monthly bests. Compare side-by-side with
              friends over a week or a month.
            </li>
            <li>
              <strong>Challenges</strong>
              1v1 or group races to log the most sleep over a set period. Good for
              accountability without turning it into a competition about who sleeps least.
            </li>
            <li>
              <strong>Sleep clubs</strong>
              Named groups for roommates, crews, or households—filter your feed, compare,
              and run club races together without everyone being friends first.
            </li>
            <li>
              <strong>Privacy controls</strong>
              Friends are mutual—you both accept. Posts can be private. Dreams can be blurred.
              Block and report are built in.
            </li>
          </ul>
        </section>

        <section className="section">
          <h2>Devices</h2>
          <p>
            Slumber reads from HealthKit, not from individual wearables. Apple Watch, Oura,
            Garmin, Whoop, Fitbit—if it syncs sleep to Apple Health, Slumber can use it.
            Stage detail (core, deep, REM) depends on what your device writes.
          </p>
        </section>

        <p className="platform-note">
          <strong>iOS only for now.</strong> Slumber requires a custom dev build for HealthKit
          access. Android Health Connect is on the roadmap.
        </p>
      </div>
    </div>
  );
}
