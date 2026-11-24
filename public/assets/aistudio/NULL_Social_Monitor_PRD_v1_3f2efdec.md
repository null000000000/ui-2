# NULL Social Monitor — Product Requirements Document (PRD)

**Version:** 1.0  
**Document status:** Ready for implementation  
**Delivery target:** Same-day functional MVP (time-boxed; no multi-week expansion)  
**Product:** NULL Social Monitor  
**Owner / Primary user:** Solo personal-brand creator and technical operator  
**Platforms:** YouTube, TikTok, Instagram, Facebook, X, LinkedIn  
**Visual reference:** The uploaded dark Meta-style analytics dashboard screenshot in this conversation.

---

## 1. Product Summary

NULL Social Monitor is a focused, detail-oriented social media monitoring and analytics application for the personal brand `null`.

It collects, stores, organizes, and explains performance data from the user's own accounts across six social platforms:

1. YouTube
2. TikTok
3. Instagram
4. Facebook
5. X
6. LinkedIn

The application is not a general productivity workspace, project-management product, CRM, publishing platform, or personal operating system. Its only purpose is to help the owner understand the performance of their social accounts and content.

The central product question is:

> What is happening across my social accounts, which content is performing, why is performance changing, and what should I investigate or do next?

The experience must be visually inspired by the uploaded reference: dark, dense, analytical, polished, and information-rich. It should feel like a serious creator analytics cockpit, not a generic admin dashboard.

## 2. Current Technical Context — Must Be Respected

The implementation agent must treat the following as the current known environment and verify it in the repository before changing anything.

### 2.1 Existing frontend

- React 18
- Vite
- Tailwind CSS
- Lucide Icons
- Existing UI and application shell are currently considered unsatisfactory and need a focused redesign for Social Monitor only.
- Current local UI address reported by the owner: `http://127.0.0.1:3000/`

### 2.2 Existing Backend

- NestJS + TypeScript
- Prisma ORM
- PostgreSQL
- Modular Monolith architecture
- Existing local API address reported by the owner: `http://127.0.0.1:3001/`
- Existing health endpoint reported by the owner: `GET /api/health`
- Existing Docker deployment works locally and already receives application data.

Known existing backend modules and capabilities from the owner's architecture description:

- `modules/integrations`
- `modules/synchronization`
- `modules/analytics`
- `modules/intelligence`
- `modules/dashboard`
- `core/crypto`
- `core/logging`
- `core/audit`
- `core/health`

Known existing Prisma models from the owner's description include:

- `Platform`
- `PlatformAccount`
- `IntegrationCredential`
- `SyncRun`
- `SyncError`
- `MetricDefinition`
- `MetricObservation`
- `MetricAggregate`
- `AnalysisRun`
- `Insight`
- `InsightEvidence`
- `Recommendation`
- `Notification`

**Important:** These names are based on the supplied architecture description. The implementation agent must inspect the real Prisma schema, services, controllers, DTOs, and routes. Do not assume a field, relation, or endpoint exists until verified.

### 2.3 Existing n8n automation architecture

The Social Monitor automation has already been built as 14 unpublished workflows in the `NULL Social Monitor` folder:

- `00` Central Orchestrator / Master Scheduler
- `01` YouTube Connector
- `02` TikTok Connector
- `03` Instagram Connector
- `04` Facebook Connector
- `05` X CSV Import
- `06` LinkedIn CSV Import
- `07` Universal Data Normalizer
- `08` Data Validation
- `09` Deduplication and Idempotency Preparation
- `10` Sync State Adapter
- `11` Delivery Adapter
- `12` Global Error Handler
- `14` Mock Data Provider

The workflows currently run in mock mode. No social accounts, developer apps, OAuth credentials, or platform permissions have been configured. The delivery adapter is not connected to the existing Backend yet. No live API integration should be assumed.

The n8n Cloud instance cannot call `localhost` on the owner's computer. A secure public HTTPS path (for example, Cloudflare Tunnel with access controls) will be configured in a later integration step. Do not invent an external URL.

### 2.4 Existing architecture rule

**Do not replace the current Backend, create a second Backend, create a second database, or rebuild the n8n automation.** The Social Monitor UI must reuse the existing NestJS/Prisma/PostgreSQL architecture and the existing n8n workflows. Add only missing capabilities after repository inspection proves they are missing.

---

## 3. Product Goals

### 3.1 Primary goals

1. Provide one place to monitor all six personal-brand platforms.
2. Give the owner detailed, trustworthy analytics rather than shallow KPI cards.
3. Show how individual posts and videos perform over time.
4. Explain metric definitions, time windows, source platforms, and data freshness.
5. Make it easy to identify top-performing and underperforming content.
6. Compare platforms without pretending unlike metrics are equivalent.
7. Make connection and synchronization health visible.
8. Keep the UI ready for the existing Backend and n8n delivery adapter.
9. Allow the owner to show, hide, and rearrange optional Social Monitor modules and dashboard widgets without breaking the application.
10. Deliver a usable local MVP in one focused build day, not a multi-week product expansion.

### 3.2 Success criteria

The MVP is successful when:

- The app launches using the existing frontend and Backend setup.
- The redesigned UI is clearly Social Monitor only.
- All six platforms appear as supported account sources with accurate connection states.
- The Dashboard can render real Backend data when the existing API provides it.
- When no real social data exists, the UI shows a useful empty/onboarding state or clearly labeled demo preview; it never presents invented values as live data.
- Content records can be browsed and inspected.
- Analytics charts use stored observations and correct time windows.
- Users can filter by platform, account, date range, and content type.
- Sync status and errors are understandable.
- Every metric can be traced to its platform, source field, collection time, and definition.
- Existing Backend modules and unrelated application functionality are not deleted or damaged.
- Build, type checks, and essential tests pass.

---

## 4. Explicit Non-Goals — Remove From This Product UI

The Social Monitor product must not include or surface any of the following:

- Time tracking
- Active timers
- Pomodoro
- Projects or subprojects
- Task management
- Deliverables or milestones
- Project health status
- Engineering quality metrics
- Documents Vault
- Knowledge Graph
- GitHub Activity dashboard
- Cross-system productivity analytics
- Freelance platforms tracker
- Invoicing, Stripe, billing, or CRM
- General-purpose personal productivity dashboard
- General-purpose project management
- General-purpose AI chat unrelated to social media analytics
- Social publishing, post scheduling, or content creation in the MVP
- DMs, inbox, comment moderation, or community management in the MVP
- Competitor scraping or unauthorized data access

Do not delete unrelated modules from the existing Backend or repository. They may belong to other existing products. The restriction is that this application's interface and user journey must be exclusively Social Media Monitoring.

---

## 5. Primary User Persona

### Persona: The Detail-Oriented Solo Creator / Technical Operator

**Context**

- Owns and operates one personal brand: `null`.
- Publishes content across multiple platforms.
- Understands software systems and is comfortable with technical detail.
- Wants a single daily workspace for reviewing account and content performance.
- Prefers a detailed analytical interface over a simplified consumer-style summary.
- Values accuracy, metric provenance, and the ability to inspect the underlying numbers.
- Does not want to repeatedly configure complicated filters or navigate unrelated tools.

**Primary needs**

1. Open the application and immediately understand overall social performance.
2. Identify which platforms changed since the last review.
3. Inspect an individual post/video and understand its performance curve.
4. Compare today's/this week's content against previous periods.
5. Understand audience growth and content distribution where providers make the data available.
6. Find out when data was last collected and whether a platform sync failed.
7. Ask focused analytical questions and receive evidence-based answers.
8. Change the dashboard layout and hide optional modules without losing data.

**Interaction preferences**

- Detailed metrics and drill-downs are preferred over vague summaries.
- High information density is welcome, but alignment, typography, spacing, and hierarchy must remain clear.
- Use charts with selectable metrics, date ranges, daily/cumulative views, and platform filters.
- Do not hide important data behind excessive dialogs or nested menus.
- Avoid unnecessary onboarding steps after the initial account connection.
- Show precise reasons when a metric is unavailable.
- Never ask the user to repeat information already stored in the application.
- Avoid generic advice. Recommendations must be connected to actual content and observed data.
- The system should not require the user to understand API technicalities to use the Dashboard.

**Daily usage pattern**

1. Open Overview.
2. Review platform/account health and high-level changes.
3. Inspect the performance trend for the selected period.
4. Open the Content Library and identify top/weak posts.
5. Drill into one or more posts to inspect detailed metrics and their historical changes.
6. Review audience and platform comparisons when data is available.
7. Check Sync Center only when an account has stale data or a failed run.
8. Review evidence-based insights and decide what content to publish or improve next.

---

## 6. Product Information Architecture

The navigation must contain only Social Monitor features.

### Primary navigation

1. **Overview** — `/overview`
2. **Content Library** — `/content`
3. **Analytics** — `/analytics`
4. **Audience** — `/audience`
5. **Compare** — `/compare`
6. **Accounts** — `/accounts`
7. **Sync Center** — `/sync`
8. **AI Analyst** — `/analyst` (optional module; may be disabled until configured)
9. **Settings** — `/settings`

Platform-specific pages should be reached through the platform selector, platform cards, or Accounts page rather than creating six duplicate sidebar groups.

### Sidebar behavior

- Slim icon rail inspired by the reference image.
- Expand/collapse navigation labels.
- Clear active navigation state.
- Tooltips on collapsed icons.
- No decorative menu items that do nothing.
- No unrelated sections.
- On mobile/tablet, collapse into a drawer or compact navigation.

### Top navigation

- Global content search.
- Date-range selector.
- Platform selector (`All platforms` or a specific platform).
- Account selector (if more than one account exists on a platform).
- Last data update indicator.
- Manual refresh / sync action, disabled when no connected source is available.
- User/profile menu.

All filters must be stateful and apply consistently to the pages where they are relevant.

---

## 7. Visual Design Direction

### 7.1 Reference interpretation

Use the uploaded screenshot as the primary visual reference for layout density and hierarchy. Reproduce its design principles, not its exact branding or data:

- Dark near-black canvas.
- Subtle panel boundaries and restrained contrast.
- Compact but readable metric cards.
- A narrow vertical sidebar.
- A top bar with search and account/platform selection.
- Large analytical panels in the main column.
- Smaller breakdown panels in a right-side column.
- Detailed trend charts near the lower half.
- Small insight/assistant panel, not a dominant chatbot.
- Fine-grained labels and contextual information icons.

### 7.2 Visual system

Suggested tokens (adapt to existing design tokens if they are already good):

- Main background: `#0C0D0F` or similar.
- Panel background: `#131517`.
- Elevated panel: `#191C1F`.
- Border: `#282C30`.
- Primary text: `#F2F4F5`.
- Secondary text: `#9BA2A9`.
- Muted text: `#6F777F`.
- Accent: restrained blue or teal for selected states and data emphasis.
- Green: successful sync / positive movement only.
- Amber: stale data / warning / pending connection.
- Red: genuine errors only.

Avoid neon cyberpunk styling, excessive gradients, large empty cards, heavy shadows, excessive rounded pills, or oversized typography.

### 7.3 Density and responsiveness

- Desktop-first analytics layout; support at least 1280px width gracefully.
- Tablet: two-column or adaptive layout.
- Mobile: stack cards and panels; tables become compact cards or horizontally scrollable where appropriate.
- Use tabular numerals for counts and percentages.
- Chart labels and legends must remain readable.
- Use consistent spacing, panel heights, and alignment.
- Provide loading skeletons, empty states, and error states.

### 7.4 Component quality

Build reusable components:

- `MetricCard`
- `MetricDefinitionTooltip`
- `DateRangeFilter`
- `PlatformSelector`
- `AccountSelector`
- `TrendChart`
- `BreakdownChart`
- `AudienceMap`
- `ContentTypeBreakdown`
- `ContentTable`
- `ContentPreviewCard`
- `PlatformStatusBadge`
- `SyncStatusPanel`
- `DataFreshnessLabel`
- `EmptyState`
- `UnavailableMetricState`
- `InsightCard`

Do not create one-off inconsistent components for each platform.

---

## 8. Main Screens and Detailed Requirements

## 8.1 Overview Dashboard — P0

This is the default landing screen and the most important page.

### Header

- Title: `Overview`
- Subtitle: concise summary of the selected date range.
- Date range: Today, 7 days, 28 days, 90 days, custom range.
- Platform filter: All / YouTube / TikTok / Instagram / Facebook / X / LinkedIn.
- Account selector when multiple accounts are connected.
- Data freshness indicator.

### KPI row

Show 4–6 compact cards depending on selected platform and data availability.

Recommended metrics:

- Reported Views
- Reach (when available)
- Impressions (when available)
- Content Interactions
- Followers / Subscribers
- Published Posts
- Profile Activity (when available)

Each metric card must include:

- Metric name.
- Current value.
- Change versus previous equivalent period, if both periods exist.
- Small trend indicator or sparkline when historical observations exist.
- Tooltip explaining the metric definition, source, and platforms included.

**Cross-platform aggregation rules:**

- Never imply that total followers across platforms are unique people. Label as `Combined account followers/subscribers` or show a per-platform breakdown.
- If showing combined platform-reported views, label them as a sum of platform-reported counters, not deduplicated unique views.
- Never calculate a universal cross-platform Engagement Rate using an arbitrary denominator.
- Do not sum Reach across platforms and describe it as unique reach.
- If semantics differ, show separate platform values instead of forcing one combined KPI.

### Main analytical area

Create a two-column layout similar to the reference.

**Main column:**

1. Audience Geography panel (only when real country/region breakdowns exist).
2. Primary performance trend panel.
3. Reach / Views / Impressions breakdown with metric selector.
4. Daily / Cumulative switch where mathematically supported.
5. Top-performing content section.

**Right column:**

1. Content Type Breakdown (Reels, Video, Story, Image, Carousel, Text, Article, etc. where source metadata supports it).
2. Profile Activity (profile visits, link clicks, follows, or equivalent available platform metrics).
3. Audience segments such as followers/non-followers only when the source exposes the breakdown.
4. Compact Insight cards.
5. Data freshness / sync status summary.

### Overview interactions

- Clicking a KPI opens the corresponding Analytics view with the metric preselected.
- Clicking a platform section filters the dashboard to that platform.
- Clicking a content item opens Content Detail.
- Clicking a stale/failed status opens Sync Center with the relevant account selected.
- Changing the date range refreshes all applicable widgets consistently.

## 8.2 Platform Analytics — P0

Each of the six platforms must have a platform-specific analytics view using the same layout system but only the metrics supported by that platform.

Platform pages must include:

- Account header and connection state.
- Platform-specific KPI cards.
- Trend charts for available metrics.
- Content performance table.
- Best-performing content.
- Follower/subscriber growth when available.
- Audience breakdowns when available.
- Last successful collection time.
- Metric availability explanations.

Do not render unsupported widgets as empty charts with fake zeroes. Show a helpful unavailable state that names the missing permission, account type, API access, or source-data requirement when known.

## 8.3 Content Library — P0

Central inventory of owned posts/videos across platforms.

### Table/list fields

- Platform icon/name.
- Thumbnail/preview when available.
- Caption/title or truncated text.
- Content type.
- Published date/time.
- Views / plays where available.
- Reach / impressions where available.
- Likes/reactions.
- Comments.
- Shares/reposts.
- Saves where available.
- Last metrics update.
- Data source indicator (API / CSV / Demo).

### Filters

- Platform.
- Account.
- Date published.
- Content type.
- Metric availability.
- Top / low performance.
- Search text.

### Sorting

- Most recent.
- Most views (within selected platform or compatible metric family).
- Highest interactions.
- Highest reach (within comparable platform scope).
- Highest engagement rate only when the platform-specific formula is valid.

### Important

Cross-platform ranking must not silently rank unlike metrics. If the owner selects `Views`, label the ranking `Platform-reported views` and show the source platform. Offer platform-only ranking by default.

## 8.4 Content Detail — P0

Opening a post/video displays a detailed analysis page or side panel.

### Header

- Platform.
- Thumbnail/video preview if available.
- Title/caption.
- Published timestamp.
- Permalink to original content.
- Content type.
- Account.

### Performance summary

Show all metrics returned for this specific content item, with definitions and timestamps.

### Historical performance

- Metric timeline from collected snapshots.
- Views/reach/interactions over time where snapshots exist.
- Milestone markers (e.g. 24h, 72h, 7d, 28d) only when actual observations support them.
- Current cumulative value and last collected time.
- Period deltas between snapshots.

### Content analysis

- Compare this post to the account's recent posts of the same platform/content type.
- Show median/average baseline and sample size.
- Explain the comparison window.
- Avoid unsupported causal claims.

## 8.5 Audience Analytics — P1, but include layout/navigation in MVP

A dedicated audience section for data the official sources actually provide.

Potential panels:

- Audience geography / countries.
- Age/gender breakdown, when available and permitted.
- Follower versus non-follower distribution, where supported.
- Follower/subscriber growth over time.
- Active audience time, only if provider exposes it.
- Audience engagement trends.

Every audience panel must show:

- Platform source.
- Time period.
- Sample/eligibility notes if provided.
- Last update.

If data is unavailable, show `Not available from this connection` or the actual reason. Do not infer audience location from the user's own location or from a post's language.

## 8.6 Cross-Platform Comparison — P1, but include a basic version in MVP

The owner must be able to compare platform performance over the same date range.

Comparison options:

- Follower/subscriber growth.
- Published content volume.
- Platform-reported views/plays.
- Platform-reported interactions.
- Reach/impressions as separate metric families.
- Average performance per post within each platform.

Rules:

- Keep the source metric and definition visible.
- Show each platform's own value.
- Use normalized indexes only if the formula is explicitly described and the owner can inspect the baseline.
- Do not fabricate a cross-platform engagement rate.
- Explain when a platform has no compatible data.

## 8.7 Accounts & Connections — P0

Manage the six platform accounts.

Each account card must show:

- Platform.
- Account handle/name.
- Account type (e.g. YouTube channel, TikTok personal creator account, Instagram Creator/Business, Facebook Page, X account, LinkedIn member profile).
- Connection state.
- Granted capabilities/scopes when available.
- Last successful sync.
- Next scheduled sync (if configured).
- Last error if any.
- Connect / Reauthorize / Disconnect action, depending on actual implementation readiness.

Connection states:

- `NOT_CONNECTED`
- `PENDING_ACCOUNT_SETUP`
- `PENDING_APP_REVIEW`
- `CONNECTED`
- `PARTIAL_ACCESS`
- `REAUTH_REQUIRED`
- `PERMISSION_MISSING`
- `RATE_LIMITED`
- `ERROR`
- `DISCONNECTED`

Do not display `CONNECTED` unless a real OAuth connection and an authenticated provider request have succeeded.

## 8.8 Sync Center — P0

This is the operational status page for the n8n system.

Show:

- Overall automation status.
- Each platform connector state.
- Last run / last successful run.
- Run duration.
- Records fetched / normalized / validated / rejected / duplicates.
- Delivery state (Dry Run / Not Configured / Delivered / Failed).
- Recent Sync Runs table.
- Expandable per-platform execution details.
- Error messages with actionable remediation.
- Manual sync action only when the relevant connection and trigger are truly configured.

Never label a Dry Run as a successful delivery or a persisted sync.

## 8.9 AI Analyst — Optional P1

The AI Analyst is a Social Media Analytics assistant, not a general chatbot.

It should answer questions such as:

- Which platform grew the most over the last 28 days?
- Which recent videos are outperforming my account baseline?
- Did my views increase while engagement weakened?
- Which content types performed best during the selected period?
- Which posts lost momentum after the first 72 hours?
- What changed compared with the previous period?

### Evidence-first answer format

Every answer must include:

1. Direct conclusion.
2. Exact date range.
3. Platforms/accounts included.
4. Metrics used and their definitions.
5. Relevant values and comparison baseline.
6. Data freshness caveat.
7. Evidence links to posts or charts where available.
8. A clear statement when the data is insufficient.

### Anti-hallucination rules

- The assistant may only use data returned by the application's analytics services.
- It must not invent metrics, platform features, audience properties, or causal explanations.
- It must distinguish correlation from causation.
- It must say `Insufficient data` when the required observations do not exist.
- It must not infer missing metrics from other metrics.
- It must never convert `null` to zero.
- It must not recommend publishing actions based on unsupported assumptions.
- Do not send provider credentials, tokens, or unnecessary personal data to the LLM.

For the same-day MVP, implement evidence-based rule-driven Insight Cards first. The conversational LLM interface may be hidden/disabled until a provider is configured and enough real data exists.

## 8.10 Settings & Module Customization — P0

Only Social Monitor modules appear here.

### Optional modules that can be toggled

- `content_library`
- `analytics`
- `audience_insights`
- `cross_platform_comparison`
- `ai_analyst`
- `sync_center`

Core functions that cannot be disabled:

- Accounts/connection records.
- Data ingestion.
- Metric storage.
- Authentication/security.
- Basic Overview.

Toggling a module must:

- Hide/show the corresponding navigation item and its route from normal navigation.
- Preserve all stored data.
- Never delete database records.
- Never disconnect a platform.
- Never stop collection unless the owner separately disables that connector.
- Not create an ugly or broken sidebar when multiple modules are disabled.

### Dashboard personalization

Allow the owner to:

- Show/hide optional dashboard widgets.
- Reorder widgets.
- Choose a default platform/account.
- Choose a default date range.
- Reset the dashboard layout.

Persist these preferences using the existing settings mechanism if it is suitable; otherwise use a small additive preference model. Do not create a complex drag-and-drop builder for the same-day MVP. Simple show/hide and preset layout are sufficient.

---

## 9. Analytics and Metric Semantics — Critical Requirement

The application must understand how each metric is collected, stored, transformed, and displayed. This is more important than visual polish.

### 9.1 Canonical metric record

Every observation should preserve, directly or through relations:

- Platform.
- Account ID.
- External content/post ID when applicable.
- Canonical metric key.
- Original platform metric key.
- Numeric/text value.
- Unit.
- Aggregation type.
- Period start.
- Period end.
- Collected timestamp.
- Provider/source update timestamp if available.
- Data origin (`API`, `CSV`, `MOCK`, `MANUAL`).
- Sync run/import job reference.
- Metric definition/source provenance.

A suggested logical contract (not a command to create duplicate models) is:

```ts
interface MetricObservationContract {
  platform: string;
  accountId: string;
  contentId?: string | null;
  metricKey: string;
  sourceMetricKey: string;
  value: number | string | null;
  unit: string | null;
  aggregation: 'SNAPSHOT' | 'DAILY' | 'PERIOD' | 'LIFETIME' | 'TOTAL';
  periodStart?: string | null;
  periodEnd?: string | null;
  collectedAt: string;
  sourceUpdatedAt?: string | null;
  source: 'API' | 'CSV' | 'MOCK' | 'MANUAL';
  syncRunId?: string | null;
}
```

This is a logical contract. Map it onto existing Prisma models first. Do not create a duplicate `MetricObservation` if the existing model already supports these semantics.

### 9.2 Metric rules

- Missing/unavailable data is `null`, not `0`.
- A legitimate numeric zero is `0`.
- `Views`, `Plays`, `Reach`, and `Impressions` are not interchangeable.
- `Likes`, `Reactions`, `Comments`, `Replies`, `Shares`, and `Reposts` may have platform-specific definitions. Preserve the original metric name.
- `Followers` and `Subscribers` are different concepts; do not merge their semantics silently.
- `Profile Visits`, `Link Clicks`, and `Content Clicks` are separate metrics.
- Daily values and lifetime values are different aggregation types.
- A cumulative counter snapshot is not the same as a daily delta.
- If daily delta is calculated from two cumulative snapshots, store it as a derived metric and retain the calculation provenance.
- Do not compare periods unless their date windows and timezone semantics are aligned.
- Store account timezone if available; otherwise label the timezone assumption.
- Preserve provider reporting delays and data freshness.

### 9.3 Engagement rate

Do not create one universal cross-platform engagement rate.

If a platform provides an authoritative engagement-rate metric, display it with its source definition.

If the application calculates a platform-specific engagement rate, expose:

- Formula.
- Numerator components.
- Denominator (reach, impressions, views, or followers).
- Platform.
- Date window.
- Sample count.

Never compare two engagement rates as equivalent unless the formula and denominator match.

### 9.4 Comparisons and baselines

For per-post performance comparisons, prefer:

- Same platform.
- Same content type.
- Similar age since publication (e.g. first 24h compared with first 24h).
- Same metric definition.
- Clearly declared sample size.

Do not compare a 30-day-old post's lifetime views with a 2-day-old post's lifetime views without a time-normalized comparison.

---

## 10. Platform Coverage and Data Availability

The UI must be based on real API and import capabilities, not imagined universal metrics.

| Platform | Initial ingestion path | Expected data categories | Important constraint |
|---|---|---|---|
| YouTube | YouTube Data API v3 + YouTube Analytics API | Channel/video metadata, views, likes, comments, watch time, average view duration, audience/date/country reports where supported | Owner-authorized Analytics API; valid metric/dimension/report combinations only. |
| TikTok | TikTok Display API | Profile info/stats and public video metadata/counters | Display API is not full Creator Studio analytics; do not promise retention or audience demographics from it. |
| Instagram | Instagram API with Instagram Login | Professional account metrics, media list, media insights, supported audience/account insights | Professional account and approved scopes; metric availability varies by media type and account eligibility. |
| Facebook | Pages API + Page Insights / relevant Video or Reels Insights | Page, post, video, and supported Page insights | Page access token, required permissions, Page task and metric eligibility. |
| X | CSV Import for $0 MVP | Whatever supported fields are actually present in the user's export | Do not assume every export includes post-level metrics or fixed headers. Official API can be a later paid option if approved. |
| LinkedIn | CSV Import initially; official member analytics only if access is approved | Post analytics and video analytics where API access is granted; otherwise export fields that are actually available | Community Management API access and member consent are required for official member post analytics. |

### Platform-specific truth rules

**YouTube**

- Use Data API for account/channel/video inventory and available public counters.
- Use Analytics API for owner-authorized reports.
- Only show metric combinations supported by the selected report.
- Keep `estimatedMinutesWatched` in minutes unless explicitly converted and relabeled.
- Do not rely on `search.list` to retrieve the owner's own uploads if a channel uploads-playlist route is available.

**TikTok**

- Display API exposes profile and public video information.
- Video fields such as `view_count`, `like_count`, `comment_count`, and `share_count` may be requested where supported.
- Account-level stats require the appropriate scope; `user.info.basic` alone is not enough for all account statistics.
- Do not display unsupported watch-time/retention demographics as if collected.

**Instagram**

- Use Instagram's current official Login/API route and current permission names.
- Use account-level and media-level Insights endpoints where supported.
- Metric lists and eligibility rules vary by version, media type, and account conditions.
- Do not copy deprecated metric lists from old templates.

**Facebook**

- Use Page Insights only for a Page the user owns/administers or can analyze.
- Check the current Graph API metric catalog and version before requesting any metric.
- Some Page Insights data is available only for eligible Pages; most Page metrics may refresh on a daily cadence.
- Do not assume Page Insights includes all Reel interactions.

**X**

- Use CSV import for the zero-budget first version.
- Build header mapping and file validation; never fabricate unavailable columns.
- Do not enable usage-based API reads without the owner's explicit budget approval.

**LinkedIn**

- Use CSV import by default while access is pending.
- Keep an optional official connector path for `memberCreatorPostAnalytics` only after Community Management API access and member consent are granted.
- The interface must show whether the metrics came from API or CSV.

---

## 11. Backend Integration Architecture

### 11.1 Required data flow

```text
Official Platform APIs / CSV Imports
                ↓
         n8n Central Orchestrator
                ↓
       Platform Connector Workers
                ↓
    Normalization → Validation → Dedup
                ↓
          n8n Delivery Adapter
                ↓ HTTPS (later secure tunnel)
        Existing NestJS Backend
                ↓
     Existing Prisma / PostgreSQL
                ↓
  Existing Analytics & Dashboard Services
                ↓
         React Social Monitor UI
```

### 11.2 Backend reuse strategy

Before writing code, inspect the existing Backend:

1. `apps/api` structure.
2. Module controllers and routes.
3. Prisma `schema.prisma` and migrations.
4. Existing `Platform` and `PlatformAccount` relations.
5. `IntegrationCredential` lifecycle and encryption usage.
6. `SyncRun` and `SyncError` fields and service methods.
7. `MetricDefinition`, `MetricObservation`, `MetricAggregate` fields and aggregation logic.
8. Existing dashboard/analytics endpoints.
9. Existing auth guards, service-to-service auth options, logging redaction, and audit logging.
10. Existing Docker Compose service names and internal ports.

Reuse exact existing routes and models when they already meet the contract.

If a required capability is missing, extend the existing NestJS modular monolith additively. Do not create a separate Backend or second database.

If a social content/post entity is missing, propose the smallest additive model needed to store platform content metadata and relate metric observations to the content item. Do not duplicate PlatformAccount or MetricObservation.

### 11.3 Backend API behavior

The UI should read from the existing Backend API through a typed API client.

Required capability groups (actual paths must be discovered first):

- Overview summary.
- Platform account list and connection status.
- Content inventory and filters.
- Content detail and metric history.
- Platform analytics time series.
- Audience breakdowns where available.
- Sync history and error details.
- Account connection/re-authorization status.
- Dashboard/module preferences.

For n8n ingestion, the Backend must expose or already contain an authenticated batch-ingestion capability.

Do not hardcode invented paths. If missing, define and implement minimal endpoints inside the existing NestJS modules after examining conventions.

### 11.4 Connection configuration

- Frontend local API base URL must be configurable through environment variables.
- Do not hardcode `localhost:3001` throughout components.
- Use the existing backend auth mechanism.
- Keep provider secrets encrypted using the existing `CryptoService` / `IntegrationCredential` implementation if it is the established source of truth.
- Do not duplicate OAuth tokens between Backend and n8n without an explicit credential ownership design.
- n8n-to-Backend connectivity will later use a secure HTTPS hostname and service-to-service authentication.
- Never expose PostgreSQL or Docker management ports publicly.

### 11.5 n8n Delivery Adapter

The UI must not call n8n directly for analytics data.

n8n collects and delivers data to the Backend; the UI reads the stored, validated records from the Backend.

The Delivery Adapter must preserve:

- `run_id`
- platform
- account external ID
- content external ID
- original metric names
- normalized metric keys
- units and aggregation type
- time window
- collected timestamp
- source provenance
- idempotency metadata

Do not mark a sync successful until the Backend confirms the batch was accepted/persisted.

Do not advance production sync checkpoints after failed Backend delivery.

---

## 12. Data States and Empty-State Behavior

The UI must handle these states consistently:

### Account states

- Not created.
- Account created but not linked to app.
- Developer app not configured.
- Permission pending.
- OAuth connected.
- Partially authorized.
- Reauthorization required.
- Disconnected.

### Data states

- No data collected yet.
- Demo data.
- Real API data.
- CSV-imported data.
- Stale data.
- Partially available metrics.
- Unsupported metric.
- Sync failed.
- Empty but successful response.

### Demo data restrictions

If demo data is used to demonstrate the UI:

- Mark every demo view with a visible `DEMO DATA` banner/badge.
- Keep demo data in frontend fixtures or a clearly isolated demo data source.
- Never write demo fixtures into production social-account or metric tables.
- Never show a fake `CONNECTED` status.
- Never show fake successful sync timestamps.
- Provide a clear switch to return to real/empty mode.

### Empty state examples

For an unconnected account:

`Connect your Instagram Creator account to start collecting account and content insights.`

For missing permissions:

`This metric is unavailable because the current connection does not have the required permission.`

For not-yet-collected history:

`Historical trend will appear after multiple successful metric collections.`

For unsupported metrics:

`This platform does not provide this metric through the currently configured data source.`

---

## 13. Interaction and UX Requirements

- Every filter must visibly affect the relevant content and charts.
- Every chart must have a metric title, unit, date range, and tooltip.
- Hover tooltips must show exact values and dates.
- Daily/cumulative switching must work only where the data supports it.
- Tables must support sorting and pagination or incremental loading.
- Search must search content metadata, not only visible labels.
- Loading states must not shift the layout unnecessarily.
- Empty, error, and stale states must be designed, not left blank.
- Use confirmations only for destructive account actions.
- Module toggle controls must not delete data.
- Dashboard widget customization must persist across reloads using the existing preference mechanism where available.
- Do not add fake controls that look interactive but do nothing.

---

## 14. Same-Day MVP Scope and Delivery Plan

The delivery target is one focused working day. Prioritize a complete, coherent, usable monitoring experience over broad unfinished functionality.

### P0 — Must be delivered today

1. Repository/backend reconnaissance.
2. Social Monitor-only application shell and navigation.
3. Dark analytics visual system based on the uploaded reference.
4. Overview dashboard with real-data/empty/demo states.
5. Platform selector and date-range filters.
6. Six platform account cards with accurate readiness states.
7. Content Library with search and basic filters.
8. Content Detail view with metric history support.
9. Platform Analytics page with trend charts and breakdowns.
10. Sync Center showing actual current workflow/backend sync status where available.
11. Social-only module toggles and basic dashboard widget visibility.
12. Typed API client wired to verified existing Backend routes.
13. Add only essential missing Backend capabilities if required and feasible within the day.
14. Responsive behavior for desktop and tablet.
15. Build/type-check/smoke tests.

### P1 — Only if P0 is complete

- Audience geography map.
- Audience demographic breakdowns.
- Cross-platform comparison enhancements.
- Rule-based Insight Cards.
- CSV upload interface if the existing Backend supports secure file upload.
- Export analytics to CSV.

### P2 — Explicitly later

- Conversational AI Analyst with LLM provider.
- Advanced custom report builder.
- Scheduled PDF/email reports.
- Advanced attribution and campaign analytics.
- Real-time webhooks.
- Content publishing/scheduling.
- Paid X API integration.
- Advanced audience segmentation not exposed by official sources.

### Time-box guidance

Use a hard one-day time box. A reasonable execution split is:

- 30–45 min: inspect repository, routes, schema, and current design system.
- 45–60 min: establish Social Monitor shell and visual tokens.
- 60–90 min: Overview dashboard and reusable analytics components.
- 60–75 min: Content Library and Content Detail.
- 45–60 min: Platform Analytics, Accounts, and Sync Center.
- 45–60 min: Backend API integration and empty/demo states.
- 30–45 min: module/widget settings, tests, build, and final smoke check.

If the real Backend routes do not yet support social analytics, do not spend the whole day inventing new backend architecture. Implement the frontend data adapter and the smallest additive API/model work necessary. Clearly label any unfinished live data path.

---

## 15. Engineering Quality Requirements

### 15.1 Repository reconnaissance before coding

The coding agent must first inspect:

- `package.json` files and scripts.
- Existing frontend route structure.
- Current layout/components/design tokens.
- Current state management and data fetching patterns.
- Existing API client and auth handling.
- Backend controllers, DTOs, services, Prisma models, and migrations.
- Docker Compose configuration.

Produce a short internal implementation map and then proceed. Do not spend excessive time generating a long speculative plan.

### 15.2 Reuse existing code

- Reuse good existing components and Backend services.
- Replace only the bad Social Monitor UI surfaces.
- Do not rewrite unrelated Chronos or other modules.
- Do not rename global models/routes without a demonstrated need.
- Do not add a second UI framework or state management system.
- Do not add dependencies unless an actual feature needs them.

### 15.3 Data correctness

- Define TypeScript types for API responses and metric observations.
- Validate API responses at the boundary.
- Handle `null`, missing, and zero distinctly.
- Preserve platform/source provenance.
- Do not calculate unsupported metrics.
- Do not use fixture numbers in real mode.
- Avoid `any` in core metric and account data paths.

### 15.4 Maintainability

- Feature-based frontend organization.
- Shared chart and metric components.
- Platform-specific metric configuration, not scattered `if/else` checks throughout the UI.
- Typed API client with centralized base URL and error handling.
- Clear loading/error/empty states.
- No duplicated data-fetching logic across six platform screens.

### 15.5 Testing

At minimum:

- TypeScript/build passes.
- Routes render.
- Overview handles empty data.
- Overview handles demo data with a visible DEMO marker.
- Platform selector changes the displayed data.
- Date filter changes the data range.
- Content search/filter works.
- Content Detail displays source metrics and timestamps.
- Missing metrics render as unavailable, not zero.
- Module toggles hide/show the correct navigation areas and preserve stored data.
- Backend unavailable state is handled without crashing the UI.
- No unrelated feature routes appear in the Social Monitor navigation.

### 15.6 Browser verification

Open the running application and verify:

- No console errors.
- No broken routes.
- No horizontal overflow at desktop size.
- Charts render and respond to filters.
- Dark theme is consistent.
- Empty/demo/connected states are distinguishable.
- All visible buttons and controls have working behavior.

---

## 16. AI Coding-Agent Behavior Contract — Mandatory

The coding model must behave like a careful senior engineer working in an existing production repository, not like a greenfield code generator.

### Before implementation

1. Inspect the repository and current runtime.
2. Read the existing backend schema and routes.
3. Identify reusable modules and existing working logic.
4. Confirm what is real, missing, mocked, or pending.
5. Do not infer that a route/model exists from its name alone.

### During implementation

1. Work in small vertical slices.
2. Keep the app runnable after each slice.
3. Prefer targeted edits over full-file rewrites.
4. Preserve working behavior outside Social Monitor.
5. Do not create fake endpoints.
6. Do not fabricate account data, analytics, connection status, or sync timestamps.
7. Do not silently alter database semantics.
8. Do not add features outside this PRD.
9. Do not claim something is implemented until it has been exercised.
10. If blocked by unavailable credentials, approval, route, or data, build the correct empty/disabled state and document the blocker.

### Data understanding requirement

Before building a chart or KPI, the coding model must know:

- Which Backend endpoint or data model supplies it.
- Which platform it belongs to.
- The original source metric name.
- The meaning/unit of the metric.
- Whether it is a snapshot, daily value, period aggregate, or lifetime total.
- The collection timestamp and reporting window.
- Whether it can be compared or aggregated across platforms.

If any of these are unknown, do not invent them. Display the metric only with an explicit source/availability caveat, or omit it until verified.

### AI-generated insights requirement

Any AI-generated insight must be traceable to the underlying stored observations. The model must provide the metric, values, date range, account/platform scope, and comparison baseline used. No causal claims without supporting evidence.

### Communication and reporting

The agent should:

- Report what it inspected.
- Report the files/components/routes it changed.
- Report migrations and API changes, if any.
- Report tests actually executed and their results.
- Identify unimplemented/pending items honestly.
- Avoid long progress narration.
- Not ask the owner to repeat repository details already available.

---

## 17. Definition of Done

The same-day MVP is done when:

### Product/UI

- [ ] The product is exclusively NULL Social Monitor.
- [ ] The UI follows the uploaded analytics dashboard reference in structure and density.
- [ ] Overview dashboard is detailed and usable.
- [ ] Platform selector and date filtering work.
- [ ] Content Library works with search and filters.
- [ ] Content Detail shows available metrics and history.
- [ ] Platform Analytics works with source-specific metric sets.
- [ ] Accounts page shows honest connection states for all six platforms.
- [ ] Sync Center displays actual sync information where available.
- [ ] Social-only module toggles and dashboard widget preferences work.
- [ ] Empty and demo data states are clearly distinguished.
- [ ] No unrelated productivity/project/engineering modules are surfaced.

### Data and Backend

- [ ] Existing Backend and database are reused.
- [ ] Actual routes and Prisma models were inspected.
- [ ] UI uses verified Backend endpoints.
- [ ] Missing essential capabilities are implemented additively or explicitly documented.
- [ ] No duplicate Backend, database, or platform/account model was created.
- [ ] Metric provenance and semantics are preserved.
- [ ] No mock values are written as real social analytics.

### Quality

- [ ] Build passes.
- [ ] Type checks pass.
- [ ] Essential tests pass.
- [ ] Browser smoke test passes.
- [ ] No credentials or secrets are exposed.
- [ ] No unrelated application functionality was damaged.
- [ ] The final report lists actual implemented features and remaining blockers.

### Explicitly not required for today's UI MVP

- Live API connections for all six platforms.
- Platform OAuth approvals.
- Production n8n activation.
- Public tunnel setup.
- LLM-powered AI Analyst.

These are separate integration steps because account setup and credentials are not yet complete.

---

## 18. Final Implementation Instruction

Build NULL Social Monitor as a focused, detailed, professional social media analytics product using the uploaded screenshot as the visual direction.

The owner wants detailed information, strong analytical depth, and a UI that is comfortable to use every day. Do not simplify it into a generic dashboard with four cards and one chart. Equally, do not overwhelm it with unrelated features or random widgets.

Make the dashboard information-rich, structured, and drillable. Prioritize the Overview, platform analytics, Content Library, and Content Detail. Build the data layer around the actual Backend's existing models and the n8n canonical ingestion contract. Preserve the separation between collected data, normalized metrics, historical observations, and displayed aggregates.

The result must be a Social Media Monitoring application for the six agreed platforms only.

Finish the P0 scope within the one-day time box. If account access, live credentials, external approvals, or a secure n8n-to-local-Backend tunnel are missing, do not fake them. Build the correct integration-ready states and continue with the UI and verified local Backend capabilities.

Do not turn this into a multi-week redesign. Do not invent features. Do not fabricate data. Do not replace the existing Backend. Inspect first, reuse what exists, build only what is necessary, test it, and report honestly.

---

## 19. Official Platform and Technical References

Re-check these references during implementation because metric catalogs, API versions, permissions, and access policies can change.

### YouTube

- [YouTube Data API Overview](https://developers.google.com/youtube/data/getting-started)
- [YouTube Data API Quota](https://developers.google.com/youtube/data/determine_quota_cost)
- [YouTube Analytics API Reference](https://developers.google.com/youtube/analytics/reference/)
- [YouTube Analytics Reports Query](https://developers.google.com/youtube/analytics/reference/reports/query)
- [YouTube Analytics Channel Reports](https://developers.google.com/youtube/analytics/channel_reports)
- [YouTube Analytics Metrics](https://developers.google.com/youtube/analytics/metrics)

### TikTok

- [Display API Overview](https://developers.tiktok.com/docs/en/display-api-overview)
- [Display API Scopes](https://developers.tiktok.com/docs/en/tiktok-api-scopes)
- [Video Object](https://developers.tiktok.com/docs/en/tiktok-api-v2-video-object)
- [List Videos](https://developers.tiktok.com/docs/en/tiktok-api-v1-video-list)

### Instagram and Facebook

- [Meta Insights API Overview](https://developers.facebook.com/docs/insights/overview)
- [Instagram Account Insights](https://developers.facebook.com/docs/graph-api/reference/ig-user/insights/)
- [Meta Insights API Guides](https://developers.facebook.com/docs/insights/guides)
- [Facebook Page Insights](https://developers.facebook.com/docs/graph-api/reference/insights/)
- [Meta Insights API Getting Started](https://developers.facebook.com/docs/insights/get-started)

### LinkedIn

- [LinkedIn Recent Marketing API Changes](https://learn.microsoft.com/en-us/linkedin/marketing/integrations/recent-changes)
- [LinkedIn Member Post Statistics](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/members/post-statistics)
- [LinkedIn Member Video Statistics](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/members/video-statistics)
- [LinkedIn Increasing Access](https://learn.microsoft.com/en-us/linkedin/marketing/increasing-access)

### X

- [X API Documentation](https://docs.x.com/)
- [X Developer Platform Overview](https://docs.x.com/overview)

### n8n

- [n8n HTTP Request Pagination](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)
- [n8n Sub-workflows](https://docs.n8n.io/flow-logic/subworkflows/)

---

**End of PRD — NULL Social Monitor v1.0**
