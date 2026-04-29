# Contract Intelligence Platform

## Overview
A Claude-powered chat interface that turns Canadian federal contract spending data into actionable insights and intelligence. Designed for government analysts to catch procurement anomalies before they become scandals, and for citizens to understand how tax dollars are spent.

## Problem
- Canada spends $37B annually on procurement; $19.5B on external services (↑135% since 2015)
- **The Intelligence Gap**: Data exists but nobody reads it intelligently
- Government analysts discover overspending via audits (too late), not dashboards
- Citizens can't verify if spending is wise without advanced data skills

## Users
1. **Contract Analyst** (primary): Internal auditor/policy analyst. Has data access but no analysis tools.
   - Pain: Discovers problems after-the-fact via audit reports
   - Goal: Catch cost anomalies early, benchmark contracts, understand vendor concentration
   
2. **Citizen** (secondary): Taxpayer seeking transparency.
   - Pain: Headlines about "$19.5B spending" without context
   - Goal: Understand if government money is spent wisely

## MVP Features (Priority Order)

### Must-Have (S1 & S2)
**S1: Catch Rising Costs**
- Show which contract categories got more expensive (year-over-year, by-category ranking)
- Surface cost anomalies automatically
- Goal: Analyst finds top 5 cost-growing categories in <2 min without spreadsheets

**S2: Know Vendor Concentration**
- Show how much of each category one vendor controls
- Automatic risk flag when concentration exceeds threshold
- Goal: Analyst spots when competition has effectively ended in a market

### Should-Have (S3)
**S3: Challenge Inflated Rates**
- Benchmark proposed contract rates against historical government spend
- Show median + range for comparable past contracts
- Goal: Analyst can negotiate with data, not gut feeling

### Nice-to-Have (S4)
**S4: Explain Cost Drivers**
- Break any spend increase into: more contracts, higher prices, or fewer vendors
- AI-generated plain-language explanation
- Goal: Analyst can answer "why did consulting spend go up 40%?" in seconds

### Citizen Features (A1, A2)
**A1: Understand Vendor Spending**
- Search any company, see total $ received + growth trend
- Plain language: "Deloitte received $308M in 2024, up 2,100% since 2013"
- Shareable findings

**A2: Promise vs Reality**
- Track government's own spending commitments against actual spend
- Catch spend reclassification (when consulting spend drops but gets relabeled as "informatics")

## Data Architecture

### Key Principles
- **Data stays on servers** unless Claude summaries demonstrably improve user decisions
- Keep sensitive contract data off Claude's servers; send aggregated/summarized views
- Server-side processing: all raw data manipulation, normalization, PII-handling
- Claude's job: Turn processed data into insights, not process raw data

### Data Flow
1. Ingest: Open Canada contracts dataset (public proactive disclosure CSV)
2. Normalize: Standardize across departments (inconsistent formats)
3. Aggregate: Build views for cost trends, vendor concentration, benchmarks
4. Present to Claude: Summaries + user queries (no raw contract-level data)
5. Respond: Insights + recommended actions + rationale (visualizations on request)

### Core Datasets to Build
- `contract_summaries`: Aggregated spend by category, vendor, department, year
- `vendor_concentration`: % market share by vendor/category over time
- `cost_benchmarks`: Median + range of contract rates by category + year
- `category_trends`: Year-over-year cost growth rates ranked
- `compliance_tracker`: Policy promises vs actual spend (for A2)

## Tech Stack
- **Backend**: Node.js + Express
- **Frontend**: React 18+
- **Claude Integration**: Claude API with prompt caching for contract analysis
- **Data**: In-memory aggregations (can scale to PostgreSQL)
- **Auth**: Government platform auth (placeholder for now)

## Chat Interface Behavior

### Analyst Chat Flow
User: "Show me rising costs"
Claude: "Management consulting costs rose 18% YoY, driven by unit price increases (not volume growth). Top 3 outliers: ArriveCAN contractors at $450/day (61% above market), Finance consulting in Q3 2024, and IT services procurement. I'd flag ArriveCAN immediately."

User: "Who's capturing the management consulting market?"
Claude: "Deloitte controls 42% (up from 12% in 2019). Accenture is #2 at 18%. These two firms control 60% of the category—you've lost competitive pressure. If either walks away, the govt has no alternatives."

### Citizen Chat Flow
User: "Is government spending on consulting out of control?"
Claude: "Here's what the data shows. Consulting spend went from $8.3B (2015) to $19.5B (2025). That's 135% growth. Most of that ($8.5B) happened since 2020. Top recipients: Deloitte ($308M), Accenture ($95M), EY ($87M). Three firms capture 40% of total spend. No benchmarking was done to verify these rates reflect market value."

### Response Pattern
1. **Lead with insight**: State the finding clearly
2. **Provide context**: Why it matters (GC1/GC3/GC4)
3. **Show rationale**: What data supports this (cite aggregates, not raw contracts)
4. **Suggest action**: What the analyst should do next
5. **Offer visualization**: "Want to see this as a chart?" (on-demand)

## Known Constraints
- Must stay Canada-specific (different procurement rules than other countries)
- Data is public proactive disclosure (already published; no classification issues)
- Compliance: Audit trails required for all queries (for government transparency)
- Performance: Analyst queries should respond in <5 seconds

## Success Metrics
- S1: Analyst finds top 5 cost-growing categories in <2 min
- S2: Analyst spots vendor concentration in <1 min
- S3: Analyst benchmarks a contract rate in <60 sec
- Citizen A1: Non-technical user understands "$308M Deloitte" story without help
- System: Sub-5s response time for all queries
