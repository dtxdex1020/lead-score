import type { Thresholds, Weights } from './types.js';

// The positive weights add up to 100 so a lead that hits everything maxes out.
export const defaultWeights: Weights = {
  budgetHigh: 25,
  budget: 15,
  budgetMentioned: 5,
  timelineNear: 20,
  timelineFar: 10,
  urgency: 15,
  intent: 15,
  email: 10,
  phone: 10,
  detail: 5,
  negative: -25,
};

export const defaultThresholds: Thresholds = { hot: 60, warm: 30 };

export const defaultHighBudget = 10_000;

export const defaultDetailWords = 25;

export const urgencyWords = [
  'urgent',
  'urgently',
  'asap',
  'immediately',
  'right away',
  'as soon as possible',
  'deadline',
  'time sensitive',
  'time-sensitive',
  'critical',
  'emergency',
  'today',
];

export const intentWords = [
  'buy',
  'purchase',
  'hire',
  'quote',
  'pricing',
  'price',
  'proposal',
  'contract',
  'sign up',
  'get started',
  'ready to',
  'looking to',
  'interested in',
  'book a call',
  'schedule a call',
  'demo',
];

export const negativeWords = [
  'just looking',
  'just browsing',
  'no budget',
  'not sure yet',
  'maybe later',
  'not now',
  'student project',
  'for free',
  'free of charge',
  'unsubscribe',
  'school project',
  'no rush',
];
