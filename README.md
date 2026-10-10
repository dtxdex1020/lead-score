# lead-score

[![CI](https://img.shields.io/github/actions/workflow/status/dtxdex1020/lead-score/ci.yml?branch=main&style=flat-square&label=CI&labelColor=1f4e79)](https://github.com/dtxdex1020/lead-score/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-4aa3df?style=flat-square&labelColor=1f4e79&logo=typescript&logoColor=white)](./tsconfig.json)
[![dependencies](https://img.shields.io/badge/dependencies-0-4aa3df?style=flat-square&labelColor=1f4e79)](./package.json)
[![license](https://img.shields.io/badge/license-MIT-4aa3df?style=flat-square&labelColor=1f4e79)](./LICENSE)

Your contact form gets 40 messages a day. Three of them are people with a budget and a deadline. This tiny library finds those three.

`lead-score` reads an inbound message and tags it **hot**, **warm** or **cold** based on the stuff that actually matters: money, timing, urgency, buying intent and whether they left a way to reach them. No API calls, no dependencies, runs anywhere JavaScript does.

## Install

```sh
npm install lead-score
```

> Not on npm yet. Until it is, install from GitHub: `npm install github:dtxdex1020/lead-score`.

## Usage

```ts
import { scoreLead } from 'lead-score';

const result = scoreLead(
  "We're ready to hire someone for a Shopify rebuild. Budget is $25k, need it live by Friday. sam@shopco.com",
);

result.tier; // 'hot'
result.score; // 70
result.budget; // 25000
result.signals;
// [
//   { id: 'budgetHigh', points: 25, evidence: '$25k' },
//   { id: 'timelineNear', points: 20, evidence: 'by Friday' },
//   { id: 'intent', points: 15, evidence: 'hire' },
//   { id: 'email', points: 10, evidence: 'sam@shopco.com' },
// ]
```

Got structured form fields? Pass an object and the contact info counts even if it isn't in the message:

```ts
scoreLead({ message: 'Interested in a quote, starting next month', email: 'kim@example.org' });
// { score: 35, tier: 'warm', ... }
```

CommonJS works too:

```js
const { scoreLead } = require('lead-score');
```

## Tuning

Every weight, threshold and word list is configurable. Build a scorer once and reuse it:

```ts
import { createScorer } from 'lead-score';

const score = createScorer({
  weights: { urgency: 25, detail: 0 }, // 0 turns a signal off
  thresholds: { hot: 70, warm: 35 },
  highBudget: 50_000,
  intentWords: ['retainer', 'audit'],
  negativeWords: ['competitor research'],
});

score('Need an urgent audit before our raise');
```

## Signals

| Signal            | Default | Fires on                                                     |
| ----------------- | ------: | ------------------------------------------------------------ |
| `budgetHigh`      |     +25 | A money amount at or above `highBudget` (10,000)             |
| `budget`          |     +15 | A smaller money amount: `$5k`, `€2,500`, `8000 USD`          |
| `budgetMentioned` |      +5 | The word "budget" with no amount                             |
| `timelineNear`    |     +20 | `asap`, `this week`, `by Friday`, `within 10 days`           |
| `timelineFar`     |     +10 | `next month`, `Q3`, `in a couple of months`                  |
| `urgency`         |     +15 | `urgent`, `asap`, `deadline`, `immediately`, ...             |
| `intent`          |     +15 | `hire`, `quote`, `pricing`, `ready to`, `book a call`, ...   |
| `email`           |     +10 | An email in the message or the `email` field                 |
| `phone`           |     +10 | A phone number in the message or the `phone` field           |
| `detail`          |      +5 | A message with 25+ words                                     |
| `negative`        |     -25 | `just looking`, `no budget`, `maybe later`, `unsubscribe`... |

The positive weights add up to 100. Scores are clamped to 0..100. Default tiers: **hot** at 60+, **warm** at 30+, **cold** below.

## API

| Export                    | Description                                                            |
| ------------------------- | ---------------------------------------------------------------------- |
| `scoreLead(input, opts?)` | Score one lead. `input` is a string or `{ message, email?, phone? }`.  |
| `createScorer(opts?)`     | Returns a reusable `(input) => ScoreResult` with options baked in.     |
| `tierFor(score, t?)`      | Map a number to `'hot' \| 'warm' \| 'cold'`.                           |
| `extractBudgets(text)`    | All money amounts found, as `{ amount, text }[]`.                      |
| `findTimeline(text)`      | `{ kind: 'near' \| 'far', text }` or `undefined`.                      |
| `findEmail` / `findPhone` | First email / phone number in the text.                                |
| `defaultWeights`, ...     | The built-in weights, thresholds and word lists, if you want to extend |

### Options

| Option          | Type                       | Default         |
| --------------- | -------------------------- | --------------- |
| `weights`       | `Partial<Weights>`         | see table above |
| `thresholds`    | `{ hot?, warm? }`          | `{ 60, 30 }`    |
| `highBudget`    | `number`                   | `10000`         |
| `detailWords`   | `number`                   | `25`            |
| `urgencyWords`  | `string[]` (added to list) | built-in list   |
| `intentWords`   | `string[]` (added to list) | built-in list   |
| `negativeWords` | `string[]` (added to list) | built-in list   |

## Why

Most lead scoring lives inside a CRM you pay for per seat, or it's a pile of `if` statements in someone's Zapier step. I wanted something in between: small enough to read in one sitting, deterministic, explainable (every point comes with the text that earned it), and easy to drop into a form handler, a webhook or an inbox triage script.

It is a heuristic, not a crystal ball. Use it to sort the queue, not to ignore people.

## Development

```sh
npm install
npm test        # vitest
npm run lint    # eslint + prettier + tsc
npm run build   # ESM + CJS + types via tsup
```

## License

[MIT](./LICENSE)
