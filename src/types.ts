export type LeadTier = 'hot' | 'warm' | 'cold';

export type SignalId =
  | 'budgetHigh'
  | 'budget'
  | 'budgetMentioned'
  | 'timelineNear'
  | 'timelineFar'
  | 'urgency'
  | 'intent'
  | 'email'
  | 'phone'
  | 'detail'
  | 'negative';

export type Weights = Record<SignalId, number>;

export interface LeadInput {
  message: string;
  email?: string;
  phone?: string;
  name?: string;
  company?: string;
}

export interface Signal {
  id: SignalId;
  points: number;
  /** The text that triggered the signal, when there is one. */
  evidence?: string;
}

export interface Thresholds {
  /** Minimum score for a hot lead. */
  hot: number;
  /** Minimum score for a warm lead. */
  warm: number;
}

export interface ScoreOptions {
  weights?: Partial<Weights>;
  thresholds?: Partial<Thresholds>;
  /** Budgets at or above this amount count as budgetHigh. */
  highBudget?: number;
  /** Extra words added to the built-in lists. Matched case-insensitively on word boundaries. */
  urgencyWords?: string[];
  intentWords?: string[];
  negativeWords?: string[];
  /** Word count at which a message counts as detailed. */
  detailWords?: number;
}

export interface ScoreResult {
  /** 0 to 100. */
  score: number;
  tier: LeadTier;
  signals: Signal[];
  /** Largest money amount found in the message, if any. */
  budget?: number;
}
