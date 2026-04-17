Here's the complete master god plan — every layer, every file, every decision, zero ambiguity.

---

## The full tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | SSR, file-based routing, API routes in one repo |
| Styling | Tailwind CSS + shadcn/ui | Production-grade components in hours, not days |
| Charts | Recharts | TypeScript-native, composable, beautiful |
| Backend | Next.js API Routes (Node.js) | No separate server needed — everything in one monorepo |
| AI Core | Claude API (`claude-sonnet-4-6`) | Multilingual, sarcasm detection, JSON mode, confidence scoring |
| Database | SQLite via `better-sqlite3` | Zero-setup, file-based, perfect for hackathon + demo |
| ORM | Drizzle ORM | TypeScript-first, perfect SQLite support |
| Language detection | `@langdetect/langdetect` | Fast, browser-compatible |
| Translation | `@google-cloud/translate` or LibreTranslate | Hindi → English pipeline |
| File parsing | `papaparse` (CSV) + `zod` (validation) | Type-safe parsing |
| Export | `jspdf` + `jspdf-autotable` | PDF report generation |
| Dedup | `fuzzysort` + crypto MD5 | Exact + near-duplicate detection |
| State | Zustand | Lightweight, TypeScript-perfect |
| Auth | None needed for hackathon | Skip it, save 4 hours |

---

## Complete folder structure

```
review-intelligence/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Dashboard home
│   ├── upload/page.tsx           # Ingestion page
│   ├── trends/page.tsx           # Trend analysis page
│   ├── alerts/page.tsx           # Emerging issues
│   ├── review-queue/page.tsx     # Human review queue
│   └── api/
│       ├── ingest/route.ts       # POST: upload reviews
│       ├── feed/route.ts         # GET: simulated live feed (SSE)
│       ├── analyze/route.ts      # POST: trigger NLP pipeline
│       ├── reviews/route.ts      # GET: paginated reviews
│       ├── features/route.ts     # GET: feature sentiment data
│       ├── trends/route.ts       # GET: trend calculations
│       ├── alerts/route.ts       # GET: active alerts
│       └── export/route.ts       # GET: download report
├── lib/
│   ├── db/
│   │   ├── schema.ts             # Drizzle schema definition
│   │   ├── index.ts              # DB connection singleton
│   │   └── migrations/           # Auto-generated
│   ├── nlp/
│   │   ├── analyzer.ts           # Main Claude API orchestrator
│   │   ├── dedup.ts              # Deduplication + bot detection
│   │   ├── translator.ts         # Language detect + translate
│   │   └── trends.ts             # Rolling window + z-score logic
│   ├── prompts/
│   │   └── extract.ts            # Claude prompt templates
│   └── utils/
│       ├── csv-parser.ts         # CSV/JSON ingestion helpers
│       └── export.ts             # PDF/CSV export logic
├── components/
│   ├── dashboard/
│   │   ├── MetricCard.tsx
│   │   ├── FeatureSentimentChart.tsx
│   │   ├── TrendLineChart.tsx
│   │   ├── AlertFeed.tsx
│   │   └── ReviewTable.tsx
│   ├── upload/
│   │   ├── FileDropzone.tsx
│   │   ├── PasteInput.tsx
│   │   └── LiveFeedToggle.tsx
│   └── ui/                       # shadcn components
├── store/
│   └── useReviewStore.ts         # Zustand global state
├── types/
│   └── index.ts                  # All shared TypeScript types
├── data/
│   └── seed/
│       ├── smartphones.json      # 120 reviews (seeded battery trend)
│       ├── noodles.json          # 80 reviews
│       └── skincare.json         # 60 reviews
└── scripts/
    └── generate-seed.ts          # Synthetic data generator
```

---

## The database schema

This is the most important design decision. Get this right and everything else snaps into place.---

## Full request lifecycle — what happens when a CSV is uploaded---

## Phase-by-phase implementation plan

### Phase 0 — Project bootstrap (Hour 0–1)

```bash
npx create-next-app@latest review-intelligence \
  --typescript --tailwind --app --src-dir false
cd review-intelligence
npx shadcn@latest init
npx shadcn@latest add card badge button table tabs alert progress
npm install better-sqlite3 drizzle-orm drizzle-kit @anthropic-ai/sdk \
  papaparse fuzzysort zod zustand recharts jspdf jspdf-autotable \
  @langdetect/langdetect crypto-js
npm install -D @types/better-sqlite3 @types/papaparse @types/crypto-js
```

Create `lib/db/schema.ts` with all six tables using Drizzle. Run `npx drizzle-kit push` to create the SQLite file. This entire phase takes 45 minutes if you move fast.

---

### Phase 1 — Types foundation (Hour 1–1.5)

Define everything in `types/index.ts` first. Every other file imports from here. Nothing should use `any`.

```typescript
export type Sentiment = 'positive' | 'negative' | 'neutral' | 'ambiguous';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface RawReview {
  id: string;
  product_id: string;
  text: string;
  created_at: string;
  batch_id?: string;
}

export interface FeatureSentiment {
  feature: string;       // "battery_life" | "packaging" | "delivery" etc.
  sentiment: Sentiment;
  confidence: number;    // 0–1
  quote: string;         // verbatim snippet from review
}

export interface AnalyzedReview extends RawReview {
  language: string;
  translated_text?: string;
  overall_sentiment: Sentiment;
  confidence: number;
  is_sarcastic: boolean;
  is_ambiguous: boolean;
  features: FeatureSentiment[];
}

export interface TrendSnapshot {
  product_id: string;
  feature: string;
  batch_index: number;
  negative_pct: number;
  positive_pct: number;
  z_score: number;
  is_anomaly: boolean;
}

export interface Alert {
  id: string;
  product_id: string;
  feature: string;
  severity: Severity;
  message: string;
  current_pct: number;
  previous_pct: number;
  delta: number;
  created_at: string;
}
```

---

### Phase 2 — The Claude prompt (Hour 1.5–3, most critical)

This is the heart of the entire product. File: `lib/prompts/extract.ts`

```typescript
export const buildExtractionPrompt = (text: string): string => `
You are a product review analyst. Analyze this customer review and return ONLY valid JSON.

Review: "${text}"

Return this exact structure:
{
  "overall_sentiment": "positive" | "negative" | "neutral" | "ambiguous",
  "overall_confidence": 0.0-1.0,
  "is_sarcastic": true | false,
  "is_ambiguous": true | false,
  "language_detected": "en" | "hi" | "mixed",
  "features": [
    {
      "feature": "battery_life" | "packaging" | "delivery_speed" | 
                 "build_quality" | "customer_support" | "price_value" | 
                 "taste" | "fragrance" | "effectiveness" | "other",
      "sentiment": "positive" | "negative" | "neutral",
      "confidence": 0.0-1.0,
      "quote": "<exact short phrase from review>"
    }
  ],
  "sarcasm_reason": "<why flagged as sarcastic, or null>",
  "ambiguity_reason": "<why ambiguous, or null>"
}

Rules:
- Only extract features ACTUALLY mentioned. Do not invent features.
- If sarcastic OR ambiguous: set is_sarcastic/is_ambiguous to true.
- Confidence = your certainty in that extraction (0 = guessing, 1 = certain).
- Return ONLY the JSON object. No markdown, no explanation.
`;
```

Then in `lib/nlp/analyzer.ts`, call this with batching and rate-limit handling:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function analyzeReview(text: string): Promise<AnalyzedReview> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: buildExtractionPrompt(text) }]
  });
  
  const raw = response.content[0].type === 'text' ? response.content[0].text : '';
  const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
  return parsed;
}

// Batch processor with 100ms delay between calls to respect rate limits
export async function analyzeBatch(reviews: RawReview[]): Promise<void> {
  for (const review of reviews) {
    const result = await analyzeReview(review.translated_text ?? review.text);
    await saveToDatabase(review, result);
    await new Promise(r => setTimeout(r, 100)); // rate limit buffer
  }
}
```

---

### Phase 3 — Deduplication engine (Hour 3–4)

File: `lib/nlp/dedup.ts`

```typescript
import crypto from 'crypto';

// Exact duplicate: MD5 hash of normalized text
export function hashReview(text: string): string {
  return crypto.createHash('md5')
    .update(text.toLowerCase().replace(/\s+/g, ' ').trim())
    .digest('hex');
}

// Near-duplicate: simple Jaccard similarity on word sets
export function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

// Bot detection: same review text appearing 3+ times = bot
export function detectBotPattern(reviews: string[]): Set<string> {
  const freq = new Map<string, number>();
  reviews.forEach(r => {
    const h = hashReview(r);
    freq.set(h, (freq.get(h) ?? 0) + 1);
  });
  return new Set([...freq.entries()]
    .filter(([, count]) => count >= 3)
    .map(([hash]) => hash));
}
```

---

### Phase 4 — Trend engine (Hour 4–7, second most critical)

File: `lib/nlp/trends.ts` — this is what wins the hackathon.

```typescript
export interface WindowResult {
  feature: string;
  current_negative_pct: number;
  previous_negative_pct: number;
  delta: number;
  z_score: number;
  is_anomaly: boolean;
  issue_type: 'isolated' | 'emerging' | 'systemic';
  unique_users_affected: number;
}

export function computeRollingTrends(
  reviews: AnalyzedReview[],
  windowSize = 50
): WindowResult[] {
  const results: WindowResult[] = [];
  
  const allFeatures = [...new Set(
    reviews.flatMap(r => r.features.map(f => f.feature))
  )];
  
  const current = reviews.slice(-windowSize);
  const previous = reviews.slice(-windowSize * 2, -windowSize);
  
  for (const feature of allFeatures) {
    const currentNeg = current.filter(r =>
      r.features.some(f => f.feature === feature && f.sentiment === 'negative')
    ).length / Math.max(current.length, 1);
    
    const previousNeg = previous.length > 0
      ? previous.filter(r =>
          r.features.some(f => f.feature === feature && f.sentiment === 'negative')
        ).length / previous.length
      : 0;
    
    const delta = currentNeg - previousNeg;
    
    // Z-score: how many standard deviations above historical mean?
    const historicalMean = previousNeg;
    const historicalStd = Math.sqrt(previousNeg * (1 - previousNeg) / windowSize);
    const z_score = historicalStd > 0 ? delta / historicalStd : 0;
    
    const matchingReviews = current.filter(r =>
      r.features.some(f => f.feature === feature && f.sentiment === 'negative')
    );
    const uniqueUsers = new Set(matchingReviews.map(r => r.id)).size;
    
    const issue_type =
      uniqueUsers <= 2 ? 'isolated' :
      z_score > 2.0 ? 'systemic' : 'emerging';
    
    results.push({
      feature, current_negative_pct: currentNeg, previous_negative_pct: previousNeg,
      delta, z_score, is_anomaly: z_score > 2.0, issue_type, unique_users_affected: uniqueUsers
    });
  }
  
  return results.sort((a, b) => b.delta - a.delta);
}

// Generate human-readable alert messages
export function generateAlertMessage(r: WindowResult, productName: string): string {
  const curr = Math.round(r.current_negative_pct * 100);
  const prev = Math.round(r.previous_negative_pct * 100);
  const label = r.feature.replace(/_/g, ' ');
  
  if (r.issue_type === 'systemic') {
    return `${label} complaints in ${productName} have reached ${curr}% (up from ${prev}% in previous window). ` +
           `Affecting ${r.unique_users_affected} unique reviewers — likely a systemic batch issue. ` +
           `Recommended action: audit ${label} supply chain or vendor for this period.`;
  }
  return `${label} negative mentions rose to ${curr}% from ${prev}%. Monitor over next 50 reviews.`;
}
```

---

### Phase 5 — API routes (Hour 7–11)

**`app/api/ingest/route.ts`** — handles all three ingestion modes:

```typescript
export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const text = formData.get('text') as string | null;
  const productId = formData.get('product_id') as string;
  
  let rawReviews: RawReview[] = [];
  
  if (file) {
    const content = await file.text();
    rawReviews = file.name.endsWith('.json')
      ? JSON.parse(content)
      : parseCsv(content); // papaparse
  } else if (text) {
    rawReviews = text.split('\n')
      .filter(Boolean)
      .map((line, i) => ({ id: `manual-${i}`, product_id: productId, text: line, created_at: new Date().toISOString() }));
  }
  
  const batchId = crypto.randomUUID();
  const dedupedReviews = await deduplicateAndFlag(rawReviews);
  
  // Queue for analysis (don't block the response)
  analyzeBatch(dedupedReviews).catch(console.error);
  
  return Response.json({ 
    queued: dedupedReviews.length,
    flagged_bots: rawReviews.length - dedupedReviews.length,
    batch_id: batchId
  });
}
```

**`app/api/feed/route.ts`** — Server-Sent Events for simulated live feed:

```typescript
export async function GET(req: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reviews = loadSeedData(); // your 300 reviews
      for (const review of reviews) {
        const data = `data: ${JSON.stringify(review)}\n\n`;
        controller.enqueue(encoder.encode(data));
        await new Promise(r => setTimeout(r, 800)); // 1 review per 0.8s
      }
      controller.close();
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}
```

---

### Phase 6 — Dashboard pages (Hour 11–22)

**Dashboard home (`app/page.tsx`)** — four metric cards + feature chart + alert preview:

The layout uses a 12-column Tailwind grid. Top row: 4 metric cards (total reviews, avg sentiment score, active alerts, reviews in queue). Below: 60/40 split — feature sentiment bar chart left, live alert feed right. Bottom: trend line chart full width.

Key component logic for the feature sentiment chart using Recharts:

```tsx
// components/dashboard/FeatureSentimentChart.tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function FeatureSentimentChart({ data }: { data: FeatureData[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
        <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
        <YAxis type="category" dataKey="feature" width={95} />
        <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
        <Legend />
        <Bar dataKey="positive" stackId="a" fill="#1D9E75" name="Positive" />
        <Bar dataKey="neutral" stackId="a" fill="#888780" name="Neutral" />
        <Bar dataKey="negative" stackId="a" fill="#E24B4A" name="Negative" radius={[0,4,4,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

For the trend line chart, the key is showing the rolling window comparison visually. Use Recharts `ReferenceLine` to mark the point where the anomaly was detected — a vertical dashed red line with a label "Anomaly detected."

**Alerts page (`app/alerts/page.tsx`)** — this is what judges will look at longest. Each alert card shows: feature name as a large badge, current vs previous percentage as a visual arrow-up indicator, severity pill (critical/high/medium), the full plain-English message, and a "Mark resolved" button.

**Review queue page (`app/review-queue/page.tsx`)** — table of all ambiguous/sarcastic reviews with flag reason, original text, detected language badge, and "Approve sentiment" / "Mark negative" / "Mark positive" action buttons that update the database and re-run trend analysis.

---

### Phase 7 — Synthetic data + seeded trend (Hour 22–26)

Run `scripts/generate-seed.ts` to generate data programmatically:

```typescript
// For smartphones: reviews 1–150, battery_negative = ~6–10%
// For smartphones: reviews 151–260, battery_negative = 35–42% ← THE SEEDED TRAP
// Mix in: 15% Hindi reviews, 8% Hinglish, 4% bot duplicates, 6% sarcastic

const hindiTemplates = [
  "Yaar ye battery bahut kharab hai, ek din bhi nahi chalta",
  "Packaging bilkul sahi thi, phone safe aaya",
  "Customer support se baat ki, koi jawab nahi mila",
  "Bahut bekar phone hai, paise waste ho gaye 😤",
];

const sarcasticTemplates = [
  "Oh wow, 2 hours of battery life. Absolutely revolutionary technology.",
  "The packaging was SO good it took 20 minutes to open. 10/10.",
];
```

Make sure your JSON has realistic timestamps — reviews 151–260 should have timestamps clustered in the last 2 weeks. Your trend engine needs real temporal data to fire the anomaly alert correctly.

---

### Phase 8 — PDF export (Hour 26–28)

File: `lib/utils/export.ts` using `jspdf-autotable`:

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateReport(product: string, data: ReportData): Blob {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(`Review Intelligence Report — ${product}`, 14, 20);
  doc.setFontSize(11);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
  
  // Feature sentiment table
  autoTable(doc, {
    startY: 40,
    head: [['Feature', 'Positive %', 'Negative %', 'Confidence']],
    body: data.features.map(f => [
      f.feature, `${f.positive_pct}%`, `${f.negative_pct}%`, f.avg_confidence.toFixed(2)
    ])
  });
  
  // Active alerts section
  doc.addPage();
  doc.text('Active Alerts', 14, 20);
  autoTable(doc, {
    startY: 30,
    head: [['Feature', 'Severity', 'Current %', 'Previous %', 'Recommendation']],
    body: data.alerts.map(a => [
      a.feature, a.severity.toUpperCase(), `${a.current_pct}%`, 
      `${a.previous_pct}%`, a.message.slice(0, 60) + '...'
    ])
  });
  
  return doc.output('blob');
}
```

---

### Phase 9 — Polish + demo prep (Hour 28–36)

Implement the live feed toggle on the upload page — a toggle switch that starts the SSE connection and shows reviews arriving in real time with a typing indicator. This is the most visually impressive demo moment.

Add a product comparison tab that shows all three product categories side by side — a grouped bar chart of negative sentiment across features for each product. This hits the stretch goal of cross-category comparison.

Add loading skeletons using shadcn's `Skeleton` component everywhere data is async. Empty states with clear CTAs. Make sure every number on the dashboard is rounded with `toFixed(1)`.

---

## The 36-hour clock breakdown

| Hours | What to build | Who |
|---|---|---|
| 0–3 | Bootstrap, schema, types, Claude prompt | Full team |
| 3–8 | Ingestion API, dedup, NLP pipeline, DB writes | Backend person |
| 3–8 | Dashboard layout, metric cards, charts skeleton | Frontend person |
| 8–14 | Trend engine, alerts system, API routes | Backend |
| 8–14 | Connect APIs to charts, alerts page, review queue | Frontend |
| 14–22 | Live feed SSE, multilingual pipeline, sarcasm queue | Backend |
| 14–22 | Export PDF, comparison view, mobile responsive | Frontend |
| 22–26 | Generate synthetic data, seed the battery trend | Both |
| 26–30 | End-to-end testing, bug fixes, real demo run | Both |
| 30–36 | PPT deck, rehearse demo, buffer | Both |

---

## The three demo moments that win

When you demo, hit these three beats in order. First, drop the smartphone CSV — show the dedup counter tick up, bot reviews appear in their own flagged section. Second, navigate to trends and point at the battery_life line spiking at review 151 with the red anomaly marker — say "our system detected this automatically with a z-score of 2.4, which means this is statistically 2.4 standard deviations above normal — a systemic issue, not noise." Third, click the alert and read the plain-English recommendation out loud: "audit battery vendor for orders placed in this period." That's the commercial value. That's what wins.
