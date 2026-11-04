import LegalPage from '../components/LegalPage';
import { prizeDrawingRulesMeta, prizeDrawingRulesSections } from '../content/prizeDrawingRules';

export default function PrizeDrawingRules() {
  return (
    <LegalPage
      title={prizeDrawingRulesMeta.title}
      updated={prizeDrawingRulesMeta.updated}
      sections={prizeDrawingRulesSections}
    />
  );
}
