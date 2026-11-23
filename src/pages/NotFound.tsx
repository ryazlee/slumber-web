import { Link } from 'react-router-dom';
import AccentBubbles from '../components/AccentBubbles';
import '../styles/home.css';
import '../styles/download.css';
import '../styles/not-found.css';

const base = import.meta.env.BASE_URL;

export default function NotFound() {
  return (
    <div className="home-marketing download-page not-found-page">
      <section className="download-hero" aria-labelledby="not-found-headline">
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

          <p className="not-found-code">404</p>
          <h1 id="not-found-headline">Page not found</h1>
          <p className="home-lead download-lead">
            That link doesn&apos;t go anywhere. Head home, or grab the app and keep
            scrolling with friends.
          </p>

          <div className="not-found-actions">
            <Link to="/" className="home-cta home-cta--primary">
              Go home
            </Link>
            <Link to="/download" className="home-cta home-cta--secondary">
              Download
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
