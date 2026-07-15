import { homeScreenshots } from '../content/homeScreenshots';

export default function HomeScreenshots() {
  return (
    <section className="home-screenshots" aria-labelledby="home-screenshots-title">
      <h2 id="home-screenshots-title">Inside the app</h2>
      <p className="home-screenshots-lead">
        Feed, detail, stats, compare, and challenges.
      </p>

      <div className="home-screenshot-scroll" tabIndex={0}>
        {homeScreenshots.map((shot) => (
          <figure key={shot.caption} className="home-screenshot-item">
            <div className="home-screenshot-frame">
              <img
                src={shot.src}
                alt={shot.alt}
                loading="lazy"
                decoding="async"
                width={428}
                height={926}
              />
            </div>
            <figcaption className="home-screenshot-caption">
              <strong>{shot.caption}</strong>
              <span>{shot.description}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
