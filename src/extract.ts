const NUM = String.raw`(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?`;
const SUFFIX = String.raw`\s*(k|m|thousand|million)?\b`;

const SYMBOL_AMOUNT = new RegExp(String.raw`[$€£]\s?${NUM}${SUFFIX}`, 'gi');
const WORD_AMOUNT = new RegExp(
  String.raw`\b${NUM}${SUFFIX}\s*(?:usd|eur|gbp|dollars|euros|pounds|bucks)\b`,
  'gi',
);
const BUDGET_AMOUNT = new RegExp(String.raw`\bbudget\b[^\d.!?]{0,25}${NUM}${SUFFIX}`, 'gi');

const MULTIPLIERS: Record<string, number> = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6 };

function toAmount(whole: string, fraction: string | undefined, suffix: string | undefined) {
  const n = Number(`${whole.replace(/,/g, '')}${fraction ? `.${fraction}` : ''}`);
  return n * (suffix ? (MULTIPLIERS[suffix.toLowerCase()] ?? 1) : 1);
}

export interface BudgetMatch {
  amount: number;
  text: string;
}

/** Finds money amounts like "$5k", "€2,500", "10000 USD" or "budget is around 8k". */
export function extractBudgets(text: string): BudgetMatch[] {
  const found: BudgetMatch[] = [];
  for (const re of [SYMBOL_AMOUNT, WORD_AMOUNT, BUDGET_AMOUNT]) {
    for (const m of text.matchAll(re)) {
      const [raw, whole, fraction, suffix] = m;
      if (!whole) continue;
      found.push({ amount: toAmount(whole, fraction, suffix), text: raw.trim() });
    }
  }
  return found;
}

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
// Seven or more digits, allowing the usual separators and a leading +.
const PHONE = /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d[\d\s.-]{5,}\d/;

export function findEmail(text: string): string | undefined {
  return text.match(EMAIL)?.[0];
}

export function findPhone(text: string): string | undefined {
  const m = text.match(PHONE)?.[0];
  if (!m || /^\d{4}-\d{2}-\d{2}$/.test(m.trim())) return undefined;
  const digits = m.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15 ? m.trim() : undefined;
}

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  few: 3,
  'a few': 3,
  couple: 2,
  'a couple of': 2,
  'a couple': 2,
};

const DAYS = 'monday|tuesday|wednesday|thursday|friday|saturday|sunday';

const NEAR = [
  /\b(?:asap|today|tonight|tomorrow|this week|next week|this weekend)\b/i,
  new RegExp(String.raw`\bby (?:${DAYS}|end of (?:the )?week|eow)\b`, 'i'),
  /\bend of (?:the |this )?week\b/i,
];

const FAR = [
  /\b(?:next month|this month|next quarter|this quarter|later this year|next year|this year)\b/i,
  /\bend of (?:the |this )?(?:month|quarter|year)\b/i,
  /\bq[1-4]\b/i,
  /\bby (?:january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
];

const SPAN =
  /\b(?:within|in|over the next|next)\s+(\d+|a couple of|a couple|a few|an?|one|two|three|four|five|six|few|couple)\s+(day|week|month)s?\b/i;

export type TimelineKind = 'near' | 'far';

/** Classifies how soon the lead wants to start. Near means roughly two weeks or less. */
export function findTimeline(text: string): { kind: TimelineKind; text: string } | undefined {
  const span = text.match(SPAN);
  if (span) {
    const [raw, qty = '1', unit] = span;
    const n = /^\d+$/.test(qty) ? Number(qty) : (NUMBER_WORDS[qty.toLowerCase()] ?? 1);
    const days =
      unit?.toLowerCase() === 'day' ? n : unit?.toLowerCase() === 'week' ? n * 7 : n * 30;
    return { kind: days <= 14 ? 'near' : 'far', text: raw };
  }
  for (const re of NEAR) {
    const m = text.match(re);
    if (m) return { kind: 'near', text: m[0] };
  }
  for (const re of FAR) {
    const m = text.match(re);
    if (m) return { kind: 'far', text: m[0] };
  }
  return undefined;
}

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Returns the first phrase from the list that appears in the text as whole words. */
export function findPhrase(text: string, phrases: readonly string[]): string | undefined {
  for (const phrase of phrases) {
    const re = new RegExp(`(?<![\\w-])${escape(phrase)}(?![\\w-])`, 'i');
    if (re.test(text)) return phrase;
  }
  return undefined;
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
