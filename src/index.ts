export { createScorer, scoreLead, tierFor } from './score.js';
export type { Scorer } from './score.js';
export { extractBudgets, findEmail, findPhone, findTimeline } from './extract.js';
export type { BudgetMatch, TimelineKind } from './extract.js';
export {
  defaultHighBudget,
  defaultThresholds,
  defaultWeights,
  intentWords,
  negativeWords,
  urgencyWords,
} from './defaults.js';
export type * from './types.js';
