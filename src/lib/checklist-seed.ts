// Phrased as errors/violations, not good practices: the errors-analytics
// page counts a *checked* response as "this mistake happened on this
// trade" (calculateErrorsAnalytics treats checked === true as an error),
// so the default rules must match that polarity.
export const DEFAULT_CHECKLIST_RULES = [
  'Plan non respecté',
  'Revenge trading',
  'Taille de position incorrecte',
  'Stop loss absent',
];
