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
            Support, privacy, or just say hi.
          </p>

          <a className="contact-email home-cta home-cta--primary" href={`mailto:${SUPPORT_EMAIL}`}>
            <span className="contact-email-label">Email</span>
            <span className="contact-email-address">{SUPPORT_EMAIL}</span>
          </a>

          <p className="home-login-prompt contact-delete-hint">
            Need to delete your account?{' '}
            <Link to="/delete-account" className="home-login-link">
              Request deletion
            </Link>
          </p>

          <p className="contact-dev">
            Built by{' '}
            <a href={DEV_CONTACT_URL} target="_blank" rel="noopener noreferrer">
              Ryan
            </a>{' '}🐸
          </p>
        </div>
      </section>
    </div>
  );
}
