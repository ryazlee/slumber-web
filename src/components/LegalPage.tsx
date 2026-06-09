type Section = {
  heading: string;
  body: string[];
};

type LegalPageProps = {
  title: string;
  updated: string;
  sections: Section[];
};

export default function LegalPage({ title, updated, sections }: LegalPageProps) {
  return (
    <article className="page legal-doc">
      <h1>{title}</h1>
      <p className="legal-updated">Last updated {updated}</p>

      {sections.map((section) => (
        <section key={section.heading} className="legal-section">
          <h2>{section.heading}</h2>
          {section.body.length === 1 ? (
            <p>{section.body[0]}</p>
          ) : (
            <ul>
              {section.body.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  );
}
