import { describe, expect, it } from 'vitest';
import { extractBudgets, findEmail, findPhone, findTimeline } from '../src/extract.js';

describe('extractBudgets', () => {
  it.each([
    ['our budget is $5,000', 5000],
    ['around $12k total', 12000],
    ['we can do €2,500.50', 2500.5],
    ['£1.2m for the year', 1_200_000],
    ['roughly 8000 USD', 8000],
    ['15 thousand dollars max', 15000],
    ['budget is around 7k', 7000],
    ['Budget: 3500', 3500],
  ])('%s -> %d', (text, amount) => {
    expect(extractBudgets(text).map((b) => b.amount)).toContain(amount);
  });

  it('ignores plain numbers that are not money', () => {
    expect(extractBudgets('we have 12 people and 3 offices')).toEqual([]);
  });
});

describe('findEmail / findPhone', () => {
  it('finds an email', () => {
    expect(findEmail('reach me at jane.doe+leads@acme.io thanks')).toBe('jane.doe+leads@acme.io');
  });

  it.each(['+1 (415) 555-0132', '415.555.0132', '+44 20 7946 0958', '0612345678'])(
    'finds phone %s',
    (phone) => {
      expect(findPhone(`call ${phone} anytime`)).toBe(phone);
    },
  );

  it('does not treat short numbers or dates as phones', () => {
    expect(findPhone('we need 3 pages by 2026-11-01')).toBeUndefined();
    expect(findPhone('team of 25')).toBeUndefined();
  });
});

describe('findTimeline', () => {
  it.each([
    ['need this asap', 'near'],
    ['can we start next week?', 'near'],
    ['live by Friday please', 'near'],
    ['within 10 days', 'near'],
    ['in two weeks', 'near'],
    ['within 3 weeks', 'far'],
    ['sometime next month', 'far'],
    ['launching in Q3', 'far'],
    ['in a couple of months', 'far'],
    ['before the end of the quarter', 'far'],
  ])('%s -> %s', (text, kind) => {
    expect(findTimeline(text)?.kind).toBe(kind);
  });

  it('returns undefined when there is no timeline', () => {
    expect(findTimeline('hello, tell me about your services')).toBeUndefined();
  });
});
