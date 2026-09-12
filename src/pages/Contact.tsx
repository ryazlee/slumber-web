import { Link } from 'react-router-dom';
import '../styles/home.css';
import '../styles/download.css';
import '../styles/contact.css';

const base = import.meta.env.BASE_URL;
const SUPPORT_EMAIL = 'useslumber@gmail.com';
const DEV_CONTACT_URL = 'https://ryazlee.github.io/contact';

export default function Contact() {
  return (
    <div className="home-marketing download-page contact-page">
      <section className="download-hero contact-hero" aria-labelledby="contact-headline">
        <div className="home-hero-glow" aria-hidden="true" />
        <div className="download-hero-inner contact-hero-inner content-wrap">
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

          <h1 id="contact-headline">Get in touch</h1>
          <p className="home-lead download-lead">
            Support, privacy, or just say hi. Email the team, or reach the person who
            builds Slumber.
          </p>

          <ul className="contact-links">
            <li>
              <a className="contact-link" href={`mailto:${SUPPORT_EMAIL}`}>
                <span className="contact-link-label">Email</span>
                {SUPPORT_EMAIL}
              </a>
            </li>
            <li>
              <a
                className="contact-link"
                href={DEV_CONTACT_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="contact-link-label">Developer</span>
                Ryan
              </a>
            </li>
          </ul>

          <p className="home-login-prompt contact-delete-hint">
            Need to delete your account?{' '}
            <Link to="/delete-account" className="home-login-link">
              Request deletion
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
