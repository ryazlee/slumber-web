import { Link } from 'react-router-dom';
import HomeHeroPhone from '../components/HomeHeroPhone';
import HomeHypnogram from '../components/HomeHypnogram';
import HomeScreenshots from '../components/HomeScreenshots';
import { StoreBadgePair } from '../components/StoreBadges';
import { useAuth } from '../context/AuthContext';
import '../styles/home.css';

const base = import.meta.env.BASE_URL;

export default function Home() {
  const { session } = useAuth();
  const isLoggedIn = Boolean(session);

  return (
    <div className="home-marketing">
      <section className="home-hero" aria-labelledby="home-headline">
        <div className="home-hero-glow" aria-hidden="true" />
        <div className="home-hero-inner content-wrap">
          <div className="home-hero-copy">
            <div className="home-brand-lockup">
              <img
                className="home-app-icon"
                src={`${base}icon-512.png`}
                alt=""
                width={72}
                height={72}
                decoding="async"
              />
              <p className="home-brand">Slumber</p>
            </div>
            <h1 id="home-headline">Sleep socially, <strong>together</strong>.</h1>
            <HomeHypnogram />
            <p className="home-lead">
              Your sleep score isn&apos;t enough. Post last night from your wearable
              and see how friends actually slept.
            </p>
            <p className="home-platforms">Free on iOS and Android</p>

            <div className="home-hero-actions">
              <StoreBadgePair />
              {isLoggedIn ? (
                <p className="home-login-prompt">
                  Already signed in?{' '}
                  <Link to="/feed" className="home-login-link">
                    See your feed
                  </Link>
                </p>
              ) : (
                <p className="home-login-prompt">
                  Already have an account?{' '}
                  <Link to="/login" className="home-login-link">
                    Log in on the web
                  </Link>
                </p>
              )}
            </div>
          </div>

          <div className="home-hero-visual">
            <HomeHeroPhone />
          </div>
        </div>
      </section>

      <div className="home-body content-wrap">
        <section className="home-devices" aria-labelledby="home-devices-title">
          <h2 id="home-devices-title">Works with</h2>
          <ul className="home-devices-list">
            <li>Watch</li>
            <li>Oura</li>
            <li>Garmin</li>
            <li>Whoop</li>
            <li>Fitbit</li>
            <li>Pixel</li>
          </ul>
          <p className="home-devices-note">via Apple Health, Health Connect, or Google Health</p>
        </section>

        <section className="home-steps" aria-labelledby="home-steps-title">
          <h2 id="home-steps-title">Mornings</h2>
          <ol className="home-steps-list">
            <li>
              <span className="home-step-mark home-step-mark--core" aria-hidden="true" />
              <div>
                <h3>Sync</h3>
                <p>Last night lands from Apple Health, Health Connect, or Google Health.</p>
              </div>
            </li>
            <li>
              <span className="home-step-mark home-step-mark--rem" aria-hidden="true" />
              <div>
                <h3>Post</h3>
                <p>Add a vibe, note, or dream — or turn on auto-publish. On iPhone, the Home Screen widget can post it too.</p>
              </div>
            </li>
            <li>
              <span className="home-step-mark home-step-mark--deep" aria-hidden="true" />
              <div>
                <h3>Share</h3>
                <p>Friends see the real night — stages, timing, and optional vibes.</p>
              </div>
            </li>
          </ol>
        </section>

        <HomeScreenshots />

        <section className="home-essentials" aria-labelledby="home-essentials-title">
          <h2 id="home-essentials-title">Built for friends</h2>
          <ul className="home-essentials-list">
            <li>
              <strong>Feed</strong>
              <span>Nights and naps as they land — hypnograms, vibes, dreams, PRs.</span>
            </li>
            <li>
              <strong>Stats</strong>
              <span>This week, the last 30 days, who sleeps like you, and a monthly recap.</span>
            </li>
            <li>
              <strong>Compare</strong>
              <span>Your sleep next to theirs, not a random population score.</span>
            </li>
            <li>
              <strong>Challenges, clubs &amp; boards</strong>
              <span>Race for sleep logged, keep a room for your people, and rank wearable nights.</span>
            </li>
            <li>
              <strong>Privacy</strong>
              <span>Mutual friends by default. Private posts, blurred dreams, block anytime.</span>
            </li>
          </ul>
        </section>

        <section className="home-closing" aria-labelledby="home-closing-title">
          <div className="home-closing-panel">
            <h2 id="home-closing-title">Get Slumber</h2>
            <StoreBadgePair className="home-closing-stores" />
            {isLoggedIn ? (
              <p className="home-login-prompt">
                Already signed in?{' '}
                <Link to="/feed" className="home-login-link">
                  See your feed
                </Link>
              </p>
            ) : (
              <p className="home-login-prompt">
                Already have an account?{' '}
                <Link to="/login" className="home-login-link">
                  Log in on the web
                </Link>
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
