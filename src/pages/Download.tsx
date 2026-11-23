import { Link } from 'react-router-dom';
import AccentBubbles from '../components/AccentBubbles';
import { StoreBadgePair } from '../components/StoreBadges';
import { useAuth } from '../context/AuthContext';
import '../styles/home.css';
import '../styles/download.css';

const base = import.meta.env.BASE_URL;

export default function Download() {
  const { session } = useAuth();
  const isLoggedIn = Boolean(session);

  return (
    <div className="home-marketing download-page">
      <section className="download-hero" aria-labelledby="download-headline">
        <AccentBubbles />
        <div className="download-hero-inner content-wrap">
          <div className="home-brand-lockup download-brand">
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

          <h1 id="download-headline">Get the app</h1>
          <p className="home-lead download-lead">
            Free on iOS and Android. Post last night from your wearable and see how
            friends actually slept.
          </p>

          <StoreBadgePair className="download-stores" />

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
  );
}
