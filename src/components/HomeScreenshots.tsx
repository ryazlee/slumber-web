import { homeScreenshots } from '../content/homeScreenshots';

export default function HomeScreenshots() {
  return (
    <section className="section home-screenshots" aria-labelledby="home-screenshots-title">
      <h2 id="home-screenshots-title">See the app</h2>
      <p className="home-screenshots-lead">
        Real screens from Slumber: feed, post detail, challenges, stats, and friend compare.
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
