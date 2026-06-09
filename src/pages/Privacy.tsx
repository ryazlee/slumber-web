import LegalPage from '../components/LegalPage';
import { privacyMeta, privacySections } from '../content/privacy';

export default function Privacy() {
  return (
    <LegalPage
      title={privacyMeta.title}
      updated={privacyMeta.updated}
      sections={privacySections}
    />
  );
}
