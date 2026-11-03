# Chapter 10: Discovery, Communication and the System Lifecycle

**Summary**: *Domain 6 tests whether you can turn a vague request into testable requirements, explain a trade-off to people who will judge it by different standards, promise only what the platform supports, and hand over a system that keeps working after models and API versions change. The right answer is usually the one tied to a measurable criterion or a documented platform behavior. The wrong one is usually a reassurance.*

Much of this domain is practice rather than product. Sections that come from established engineering practice instead of Anthropic's pages are marked. The Claude-specific parts are few but heavily tested: success criteria, rate limits, service tiers, model deprecation and versioning. Learn those exactly.

## Discovery is finished when every requirement has a number and a way to measure it

### The decision

Discovery decides three things: whether Claude belongs in the solution at all, what "working" means, and which constraints rule out designs before anyone builds one. Domain 1 covers the architecture that follows (see [Chapter 1](/ccar-p/read/pro-notes/01-from-business-problem-to-architecture)). Here the question is what you have to learn before you design anything.

Anthropic's guidance starts from **success criteria**. They should be **specific, measurable, achievable and relevant**. Most use cases need several of them at once, not one.<sup>[1]</sup> The page's own contrast is the one to remember. "Safe outputs" is a bad criterion. "Fewer than 0.1% of outputs out of 10,000 trials flagged for toxicity by the content filter" is a good one.<sup>[1]</sup> A good criterion names a metric, a threshold, a test set and a baseline. "Achievable" means the target comes from benchmarks, earlier experiments or expert knowledge, not hope.<sup>[1]</sup>

The page lists dimensions worth checking for every use case: task fidelity (including edge cases), consistency, relevance and coherence, tone and style, privacy preservation, context utilization, latency and price.<sup>[1]</sup> Treat the list as a discovery checklist. A dimension nobody asked about is one that nobody will measure.

### What to ask, and what each answer decides

The ticket-routing guide shows what discovery looks like in practice. Before you automate, learn how people do the work today. Which criteria set the SLA a ticket gets? Which automated rules already exist, and where do they fail? How are ambiguous cases handled, and how is work prioritized?<sup>[3]</sup> The same guide lists signals that favor an LLM over a traditional classifier: little labeled data, categories that keep changing, unstructured input, rules based on meaning, a need for readable reasoning, and multilingual traffic.<sup>[3]</sup>

| Discovery question | What the answer decides |
|---|---|
| How is this done today, and where does it fail? | The baseline your criteria are measured against, and the first eval cases |
| What does a wrong answer cost, and to whom? | Human review points, how errors are graded by severity, guardrails ([Chapter 9](/ccar-p/read/pro-notes/09-governance-safety-and-risk)) |
| How fast must it respond, and does anyone wait? | Real-time call versus batch processing, model tier, streaming |
| What is the peak volume, and how bursty is it? | Rate-limit planning, queueing, workspace limits |
| What data flows in, and where may it be processed? | Data residency (`inference_geo`), retention posture, which provider to deploy on |
| Who owns the system after launch? | Build path (Messages API, Agent SDK or Managed Agents) and the handoff package |

The build-path row has a documented basis. The Messages API gives you the most control, because you write the loop and run the tools. The Agent SDK gives you the loop and tool execution in a process you operate. Managed Agents hosts the loop, the tools and the runtime for you.<sup>[2]</sup> The less operations capacity the receiving team has, the stronger the case for handing more of the system to Anthropic. Make that choice during discovery, not after handoff.

### A good answer versus a tempting weak one

- **Weak:** "Run stakeholder workshops to gather requirements, then build a prototype." This describes activity and produces nothing testable.
- **Strong:** "Measure the current process to get a baseline. Write criteria with thresholds across accuracy, latency, cost and safety. Build a test set that includes edge cases. Agree on what counts as a severe error versus an inconvenience." The develop-tests page points out that even the line between an "inconvenience" and an "egregious" error has to be defined.<sup>[1]</sup>

### Reading the evidence

| Symptom after launch | Discovery gap behind it |
|---|---|
| Stakeholders argue about whether the system "works" | No agreed metric or threshold |
| Accuracy looks fine overall, but one customer segment complains | Criteria never set per segment (the routing guide sets bias targets across customer groups)<sup>[3]</sup> |
| Latency complaints on a workflow nobody waits on | The real-time requirement was assumed. Batch was never considered |
| Legal blocks launch late | Residency and retention were never raised in discovery |

## A trade-off is explained as the decision, the alternatives and the cost of being wrong, in each audience's terms

*General practice, not from Anthropic documentation.*

### The decision

The architecture stays the same whoever is listening. What changes is what each audience needs to see to agree with it. A good exam answer gives each audience the evidence it can act on. A weak answer gives everyone the same deck, or tells executives that "the AI is accurate."

| Audience | What they need | Artifact that works | Tempting weak version |
|---|---|---|---|
| Engineering | Interfaces, failure modes, retry and fallback behavior, eval thresholds, who owns what | Design doc, ADRs, runbook | Feature list with no failure handling |
| Security | Every capability and credential the system holds, and why each must exist | Threat model, tool and permission inventory, data-flow diagram | "We log everything" (logging is a compensating control, not removal) |
| Legal and compliance | Where data is processed, how long it is kept, who can retrieve it, what the platform documents | Data-flow map with documented platform facts and citations | A claim of compliance with no source |
| Executives | Outcome against baseline, cost per unit of work, residual risk, the decision needed from them | One page: metric, cost, risk, ask | Model benchmark scores |
| Operations | What to watch, alert thresholds, what to do on each error class | Dashboards and runbook | "Monitor the system" |

For legal audiences, give only facts the platform documents, and cite them. Two examples follow. The Messages API takes an `inference_geo` parameter. The default, `"global"`, lets inference run in any available geography. `"us"` pins it to the US.<sup>[12]</sup> US-only inference on Claude 4.6 and later models is priced at 1.1x.<sup>[6]</sup> For Claude Enterprise, the Compliance API gives security, legal and compliance teams programmatic access to activity records and, with the right key, to chat, file, project and session content.<sup>[11]</sup> Do not tell legal that a configuration "makes you compliant." Tell them what it does, and let them decide.

### Architecture decision records capture the reasons, not just the result

An ADR is a short, versioned record of one decision. A useful one has these parts:

1. **Context**: the constraint that forced a choice, with numbers (for example, "p95 latency must stay under 2 s for agents on live calls").
2. **Decision**: what was chosen, stated in one sentence.
3. **Alternatives considered**: each with the reason it lost.
4. **Consequences**: what gets worse, and what now needs watching.
5. **Revisit trigger**: the event that reopens the decision, such as a model deprecation notice, a cost threshold, or eval scores below a set floor.

The revisit trigger is what separates an ADR from a meeting note. Model retirements are scheduled events (see the lifecycle section below), so any decision that depends on a specific model ID should name the deprecation notice as its trigger.

## Expectations must match what the platform actually promises

### The decision

You will be asked to commit to availability, throughput and response time. Your commitment can't be stronger than what the layer underneath it provides, unless your own design adds the missing strength. Know exactly what the Claude API documents.

**Rate limits are ceilings, not reservations.** Limits are set per organization and per usage tier. The page states that they are "maximum allowed usage, not guaranteed minimums."<sup>[4]</sup> The API uses a token bucket, so capacity refills continuously. A per-minute limit may be enforced over shorter intervals, so a short burst can trigger errors even when the minute's total is within the limit.<sup>[4]</sup> A sharp rise in usage can also hit **acceleration limits**, and the documented remedy is to ramp traffic up gradually.<sup>[4]</sup>

**Priority Tier is legacy.** The service-tiers page marks service tiers as legacy and says Priority Tier commitments are no longer sold. Organizations with an existing commitment keep it until their contract ends. Anyone else who needs guaranteed capacity is told to contact sales.<sup>[6]</sup> For existing commitments, Priority Tier targets 99.5% uptime, and traffic beyond the committed capacity falls back to standard.<sup>[6]</sup> An answer that tells you to "buy Priority Tier" for a new system is out of date.

**Batch trades latency for cost.** The Message Batches API charges 50% of standard prices. Most batches finish within an hour, but results are guaranteed only within 24 hours, and a batch that hasn't finished by then expires.<sup>[7]</sup> Never promise an interactive SLA on top of batch processing.

**Caching raises effective throughput.** For most models, only uncached input tokens and cache writes count toward the input-tokens-per-minute (ITPM) limit. Cache reads do not.<sup>[4]</sup> A design with a high cache hit rate can therefore sustain far more total input than its ITPM limit suggests ([Chapter 4](/ccar-p/read/pro-notes/04-context-tokens-and-reuse)).

**Workspaces isolate tenants and teams.** You can set lower rate and spend limits on individual workspaces, so one team's load can't starve another's. Organization-wide limits still apply even if workspace limits add up to more than the organization's.<sup>[4]</sup>

### Options ranked by constraint

| When this dominates | What to promise and build | What not to promise |
|---|---|---|
| Availability for an interactive product | An SLO that includes your own retries with backoff, honoring `retry-after`, plus graceful degradation | An SLO equal to an upstream uptime figure you don't hold |
| Throughput at peak | Measured peak tokens per minute, caching, a ramp plan, a request for a tier increase made before launch | "Rate limits are effectively unlimited" |
| Cost for work nobody waits on | Batch at 50% off with a delivery window of up to 24 hours | Same-hour delivery on batch |
| Isolation across business units | A workspace per unit, each with its own limits | One shared key and a promise to "monitor fairness" |
| Guaranteed capacity | A conversation with Anthropic sales, recorded as an open dependency | A new Priority Tier commitment |

### Feedback loops

*General practice, not from Anthropic documentation.*

A feedback loop closes only when a complaint becomes a test case. Route user reports, reviewer overrides and escalations into a triage queue. Label each as a prompt, retrieval, tool or model problem ([Chapter 8](/ccar-p/read/pro-notes/08-evaluation-testing-and-optimization)). Add confirmed failures to the eval set before you fix them. Report to stakeholders against the success criteria agreed in discovery, not against anecdotes. Ending the loop at "we acknowledged the feedback" is the weak answer.

### Reading the evidence

| Symptom | Likely cause |
|---|---|
| 429 with a `retry-after` header during bursts | A rate limit, possibly enforced over a sub-minute interval. Smooth the traffic and honor the header<sup>[4]</sup> |
| 429 with no `retry-after` and `error_code: enforced_spend_limit_reached` | The tier's monthly spend cap. Retrying fails until access resumes or the tier rises<sup>[4]</sup> |
| 400 `invalid_request_error` saying "You have reached your specified API usage limits" | A spend limit **you** set. Raise or remove it<sup>[4]</sup> |
| 529 `overloaded_error` across many customers at once | API-wide high traffic, not your quota<sup>[5]</sup> |
| 429s right after a sudden traffic jump, while still within the limits | Acceleration limits. Ramp up gradually<sup>[5]</sup> |
| Small behavior change on an unchanged model ID | Most likely a change to the serving infrastructure, since weights are fixed per ID. First check whether your prompt, data or parameters changed<sup>[9]</sup> |

The SDKs retry transient failures (connection errors, rate limits, 5xx) twice by default with exponential backoff and honor `retry-after`.<sup>[5]</sup> Your SLO math should include that behavior, and your runbook should tell people to put the `request-id` in any support ticket.<sup>[5]</sup>

## Handoff documentation is the operating contract for the team that inherits the system

### The decision

A handoff succeeds when the receiving team can run, change and retire the system without the original builders. The test is simple. Could someone on call diagnose a failure at 3 a.m. using only the package?

| Section of the handoff package | Contents that make it usable | Why it matters |
|---|---|---|
| Pinned versions | Exact model IDs, `anthropic-version` header value, prompt and tool-definition versions in source control | Each model ID has its own retirement schedule. The API version sets which parameters are accepted<sup>[9][10]</sup> |
| Success criteria and evals | The thresholds from discovery, the test set, the grader and its rubric | Lets the next team tell a regression from noise |
| Error-handling runbook | Each HTTP error class and the response to it, retry policy, escalation with request IDs | Matches the documented error types<sup>[5]</sup> |
| Capacity and cost model | Peak tokens per minute, cache hit rate, workspace limits, spend limits | Rate limits and spend caps behave differently when hit<sup>[4]</sup> |
| Data handling | Where inference runs, what is retained, how records are retrieved for audit | Legal and security will ask again after launch |
| Lifecycle calendar | Current model status, how to check for deprecations, who owns migration | Retirements break requests on a fixed date<sup>[8]</sup> |

For implementation guidance, document the patterns the pages themselves recommend. Catch the SDK's typed exceptions, most specific first, instead of matching on error-message strings.<sup>[5]</sup> Tolerate new enum values in responses, because a given API version may add new values to enum-like outputs without warning.<sup>[10]</sup> For audit needs on Claude Enterprise, name the Compliance API as the system of record, not a homemade log scraper. Its overview separates per-event compliance records from the aggregated analytics APIs used by IT and FinOps.<sup>[11]</sup>

**Weak handoff:** a wiki page with the current prompt and a link to the repository. **Strong handoff:** the package above, reviewed by the receiving team. Their first on-call shift happens while the builders are still available.

## The lifecycle is a loop, and model retirement is a scheduled forcing event

### The decision

The phases are discovery, design, handoff, monitoring and iteration. Each one needs an exit criterion, or the system drifts.

| Phase | Primary output | Exit criterion | Typical failure |
|---|---|---|---|
| Discovery | Success criteria, constraints, baseline | Every criterion has a threshold and a measurement | "Requirements" with no numbers |
| Design | Architecture, ADRs, eval plan | Prototype meets thresholds on the test set | Design picked before constraints were known |
| Handoff | Operating package | Receiving team runs an incident drill unaided | Builders remain the only people who understand it |
| Monitoring | Dashboards and alerts tied to criteria | Alerts fire on criterion breaches, not just errors | Uptime watched, quality not |
| Iteration | Changes gated by evals | Change passes the eval suite before rollout | Prompt edits shipped without regression tests |

### Model lifecycle facts you must know

Anthropic describes four model states. **Active** means fully supported. **Legacy** means no further updates and possible future deprecation. **Deprecated** means it still works, but it is no longer recommended and has a retirement date. **Retired** means requests fail.<sup>[8]</sup> Customers with active deployments get at least **60 days' notice** before a publicly released model retires.<sup>[8]</sup> The page warns that deprecated models are likely to be less reliable than active ones. It also recommends testing replacements well before the retirement date.<sup>[8]</sup> To find what still calls a deprecated model, export the Console Usage page as a CSV. It breaks usage down by API key and model.<sup>[8]</sup>

There is a platform nuance too. The published dates apply to Anthropic-operated platforms. Amazon Bedrock and Claude Models on Google Cloud (Google managed) set their own retirement schedules, so the same model can have different dates there.<sup>[8]</sup> A multi-cloud handoff needs one calendar per platform.

Versioning has two layers:

- **Model IDs.** From the 4.6 generation onward, IDs are dateless (`claude-{name}-{major}[-{minor}]`), and each one is a **pinned snapshot**, not an evergreen pointer. Anthropic does not update the weights behind an existing ID. Updates ship under new IDs.<sup>[9]</sup> Older models carry a date in the ID. On the Claude API they also have aliases that point to the latest dated snapshot for their minor version.<sup>[9]</sup> Neither scheme upgrades you to a new model automatically. Migration is always a deliberate change.
- **API versions.** Every request sends an `anthropic-version` header. Within a version, Anthropic preserves existing input and output parameters. It may still add optional inputs, add output values, change the conditions for error types, and add enum variants.<sup>[10]</sup> A new version can remove things. For example, version `2026-10-21` removes `temperature`, `top_p` and `top_k`, and requests that send them return 400.<sup>[10]</sup> The deprecations page notes that a new model can also reject a deprecated parameter.<sup>[8]</sup>

### Reading the evidence

| Symptom | Likely cause |
|---|---|
| Requests fail on a date with no code change | Model reached its retirement date<sup>[8]</sup> |
| 400 errors right after an SDK or header upgrade | The new API version removed a parameter you still send<sup>[10]</sup> |
| Parser crashes on an unfamiliar streaming event type | Code assumed a closed set of enum values. Versions may add variants<sup>[10]</sup> |
| Bedrock deployment still works after the API retirement date | Partner platforms keep their own schedules. Do not assume this lasts<sup>[8]</sup> |

## Worked design review: a claims-summary service promised more than its foundation

**The system.** An insurer's platform team builds a service that summarizes claim files for adjusters, who wait on screen for the result. A nightly job also summarizes the previous day's closed claims for auditors. The team pitched it with "99.9% availability, guaranteed," based on buying Priority Tier. Its success criterion is "summaries are accurate." Production calls a pinned model ID. A deprecation email arrives announcing retirement in 60 days, and nobody owns it.

**The flaws.** The availability promise rests on a tier that is no longer sold.<sup>[6]</sup> The criterion has no metric, so nobody can show that a replacement model is "as good." The nightly job shares a workspace and real-time capacity with the interactive path, so a large night can collide with morning traffic if it runs late. Migration has no owner and no eval to gate it.

**The constraint that decides.** Adjusters wait on screen, so the interactive path needs a defensible availability and latency commitment. The auditors' job can wait.

**The better design.**

1. Replace "accurate" with criteria. For example: at least 95% of required claim fields present and correct on a held-out set of 1,000 files, zero invented monetary amounts, and p95 latency under a stated bound. Build the eval from real files and edge cases.<sup>[1]</sup>
2. Restate the SLO as something the team controls end to end: SDK retries honoring `retry-after`, a degraded mode that shows the raw claim file when summarization fails, and alerts on criterion breaches. Record guaranteed capacity as an open dependency with Anthropic sales, not as a promise.<sup>[4][5][6]</sup>
3. Move the nightly job to the Batches API at 50% of standard price, with a delivery window of up to 24 hours, which the auditors accept.<sup>[7]</sup> Put each path in its own workspace with its own limits.<sup>[4]</sup>
4. Make the deprecation notice an ADR revisit trigger. Run the eval suite against the recommended replacement now, and cut over well before retirement.<sup>[8]</sup>

**Why the tempting alternatives lose.**

- **"Switch to an alias so the service always gets the newest model."** Aliases exist only for pre-4.6 models, and they resolve within one minor version. Dateless IDs are fixed snapshots. Silent model swaps would also break the eval gate this design depends on.<sup>[9]</sup>
- **"Add detailed logging and a dashboard to watch availability."** This is a compensating control. It reports the broken promise without fixing the dependency behind it.
- **"Disable retries so failures surface quickly."** This throws away the documented recovery behavior for transient 429 and 5xx errors and makes the SLO worse.<sup>[5]</sup>
- **"Run both paths through batch to halve the cost."** Batch breaks the stated requirement that adjusters get a result while they wait.<sup>[7]</sup>

## How wrong answers are built

- **"Hold more stakeholder interviews to refine requirements."** It sounds diligent but produces nothing testable. The fix for vague requirements is criteria with thresholds and a test set (wrong knob).
- **"Purchase Priority Tier to guarantee the SLA."** Out of date. Priority Tier is legacy and no longer sold to new commitments (wrong knob).
- **"Add audit logging so security is comfortable with the agent's broad permissions."** A compensating control offered where the capability should be removed (family 1).
- **"Move everything to batch to meet the cost target."** Fixes cost by breaking a stated latency requirement (family 2).
- **"The model must have been silently updated."** Weights are fixed per ID. When the stem says the model ID did not change but the documents or prompt did, follow what changed (family 4).
- **"Retry harder."** Wrong when the 429 has no `retry-after` and signals a spend cap. Read the error before choosing the response (family 4).
- **"Present benchmark scores to the executive sponsor."** Wrong evidence for the audience. Executives need outcome against baseline, cost and residual risk.

## What to remember

- Good success criteria are specific, measurable, achievable and relevant, and most use cases need several dimensions at once.
- Discovery starts by measuring today's process. That baseline becomes the eval set's first cases.
- Rate limits are maximums, not guaranteed minimums. Bursts and sharp ramps can trigger 429s.
- A spend cap returns 429 with no `retry-after`. A spend limit you set returns 400.
- Priority Tier is legacy and no longer sold. Ask sales about guaranteed capacity.
- Batch costs 50% of standard prices, results arrive within 24 hours, and most batches finish within an hour.
- Model states are Active, Legacy, Deprecated and Retired, with at least 60 days' notice before retirement. Bedrock and Google-managed platforms set their own dates.
- Dateless model IDs are pinned snapshots. API versions can remove parameters and add enum values.
- An ADR needs a revisit trigger. A handoff needs an incident drill.

## Endnotes for this chapter

1. Success criteria should be specific, measurable, achievable and relevant. The page contrasts "safe outputs" with a thresholded toxicity criterion, lists common criteria (task fidelity, consistency, relevance, tone, privacy, context use, latency, price), notes that most use cases need several, and gives eval design and grading guidance. Anthropic, "Define success criteria and build evaluations" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/test-and-evaluate/develop-tests
2. The three build paths (Messages API, Claude Agent SDK, Claude Managed Agents) differ in how much of the loop, tools and runtime you operate yourself. Anthropic, "Guides to common use cases" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/use-case-guides/overview
3. Before automating, study the current routing process (SLA criteria, existing rules and their failures, edge cases, prioritization). The guide lists signals that favor an LLM over traditional ML and sets success criteria, including consistency and bias targets across customer groups. Anthropic, "Ticket routing" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/use-case-guides/ticket-routing
4. Spend and rate limits are set per organization and tier. Limits are maximums, not guaranteed minimums. Token-bucket enforcement means short bursts can exceed limits, and acceleration limits apply to sharp increases. A spend-cap 429 has no `retry-after`, while a self-set spend limit returns 400. Cache reads don't count toward ITPM for most models, and workspace limits can be set. Anthropic, "Rate limits" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/api/rate-limits
5. The page lists HTTP error types (including 429 `rate_limit_error` and 529 `overloaded_error`) and acceleration limits. SDK retries are on by default (two retries with exponential backoff, honoring `retry-after`). Catch typed exceptions, and include the request ID in support requests. Anthropic, "Claude API errors" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/api/errors
6. Service tiers are legacy, and Priority Tier commitments are no longer sold. Existing commitments target 99.5% uptime and fall back to standard beyond capacity. US-only inference on Claude 4.6 and later is priced at 1.1x. Anthropic, "Service tiers" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/api/service-tiers
7. The Message Batches API charges 50% of standard prices. Most batches finish within an hour, results are available after all requests complete or after 24 hours, and batches expire if not done within 24 hours. Anthropic, "Batch processing" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/batch-processing
8. The page defines the Active, Legacy, Deprecated and Retired states and promises at least 60 days' notice for publicly released models. It recommends testing replacements early, describes the Usage CSV export for auditing model usage, notes that partner platforms set their own schedules, and says new models or API versions can reject deprecated parameters. Anthropic, "Model deprecations" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/model-deprecations
9. From the 4.6 generation, model IDs are dateless pinned snapshots, and weights for an ID are never updated. Pre-4.6 aliases point to the latest dated snapshot for a minor version. Serving-infrastructure updates can cause minor behavior differences on an unchanged ID. Anthropic, "Model IDs and versioning" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions
10. Each request sends `anthropic-version`. A version preserves existing parameters but may add optional inputs, output values and enum variants. Version `2026-10-21` removes `temperature`, `top_p` and `top_k`. Anthropic, "Versions" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/api/versioning
11. The Compliance API gives Claude Enterprise and Console customers programmatic access to activity records and, for Enterprise, to content and session transcripts, for security, legal and compliance teams. It is distinct from the aggregated analytics APIs and from OpenTelemetry. Anthropic, "Compliance API" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/manage-claude/compliance-api
12. `inference_geo` controls where inference runs for each request (`"global"` by default, or `"us"`) and can be set as a workspace default. Anthropic, "Data residency" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/manage-claude/data-residency
