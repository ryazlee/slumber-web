import LegalPage from '../components/LegalPage';
import { termsMeta, termsSections } from '../content/terms';

export default function Terms() {
  return (
    <LegalPage
      title={termsMeta.title}
      updated={termsMeta.updated}
      sections={termsSections}
    />
  );
}
