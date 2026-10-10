import {
  defaultDetailWords,
  defaultHighBudget,
  defaultThresholds,
  defaultWeights,
  intentWords,
  negativeWords,
  urgencyWords,
} from './defaults.js';
import {
  extractBudgets,
  findEmail,
  findPhone,
  findPhrase,
  findTimeline,
  wordCount,
} from './extract.js';
import type {
  LeadInput,
  LeadTier,
  ScoreOptions,
  ScoreResult,
  Signal,
  SignalId,
  Thresholds,
} from './types.js';

export type Scorer = (input: string | LeadInput) => ScoreResult;

/** Builds a scorer with fixed options. Cheaper than passing options on every call. */
export function createScorer(options: ScoreOptions = {}): Scorer {
  const weights = { ...defaultWeights, ...options.weights };
  const thresholds: Thresholds = { ...defaultThresholds, ...options.thresholds };
  if (thresholds.warm > thresholds.hot) {
    throw new RangeError('thresholds.warm must not be greater than thresholds.hot');
  }
  const highBudget = options.highBudget ?? defaultHighBudget;
  const detailWords = options.detailWords ?? defaultDetailWords;
  const urgency = [...urgencyWords, ...(options.urgencyWords ?? [])];
  const intent = [...intentWords, ...(options.intentWords ?? [])];
  const negative = [...negativeWords, ...(options.negativeWords ?? [])];

  return (input) => {
    const lead: LeadInput = typeof input === 'string' ? { message: input } : input;
    const text = lead.message ?? '';
    const signals: Signal[] = [];
    const add = (id: SignalId, evidence?: string) => {
      const points = weights[id];
      if (points !== 0) signals.push(evidence ? { id, points, evidence } : { id, points });
    };

    const budgets = extractBudgets(text);
    const top = budgets.reduce<(typeof budgets)[number] | undefined>(
      (best, b) => (!best || b.amount > best.amount ? b : best),
      undefined,
    );
    if (top) add(top.amount >= highBudget ? 'budgetHigh' : 'budget', top.text);
    else if (/\bbudget\b/i.test(text)) add('budgetMentioned', 'budget');

    const timeline = findTimeline(text);
    if (timeline) add(timeline.kind === 'near' ? 'timelineNear' : 'timelineFar', timeline.text);

    const urgent = findPhrase(text, urgency);
    if (urgent) add('urgency', urgent);

    const wants = findPhrase(text, intent);
    if (wants) add('intent', wants);

    const email = lead.email?.trim() || findEmail(text);
    if (email) add('email', email);

    const phone = lead.phone?.trim() || findPhone(text);
    if (phone) add('phone', phone);

    if (wordCount(text) >= detailWords) add('detail');

    const meh = findPhrase(text, negative);
    if (meh) add('negative', meh);

    const raw = signals.reduce((sum, s) => sum + s.points, 0);
    const score = Math.max(0, Math.min(100, Math.round(raw)));
    const result: ScoreResult = { score, tier: tierFor(score, thresholds), signals };
    if (top) result.budget = top.amount;
    return result;
  };
}

/** Scores a single lead. Pass a plain message or an object with contact fields. */
export function scoreLead(input: string | LeadInput, options?: ScoreOptions): ScoreResult {
  return createScorer(options)(input);
}

export function tierFor(score: number, thresholds: Thresholds = defaultThresholds): LeadTier {
  if (score >= thresholds.hot) return 'hot';
  if (score >= thresholds.warm) return 'warm';
  return 'cold';
}
