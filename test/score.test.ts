import { describe, expect, it } from 'vitest';
import { createScorer, defaultWeights, scoreLead, tierFor } from '../src/index.js';

const hot = `Hi, we're ready to hire an agency for our checkout rebuild. Budget is $25k and we
need it live by Friday, it's urgent because of a launch. I'm at sam@shopco.com or +1 415 555 0132.
Happy to jump on a call whenever works for you this week.`;

describe('scoreLead', () => {
  it('scores a strong lead as hot', () => {
    const r = scoreLead(hot);
    expect(r.tier).toBe('hot');
    expect(r.score).toBe(100);
    expect(r.budget).toBe(25000);
    expect(r.signals.map((s) => s.id).sort()).toEqual(
      ['budgetHigh', 'detail', 'email', 'intent', 'phone', 'timelineNear', 'urgency'].sort(),
    );
  });

  it('scores a vague message as cold', () => {
    const r = scoreLead('hey, just looking around. what do you do?');
    expect(r.tier).toBe('cold');
    expect(r.score).toBe(0);
    expect(r.signals).toEqual([{ id: 'negative', points: -25, evidence: 'just looking' }]);
  });

  it('scores a middling lead as warm', () => {
    const r = scoreLead({
      message: 'Interested in a quote for a new site, hoping to start next month.',
      email: 'kim@example.org',
    });
    expect(r.tier).toBe('warm');
    expect(r.score).toBe(defaultWeights.intent + defaultWeights.timelineFar + defaultWeights.email);
  });

  it('uses contact fields from the input object', () => {
    const r = scoreLead({ message: 'hello', email: ' a@b.co ', phone: '555 123 4567' });
    expect(r.signals).toEqual([
      { id: 'email', points: 10, evidence: 'a@b.co' },
      { id: 'phone', points: 10, evidence: '555 123 4567' },
    ]);
  });

  it('gives a small bump when budget is mentioned without an amount', () => {
    const r = scoreLead('what kind of budget would we need?');
    expect(r.signals).toEqual([{ id: 'budgetMentioned', points: 5, evidence: 'budget' }]);
    expect(r.budget).toBeUndefined();
  });

  it('picks the largest budget', () => {
    expect(scoreLead('$2k now, $8k later').budget).toBe(8000);
  });

  it('clamps the score to 0..100', () => {
    const r = scoreLead(hot, { weights: { budgetHigh: 500 } });
    expect(r.score).toBe(100);
    const low = scoreLead('no budget', { weights: { negative: -1000 } });
    expect(low.score).toBe(0);
  });

  it('handles an empty message', () => {
    expect(scoreLead('')).toEqual({ score: 0, tier: 'cold', signals: [] });
  });

  it('matches whole words only', () => {
    // "pricey" should not trigger "price", "criticality" should not trigger "critical"
    expect(scoreLead('kinda pricey, criticality unknown').signals).toEqual([]);
  });
});

describe('options', () => {
  it('respects custom weights and drops zero-weight signals', () => {
    const r = scoreLead('urgent: send pricing', { weights: { urgency: 40, intent: 0 } });
    expect(r.signals).toEqual([{ id: 'urgency', points: 40, evidence: 'urgent' }]);
    expect(r.tier).toBe('warm');
  });

  it('respects custom thresholds', () => {
    const r = scoreLead('send me pricing', { thresholds: { hot: 10, warm: 5 } });
    expect(r.tier).toBe('hot');
  });

  it('respects a custom high budget', () => {
    expect(scoreLead('$5k', { highBudget: 5000 }).signals[0]?.id).toBe('budgetHigh');
    expect(scoreLead('$5k').signals[0]?.id).toBe('budget');
  });

  it('extends word lists', () => {
    const scorer = createScorer({
      urgencyWords: ['on fire'],
      intentWords: ['retainer'],
      negativeWords: ['competitor research'],
    });
    const ids = scorer('site is on fire, want a retainer').signals.map((s) => s.id);
    expect(ids).toEqual(['urgency', 'intent']);
    expect(scorer('just competitor research').signals[0]?.id).toBe('negative');
  });

  it('rejects warm > hot', () => {
    expect(() => createScorer({ thresholds: { warm: 80, hot: 50 } })).toThrow(RangeError);
  });
});

describe('tierFor', () => {
  it('maps scores to tiers', () => {
    expect(tierFor(60)).toBe('hot');
    expect(tierFor(59)).toBe('warm');
    expect(tierFor(30)).toBe('warm');
    expect(tierFor(29)).toBe('cold');
    expect(tierFor(5, { hot: 10, warm: 5 })).toBe('warm');
  });
});
