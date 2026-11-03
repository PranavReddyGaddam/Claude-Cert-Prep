# Chapter 12: Capstone Design Reviews

**Summary**: *Four complete design reviews, each in a different industry and shape, each worked the way a senior reviewer would work it: find the constraint that decides, trace every finding to its cause and its objective, and reject the fixes that only look responsible. The chapter ends with a one-page checklist you can run on any Claude design.*

## A design review starts from the constraint and ends at the cause

Every review below has the same five parts: the business problem with its numbers, the design as a reviewer would receive it, the findings, the revised design, and a table of tempting fixes. Each finding names one objective and links to the chapter that teaches it, so a weak finding tells you which chapter to reread.

Read each design before you read the findings. Write down your own findings first, then compare. The exam's short stems test the same judgment one finding at a time: a stem is usually one of these findings with three wrong fixes around it.

The four reviews cover different shapes on purpose:

| Review | Industry | Shape | Dominant constraint |
|---|---|---|---|
| 1 | Healthcare | Conversational assistant with tools | Regulation (HIPAA) and patient safety |
| 2 | Retail | Offline pipeline at high volume | Cost and a hard overnight deadline |
| 3 | Software | Internal agent with Claude Code and MCP | Blast radius and policy that actually reaches every session |
| 4 | Financial services | Multi-agent retrieval and research | Traceability, data residency and cost per question |

## Review 1: A healthcare intake assistant fails on platform choice before it fails on prompts

### The business problem and constraints

A regional health network with nine clinics wants an assistant that takes patient intake before a visit: reason for visit, symptoms, current medications, insurance details. It should flag urgent symptoms and book routine appointments.

- **Volume:** about 2,000 intake conversations a day, about eight turns each. About 30% of patients write in Spanish.
- **Latency:** the patient sees the first words of each reply within 2 seconds.
- **Regulation:** every conversation contains protected health information (PHI). The network has signed Anthropic's BAA and enabled HIPAA readiness on its organization.
- **Budget:** under $8,000 a month in model spend.
- **Today:** nurses spend about 11 minutes per patient on intake calls. That number is the baseline the sponsor wants to cut.

### The design as submitted

1. A hosted agent on **Claude Managed Agents**, so the team does not run infrastructure.
2. One **Agent Skill** per specialty (cardiology, pediatrics, orthopedics) holding intake protocols.
3. Insurance-card photos and referral PDFs uploaded through the **Files API**.
4. A **structured output** schema generated per patient, with an `enum` of that patient's current medications pulled from the EHR, so the model can only confirm known drugs.
5. An EHR tool running as one **service account** with read and write access to every patient record.
6. The model assigns urgency and **books the appointment directly**. A system-prompt line says "always send chest pain to the nurse line."
7. Overnight, a **Batch API** job summarizes each intake for the clinician.
8. Success metric: patient satisfaction score.

### Findings

1. **Four of the platform choices are blocked outright.** *D5.4, [chapter 9](/ccar-p/read/pro-notes/09-governance-safety-and-risk).* In the Messages API, Agent Skills, Batch processing and the Files API are all marked not HIPAA-eligible, and in Managed Agents no feature is eligible for ZDR or HIPAA readiness.<sup>[1]</sup> On a HIPAA-enabled organization the API returns a `400` for a request that uses an ineligible feature.<sup>[1]</sup> The design would fail its first integration test, which is better than it passing. The fix is the Messages API with the team's own loop, PDFs sent inline (eligible when sent inline, not through the Files API), and protocols in the system prompt.<sup>[1]</sup>
2. **PHI sits in the schema.** *D5.4, [chapter 9](/ccar-p/read/pro-notes/09-governance-safety-and-risk).* Structured-output schemas are compiled and cached separately from message content and do not get the same PHI protections. The page says not to put PHI in property names, `enum` values, `const` values or `pattern` expressions.<sup>[1]</sup> A medication list built per patient is exactly that. Use one static schema and pass the medication list in message content.
3. **A "never" lives in the prompt.** *D5.1, [chapter 9](/ccar-p/read/pro-notes/09-governance-safety-and-risk).* "Always send chest pain to the nurse line" is guidance. The requirement is that no red-flag case waits for a routine slot. Put that in code: the booking tool itself refuses any slot type other than routine, and a deterministic red-flag check on the structured intake fields routes to the nurse line whatever the model concluded.
4. **The human gate is in the wrong place.** *D5.3, [chapter 9](/ccar-p/read/pro-notes/09-governance-safety-and-risk).* The irreversible effect is not the conversation but the triage decision. Routine bookings can be automatic. Anything the model or the red-flag check marks non-routine goes to a nurse queue before any appointment is made. With a few hundred such cases a day the queue must be staffed and measured, or approvals turn into rubber stamps.
5. **One service account makes every patient one user.** *D3.2, [chapter 7](/ccar-p/read/pro-notes/07-identity-latency-and-observability).* An injected instruction in a referral PDF could steer an all-patients read tool toward someone else's chart. Untrusted documents belong in `tool_result` blocks,<sup>[2]</sup> but the boundary is identity: the EHR tool should act with the patient's portal session, scoped to that patient's record, and offer no write path except booking.
6. **The metric answers the wrong question.** *D4.1 and D5.5, [chapter 8](/ccar-p/read/pro-notes/08-evaluation-testing-and-optimization).* Criteria should be specific, measurable and usually multidimensional.<sup>[3]</sup> Satisfaction alone cannot show a missed red flag. The suite needs red-flag recall on a labeled set (the expensive error), intake completeness, nurse minutes per patient against the 11-minute baseline, and the same scores sliced by language. Anthropic's routing guide aims for accuracy within 2–3 percent across customer groups, which is a reasonable starting target here.<sup>[4]</sup>
7. **Nobody priced the repeated protocol text.** *D2.5, [chapter 4](/ccar-p/read/pro-notes/04-context-tokens-and-reuse).* Prompt caching is HIPAA-eligible.<sup>[1]</sup> With a 9,000-token protocol prefix, 16,000 requests a day resend about 144 million prefix tokens. On Claude Sonnet 5.5 at $2 per million input tokens that is about $288 a day uncached. Cache reads on Sonnet 5.5 cost 0.05x the base input price, $0.10 per million, so the reads drop to under $15 a day plus writes.<sup>[5]</sup> That is most of the budget recovered before anyone discusses a smaller model.

### The revised design

The assistant runs on the Messages API in the network's own service, on the HIPAA-enabled organization. Specialty protocols sit in a fixed, cached system prompt, ordered so the stable text comes first.<sup>[6]</sup> Replies stream to meet the 2-second first-token target. Intake fields come back through one static schema. A deterministic red-flag check runs on those fields, and only routine bookings are automatic; every other case goes to a staffed nurse queue. The EHR tool acts as the patient. Clinician summaries are generated as standard requests when the intake closes, since Batch is ineligible. The eval suite starts from 20–50 real intake transcripts with known outcomes,<sup>[7]</sup> includes Spanish cases, and gates every prompt change.

### Tempting fixes and why they lose

| Tempting fix | Why it loses | Family |
|---|---|---|
| "Enable ZDR as well, to be safe." | Not needed with HIPAA readiness, and it does not make Managed Agents, Batch or Skills eligible<sup>[1]</sup> | 3 |
| "Keep Managed Agents and log every tool call for audit." | The platform is ineligible. Logging does not change that | 1 |
| "Use a separate HIPAA workspace inside the existing organization." | HIPAA readiness is enforced per organization; separate workloads need separate organizations<sup>[1]</sup> | 2 |
| "Strengthen the chest-pain instruction with capitals and examples." | Still guidance. The booking tool and the red-flag check carry the guarantee | 1 |
| "Drop the overnight summaries to save cost." | Clinicians need them. Caching and standard calls fit the budget | 2 |

## Review 2: A catalog enrichment pipeline buys its savings from scheduling and caching, not from a smaller model

### The business problem and constraints

A retailer with 3 million products receives supplier feeds every evening. Each changed product needs normalized attributes (material, fit, dimensions, compatibility), a 60-word description in house style, and a category from a 1,400-node taxonomy.

- **Volume:** about 600,000 changed products a night, peaking at 1.5 million in the week before a season launch.
- **Deadline:** feeds close at 23:00. Enriched records must be published by 06:00.
- **Budget:** $60,000 a month in model spend.
- **Prompt shape:** a 6,500-token static prefix (style guide, taxonomy, examples), about 800 tokens of supplier text, about 400 output tokens.

### The design as submitted

1. Real-time Messages API calls on Claude Sonnet 5.5, 200 concurrent workers.
2. Each prompt begins with `Run started: <timestamp>` and the supplier name, followed by the style guide and taxonomy.
3. "Return valid JSON" in the prompt, with a regex repair step for broken output.
4. Price, stock and weight are also extracted by the model from supplier free text.
5. Quality check: a merchandiser spot-checks 50 random products a week.
6. 429 errors at about 02:00 are handled with more retries. The vendor's "guaranteed rate limit" is quoted in the runbook.

### Findings

1. **A 7-hour overnight job is paying real-time prices.** *D1.6, [chapter 1](/ccar-p/read/pro-notes/01-from-business-problem-to-architecture).* At list price the design costs about $11,000 a night: roughly 4.4 billion input tokens at $2 per million plus 240 million output tokens at $10 per million.<sup>[5]</sup> That is about $330,000 a month against a $60,000 budget. The Message Batches API halves token prices, and most batches finish within an hour.<sup>[8]</sup>
2. **The deadline is shorter than the batch guarantee.** *D1.2, [chapter 1](/ccar-p/read/pro-notes/01-from-business-problem-to-architecture).* A batch can take up to 24 hours before it expires, and processing can slow with demand.<sup>[8]</sup> Seven hours is not 24. The design needs submission as feeds land, not at 23:00, and a cutoff (say 04:30) after which unfinished items are resent as standard requests. Each batch is also capped at 100,000 requests or 256 MB, whichever comes first.<sup>[8]</sup> A 7,300-token request is tens of kilobytes, so the byte cap sets the batch count. Size batches by bytes, not by rows.
3. **The timestamp at the top defeats the cache.** *D2.5, [chapter 4](/ccar-p/read/pro-notes/04-context-tokens-and-reuse).* Cache hits need a 100% identical prefix up to the breakpoint, and Anthropic's own example of a wasted cache is a per-request timestamp.<sup>[6]</sup> Move the timestamp and supplier name after the static block and put the breakpoint at the end of the static prefix. Cache reads on Sonnet 5.5 cost 0.05x, and caching stacks with the Batch discount.<sup>[5]</sup> With a full hit rate the night falls to roughly $1,900 ($195 of cached prefix, $480 of supplier text, $1,200 of output at batch prices). Batch cache hits are best-effort, typically 30–98%, and the 1-hour cache duration is suggested for shared batch context.<sup>[8]</sup> So the plan must measure `cache_read_input_tokens` per request<sup>[6]</sup> instead of assuming the floor.
4. **"Return valid JSON" is a request, not a guarantee.** *D2.2, [chapter 3](/ccar-p/read/pro-notes/03-models-and-prompts).* Structured outputs use constrained decoding to guarantee schema-compliant responses.<sup>[9]</sup> Put the taxonomy codes in an `enum` and delete the regex repair, which hides a failure instead of removing it.
5. **System-of-record values are being generated.** *D3.6, [chapter 6](/ccar-p/read/pro-notes/06-retrieval-augmented-generation).* Price and stock come from the supplier's structured feed and the retailer's inventory system, not from a model's reading of prose. Copy them deterministically and validate them against the feed. The model enriches only what needs language: descriptions, normalized attributes, category.
6. **Fifty random spot checks cannot detect a category-level failure.** *D4.2, [chapter 8](/ccar-p/read/pro-notes/08-evaluation-testing-and-optimization).* Start with 20–50 cases drawn from real failures,<sup>[7]</sup> then stratify by category so rare, high-revenue categories are represented. Code graders check schema, units and taxonomy codes; a calibrated model grader scores style; merchandisers label the calibration set. This suite is also what licenses the next saving: routing simple categories to Claude Haiku 5.5, which costs $0.10 / $0.50 per million tokens for prompts up to 100,000 tokens.<sup>[5]</sup> Route only where the suite says cost per completed record falls at the same quality.
7. **The runbook promises a limit the platform never promised.** *D6.3, [chapter 10](/ccar-p/read/pro-notes/10-discovery-communication-and-lifecycle).* Rate limits are maximums, not guaranteed minimums.<sup>[10]</sup> Batch also has its own limits on queued requests.<sup>[8]</sup> Correct the runbook and size the launch-week peak against measured headroom, with the cutoff from finding 2 as the safety valve.

### The revised design

Feeds are parsed as they land. Structured fields (price, stock, weight, identifiers) are copied and validated in code. Descriptive enrichment goes into byte-sized batches on a stable cached prefix with a 1-hour TTL, with structured outputs enforcing the attribute schema. A 04:30 sweep resends unfinished items as standard requests. Cache read share, batch completion time and records published by 06:00 are dashboarded each night. The stratified eval suite gates prompt changes and any model routing. Before launch week, a dry run at 1.5 million records checks the 06:00 deadline.

### Tempting fixes and why they lose

| Tempting fix | Why it loses | Family |
|---|---|---|
| "Switch everything to Haiku 5.5 to hit the budget." | Untested on hard categories; scheduling and caching hit the budget without moving quality | 2 |
| "Send only the first 200 tokens of supplier text." | Compatibility and dimension details sit further down; the requirement is correct attributes | 2 |
| "Add more cache breakpoints." | The content before them still changes on every request | 3 |
| "Retry the 429s harder." | It treats a capacity plan as an error-handling problem; the work belongs in Batch | 3 |
| "Add a reviewer to fix broken JSON." | A compensating control for a guarantee the API already offers | 1 |

## Review 3: An internal on-call agent needs less reach, a real gate and policy that reaches every session

### The business problem and constraints

A software company with 350 engineers uses Claude Code daily. The platform team now wants an on-call agent: when an alert fires, it reads logs and metrics, finds the likely bad deploy and rolls it back.

- **Volume:** about 40 alerts a day; about 200 Claude Code sessions a day across the team.
- **Latency:** the first diagnosis in the incident channel within 5 minutes of the alert.
- **Risk:** rollbacks touch production. A wrong rollback during peak traffic costs more than a slow one.
- **Budget:** the CFO asked for a per-engineer cost figure. Anthropic reports an enterprise average of about $13 per developer per active day, and $150–250 per developer per month.<sup>[11]</sup>
- **Platform facts:** about 40% of engineers reach Claude through Amazon Bedrock by setting `CLAUDE_CODE_USE_BEDROCK` in their shell.

### The design as submitted

1. A headless Agent SDK agent in `bypassPermissions` mode with `allowed_tools` listing the tools it should use.
2. An internal deploy MCP server exposing `deploy`, `rollback`, `scale`, `delete_service` and `rotate_secret`.
3. The deploy server accepts the caller's SSO token and forwards it to the deploy API.
4. A GitHub MCP server for reading commits, although `gh` is on every runner.
5. Team policy (deny rules, allowed MCP servers) in a committed `.claude/settings.json`. Server-managed settings were set up for the Teams plan.
6. "Ask before rolling back during business hours" in the agent's system prompt.
7. Telemetry is off because "it might capture source code." Cost per engineer comes from the SDK's `total_cost_usd`.

### Findings

1. **The agent can reach far more than its job.** *D3.1, [chapter 5](/ccar-p/read/pro-notes/05-integration-mechanisms-and-scope).* It needs read access to logs, metrics and commits, plus `rollback`. It never needs `scale`, `delete_service` or `rotate_secret`. `allowed_tools` does not restrict: in `bypassPermissions` mode, calls that reach the mode step are approved.<sup>[12]</sup> Remove those tools from what the server exposes to this agent, or deny them. A deny rule wins even in `bypassPermissions` and even over a hook's `allow`.<sup>[12]</sup>
2. **The rollback gate is a sentence.** *D5.3, [chapter 9](/ccar-p/read/pro-notes/09-governance-safety-and-risk).* Put an `ask` rule on `rollback`. Ask rules send the call to the `canUseTool` callback even in `bypassPermissions` mode,<sup>[12]</sup> and the callback posts the proposed rollback, with its evidence, for the on-call engineer to approve. Where approval may take a while, a `PreToolUse` hook can return `defer`, which ends the turn with `stop_reason` `"tool_deferred"` so the call can be resumed later.<sup>[13]</sup> Diagnosis stays fully automatic; only the production effect waits for a person.
3. **The deploy server passes tokens through.** *D3.2, [chapter 7](/ccar-p/read/pro-notes/07-identity-latency-and-observability).* MCP servers must validate that access tokens were issued for them as the intended audience,<sup>[14]</sup> and token passthrough is a named anti-pattern.<sup>[15]</sup> The server should accept only tokens issued for itself and call the deploy API with its own narrowly scoped credential, recording which human approved each rollback.
4. **The policy does not reach 40% of sessions.** *D7.1, [chapter 11](/ccar-p/read/pro-notes/11-team-enablement-and-operations).* Server-managed settings are a client-side control, not a security boundary, and setting a third-party provider variable such as `CLAUDE_CODE_USE_BEDROCK` bypasses them.<sup>[16]</sup> A committed project file can be edited by anyone with write access. Deliver policy as endpoint-managed settings through MDM, which can be protected from user modification at the OS level,<sup>[16]</sup> and restrict which providers a machine may use with the provider-restriction setting.<sup>[17]</sup>
5. **The integration choice costs context it does not need.** *D3.7 and D3.8, [chapter 5](/ccar-p/read/pro-notes/05-integration-mechanisms-and-scope).* CLIs such as `gh` are more context-efficient than MCP servers because they add no per-tool listing.<sup>[11]</sup> Drop the GitHub server for this agent. Do not over-trim the rest: Claude Code defers MCP tool definitions by default through tool search, so only names and server instructions load at session start.<sup>[18]</sup> Run `/context` before cutting servers that teams use.
6. **There is no signal to debug or bill from.** *D7.3 and D3.4, [chapter 11](/ccar-p/read/pro-notes/11-team-enablement-and-operations).* Telemetry needs `CLAUDE_CODE_ENABLE_TELEMETRY=1`, and prompt and response content logging is disabled unless explicitly turned on.<sup>[19]</sup> In the Agent SDK, telemetry is structural by default (durations, model names, tool names), and export errors fail silently, so check the collector.<sup>[20]</sup> The fear of source capture is not a reason to stay blind. For the CFO, `total_cost_usd` is a client-side estimate, not billing data;<sup>[21]</sup> chargeback comes from the Usage and Cost Analytics API, whose responses say how fresh their data is.<sup>[22]</sup>

### The revised design

The on-call agent runs headless without `bypassPermissions`: allow rules approve the read tools it needs, and everything else falls to the callback or is denied. Its deploy server exposes `rollback` and read endpoints only, validates token audience and holds its own deploy credential. `rollback` has an ask rule routed through `canUseTool` to the incident channel, with `defer` for slow approvals. Commits are read with `gh`. Endpoint-managed settings, delivered by MDM, carry the deny rules, the allowed MCP servers and the provider restriction to every laptop, including Bedrock users. OpenTelemetry exports structural telemetry with content capture off. Monthly cost per engineer is reconciled from the Usage and Cost Analytics API.

### Tempting fixes and why they lose

| Tempting fix | Why it loses | Family |
|---|---|---|
| "Log every `delete_service` call and alert the platform team." | The capability should not exist for this agent | 1 |
| "Mark the destructive tools as deferred so the agent rarely sees them." | A deferred tool can still be found and called | 1 |
| "Server-managed settings must be broken; reinstall them." | The evidence is the Bedrock variable, which bypasses them by design<sup>[16]</sup> | 4 |
| "Deny WebFetch to stop the agent leaking logs." | Bash can still run `curl`; network limits need the sandbox's domain allowlist<sup>[17]</sup> | 1 |
| "Give the agent Opus so it picks the right rollback." | Model size does not fix reach or the missing gate | 3 |

## Review 4: A research system for analysts earns multi-agent cost only on breadth, and earns trust only with real citations

### The business problem and constraints

An asset manager's 120 equity analysts want a research assistant over public filings, internal research notes and the firm's positions database.

- **Volume:** about 1,500 questions a day. Logs from a pilot show about 70% are single-fact lookups ("What was the segment margin in Q2?"). The rest are broad comparisons across 20–40 issuers.
- **Latency:** lookups within 15 seconds; broad questions within 3 minutes.
- **Corpus:** about 45,000 filings and 12,000 internal notes, refreshed daily. The positions database holds about 2 million rows.
- **Regulation and policy:** compliance requires that every claim in an answer be traceable to a source passage, and that inference run in the United States.
- **Budget:** a cost-per-question target agreed with the head of research.

### The design as submitted

1. Every question goes to a lead agent on Claude Opus 5.5 that spawns eight subagents.
2. Documents are split into fixed 2,000-token chunks and embedded. There is no lexical index.
3. A nightly job embeds rows of the positions table so the agent can "find" holdings.
4. Answers use structured outputs (a JSON object with `claims` and `sources`), and the prompt asks the model to cite passages.
5. No inference geography is set.
6. Last Tuesday, answer accuracy dropped sharply after the team re-embedded the corpus with a newer embedding model. The model ID, prompts and latency did not change. The proposed fix is "the provider must have updated Opus; pin an older model."

### Findings

1. **Multi-agent runs on every question, including lookups.** *D1.4, [chapter 2](/ccar-p/read/pro-notes/02-choosing-the-pattern).* Anthropic's multi-agent research system beat a single agent by 90.2% on its internal research eval, especially on breadth-first queries. It also used about 15 times the tokens of a chat interaction and fits poorly where agents share context or depend on each other.<sup>[23]</sup> A segment-margin lookup is neither broad nor parallel. Route: lookups to a single retrieval call, broad comparisons to the orchestrator with one subagent per issuer group. Start simple and add complexity only when it is needed.<sup>[24]</sup>
2. **Retrieval cannot find tickers, CUSIPs or filing item numbers.** *D3.5, [chapter 6](/ccar-p/read/pro-notes/06-retrieval-augmented-generation).* Embeddings miss exact identifiers, which is what BM25 is for.<sup>[25]</sup> Fixed chunks also lose their document: a chunk reading "margin fell 40 basis points" names neither the issuer nor the period. Contextual Retrieval prepends 50–100 tokens of chunk-specific context before embedding and before building the BM25 index.<sup>[25]</sup> In Anthropic's tests that cut top-20 retrieval failures by 49%, and by 67% with reranking.<sup>[25]</sup>
3. **The positions table is being embedded.** *D3.6, [chapter 6](/ccar-p/read/pro-notes/06-retrieval-augmented-generation).* "How much of issuer X do we hold across funds?" is an aggregate over rows, not a similarity search. Give the agent a read-only query tool on the database. Anthropic's measurement shows the size of the gap: with a table uploaded and queried through code execution, Claude answered 25 of 25 aggregate questions; with it pasted into the prompt, 7 of 25, at about twelve times the cost.<sup>[26]</sup>
4. **The citation design returns a 400 and proves less than compliance thinks.** *D5.2 and D5.1, [chapter 9](/ccar-p/read/pro-notes/09-governance-safety-and-risk).* Enabling citations on documents or search results together with structured outputs returns a 400 error.<sup>[27]</sup> Prompted citations, the current workaround, can point anywhere. Choose native citations, delivering retrieved chunks as `search_result` blocks with a required `source` and `title`,<sup>[28]</sup> and parse claims after generation. Native citations are guaranteed to be valid pointers to the provided documents.<sup>[27]</sup> A valid pointer does not prove the passage supports the claim, so sample answers for support review, and ask the model to quote before it answers on long filings.<sup>[29]</sup>
5. **The diagnosis ignores what changed.** *D4.4, [chapter 8](/ccar-p/read/pro-notes/08-evaluation-testing-and-optimization).* Anthropic does not update the weights or configuration of an existing model ID.<sup>[30]</sup> The stem says the only change was the re-embedding. *General practice, not from Anthropic documentation:* vectors from different embedding models do not share a space, so a document index rebuilt with a new model must be queried with the same model and settings, including the `input_type` used for queries versus documents.<sup>[31]</sup> Check that the query path was migrated, then run a fixed retrieval eval (recall at 20 on known relevant chunks) before any future cutover. Anthropic offers no embedding model of its own, so this belongs to the embedding provider's setup.<sup>[31]</sup>
6. **US-only inference is a parameter nobody set.** *D5.4, [chapter 9](/ccar-p/read/pro-notes/09-governance-safety-and-risk).* `inference_geo` controls where inference runs and defaults to `"global"`. It can be set per request or as a workspace default, and workspace geo separately controls where data is stored at rest.<sup>[32]</sup> US-only inference adds a 1.1x multiplier to all token prices on Claude 4.6 and later.<sup>[5]</sup> Set it as the workspace default so no request can forget it, and put the 10% in the cost-per-question model.
7. **The decision has no record and no revisit trigger.** *D6.2 and D6.4, [chapter 10](/ccar-p/read/pro-notes/10-discovery-communication-and-lifecycle).* *General practice, not from Anthropic documentation:* the routing split, the retrieval stack and the citation choice each need a decision record stating the alternatives, the measured cost per question for each path, and the trigger for revisiting it, for example "broad questions above 40% of volume" or the replacement of a model. Anthropic gives at least 60 days' notice before retiring a publicly released model,<sup>[33]</sup> so retirement belongs in the record too.

### The revised design

A cheap classification step routes each question. Lookups go to one Claude call over hybrid retrieval (contextual embeddings plus contextual BM25, reranked) with native citations. Broad questions go to an orchestrator that delegates one subagent per issuer group, each with an objective, an output format and boundaries, returning cited findings. Holdings questions use a read-only database tool. The workspace defaults to US inference. Retrieval and answer evals run before any index cutover, and answers are sampled for claim support each week. Decision records hold the revisit triggers.

### Tempting fixes and why they lose

| Tempting fix | Why it loses | Family |
|---|---|---|
| "Pin an older Opus snapshot to undo the regression." | Model IDs are pinned already; the index changed | 4 |
| "Raise top-K to 100 so the right chunk is always included." | Trades precision and cost for recall that BM25 and a reranker give more cheaply | 2 |
| "Keep structured outputs and add 'cite exact passages' to the prompt." | Prompted citations are not valid pointers; traceability is the requirement | 3 |
| "Load the whole corpus into the 1M-token window." | Too large and changing daily; cost per request and context rot both rise | 2 |
| "Log every answer for compliance to review later." | Records untraceable claims instead of making them traceable | 1 |

## A one-page checklist runs on any design

Run these in order. Each line names the question, the usual defect and the chapter. If a design passes every line, you have probably not found its defect yet, so read the constraints again.

| # | Check | Usual defect | Chapter |
|---|---|---|---|
| 1 | Is every requirement a number with a way to measure it, including today's baseline? | "Better," "faster," satisfaction alone | [1](/ccar-p/read/pro-notes/01-from-business-problem-to-architecture), [10](/ccar-p/read/pro-notes/10-discovery-communication-and-lifecycle) |
| 2 | Is the work split by deadline before a cost lever is chosen? | Everything real-time, or everything batched | [1](/ccar-p/read/pro-notes/01-from-business-problem-to-architecture) |
| 3 | Is this the least autonomous pattern that meets the requirement? | Agents or multi-agent for fixed steps and lookups | [2](/ccar-p/read/pro-notes/02-choosing-the-pattern) |
| 4 | Was effort tuned and cost compared per completed task before a model change? | Per-token price comparisons; untested downsizing | [3](/ccar-p/read/pro-notes/03-models-and-prompts) |
| 5 | Does every "must" or "never" live in code, schema, permissions or platform, not in prompt wording? | A sentence in the system prompt carrying a guarantee | [3](/ccar-p/read/pro-notes/03-models-and-prompts), [9](/ccar-p/read/pro-notes/09-governance-safety-and-risk) |
| 6 | Is the reusable prefix byte-identical and first, and is the cache hit rate measured? | Timestamps or per-request data above the static text | [4](/ccar-p/read/pro-notes/04-context-tokens-and-reuse) |
| 7 | Does each agent have only the tools its job needs, and does the mechanism fit (CLI, MCP, custom tool)? | Destructive tools "just in case"; MCP wrappers around a CLI | [5](/ccar-p/read/pro-notes/05-integration-mechanisms-and-scope) |
| 8 | Does retrieval match the data: lexical for identifiers, queries for tables, live tools for fast-changing values? | Embedding everything | [6](/ccar-p/read/pro-notes/06-retrieval-augmented-generation) |
| 9 | At each hop, whose identity is used and what audience is the token for? | Shared service account; token passthrough | [7](/ccar-p/read/pro-notes/07-identity-latency-and-observability) |
| 10 | Is the latency knob matched to the slow component (first token, output speed, round trips, queue)? | Fast mode for first-token latency; low `max_tokens` | [7](/ccar-p/read/pro-notes/07-identity-latency-and-observability) |
| 11 | Does an eval suite of real cases gate every prompt, model and index change? | Spot checks; judges never calibrated | [8](/ccar-p/read/pro-notes/08-evaluation-testing-and-optimization) |
| 12 | Is every feature eligible under the organization's data arrangement, and is geography set? | Batch, Files or Managed Agents under HIPAA; unset `inference_geo` | [9](/ccar-p/read/pro-notes/09-governance-safety-and-risk) |
| 13 | Is the human gate on the irreversible effect, and is the queue sized? | Approval of text; unstaffed queues | [9](/ccar-p/read/pro-notes/09-governance-safety-and-risk) |
| 14 | Are results tested by slice for fairness, and is provenance visible to users? | Fairness asserted in the prompt | [9](/ccar-p/read/pro-notes/09-governance-safety-and-risk) |
| 15 | Does team policy reach every session through a channel users cannot edit? | Committed settings; provider variables bypassing server-managed settings | [11](/ccar-p/read/pro-notes/11-team-enablement-and-operations) |
| 16 | Is there live telemetry for debugging and reconciled data for cost, with content capture off by default? | No traces; billing from client estimates | [7](/ccar-p/read/pro-notes/07-identity-latency-and-observability), [11](/ccar-p/read/pro-notes/11-team-enablement-and-operations) |
| 17 | Do promises to stakeholders match what the platform documents? | "Guaranteed" rate limits; uptime nobody sells | [10](/ccar-p/read/pro-notes/10-discovery-communication-and-lifecycle) |
| 18 | Do decision records carry revisit triggers, including model retirement? | Decisions with no reasons and no expiry | [10](/ccar-p/read/pro-notes/10-discovery-communication-and-lifecycle) |

When you apply the checklist to an exam stem, you usually need only one line: the one that matches the constraint the stem stated outright.

## How wrong answers are built

- **"Add logging, a dashboard or an alert."** Family 1 in all four reviews. Each time, the right move removed a tool, an ineligible feature or a reach the job did not need.
- **"Downsize the model, truncate the input or drop the feature."** Family 2. Reviews 1 and 2 hit their budgets through caching and scheduling, and routing came only after an eval allowed it.
- **"Bigger model, more breakpoints, more retries, higher top-K."** Family 3. Each is a real knob, but none was the cause.
- **"The provider changed the model."** Family 4. Review 4 said what changed: the embeddings. Follow that.
- **"Put the rule in the system prompt."** It appeared in three of the four designs. The guarantee belongs in a tool, a schema, a permission rule or a platform choice.

## What to remember

- Start from the constraint the business stated, and test every finding against it.
- Platform eligibility comes before prompt quality. Under HIPAA readiness, Batch, Files API, Skills and Managed Agents are out, and ineligible features return a `400`.
- Caching and Batch stack. A per-request value above the static prefix wastes both.
- A batch can take up to 24 hours. A tighter deadline needs early submission and a fallback path.
- `allowed_tools` approves; deny rules and ask rules enforce, even in `bypassPermissions`.
- Server-managed settings are client-side and bypassed by provider variables. MDM-delivered settings are stronger.
- Multi-agent costs about 15 times the tokens of chat. Route lookups away from it.
- Citations and structured outputs together return a `400`. Valid pointers are not proof of support.
- Model IDs do not change. When accuracy moves, look at what did.

## Endnotes for this chapter

1. HIPAA readiness requires a BAA, is enforced per organization and is permanent once enabled; ineligible features return a `400`; HIPAA readiness does not require ZDR as well; schemas must not contain PHI; the feature table marks Agent Skills, Batch processing, the Files API and Managed Agents as not HIPAA-eligible and prompt caching, structured outputs, citations and inline PDFs as eligible. Anthropic, "API and data retention" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/manage-claude/api-and-data-retention
2. Third-party content belongs in `tool_result` blocks, with the system prompt stating that tool content is untrusted data. Anthropic, "Mitigate jailbreaks and prompt injections" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks
3. Success criteria should be specific and measurable, and most use cases need several dimensions. Anthropic, "Define success criteria and build evaluations" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/test-and-evaluate/develop-tests
4. The bias-mitigation criterion aims for consistent routing accuracy within 2–3 percent across customer groups. Anthropic, "Ticket routing" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/use-case-guides/ticket-routing
5. Prices for Claude Sonnet 5.5 ($2 / $10) and Claude Haiku 5.5 ($0.10 / $0.50 up to 100,000 prompt tokens), batch prices, the 0.05x cache-read multiplier on Opus 5.5 and Sonnet 5.5, multipliers stacking with Batch and data residency, and the 1.1x US-only inference multiplier on Claude 4.6 and later. Anthropic, "Pricing" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/pricing
6. Cache hits need 100% identical prompt segments; a per-request timestamp prevents hits; the breakpoint goes at the end of the static prefix; `cache_read_input_tokens` reports reads. Anthropic, "Prompt caching" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/prompt-caching
7. A set of 20–50 simple tasks drawn from real failures is a good start for an eval suite. Anthropic, "Demystifying evals for AI agents" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/research/demystifying-evals-for-ai-agents
8. The 50% cost reduction, limits of 100,000 requests or 256 MB per batch, most batches finishing within an hour, expiry at 24 hours, slowdowns under demand, rate limits on queued requests, best-effort cache hits of 30–98%, and the suggested 1-hour cache for shared batch context. Anthropic, "Batch processing" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/batch-processing
9. Structured outputs guarantee schema-compliant responses through constrained decoding. Anthropic, "Structured outputs" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/structured-outputs
10. Limits represent maximum allowed usage, not guaranteed minimums. Anthropic, "Rate limits" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/api/rate-limits
11. The enterprise average of about $13 per developer per active day and $150–250 per month, and CLI tools being more context-efficient than MCP servers. Anthropic, "Manage costs effectively" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/costs
12. Deny rules apply even in `bypassPermissions` and over a hook `allow`; ask rules fall through to `canUseTool` even in `bypassPermissions`; bypass mode approves what reaches the mode step. Anthropic, "Configure permissions" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/agent-sdk/permissions
13. `PreToolUse` hooks can return `allow`, `deny`, `ask` or `defer`, and `defer` ends the turn. Anthropic, "Intercept and control agent behavior with hooks" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/agent-sdk/hooks
14. MCP servers must validate that access tokens were issued for them as the intended audience. MCP, "Authorization" (MCP specification, accessed 2026-11-02), https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/index
15. Token passthrough is an anti-pattern, with audience-validation failures among its risks. MCP, "Security Best Practices" (MCP docs, accessed 2026-11-02), https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices
16. Server-managed settings are a client-side control, not a security boundary; third-party provider variables such as `CLAUDE_CODE_USE_BEDROCK` bypass them; endpoint-managed settings can be protected from user modification at the OS level. Anthropic, "Configure server-managed settings" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/server-managed-settings
17. Provider restrictions limit which API providers a machine may use; denying WebFetch leaves `curl` available through Bash, and the sandbox's OS-level domain allowlist closes that gap. Anthropic, "Set up Claude Code for your organization" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/admin-setup
18. MCP tool search is on by default and defers tool definitions so only names and server instructions load at session start. Anthropic, "Connect Claude Code to tools via MCP" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/mcp
19. `CLAUDE_CODE_ENABLE_TELEMETRY` is required, and user prompt and assistant response logging are disabled by default. Anthropic, "Monitoring" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/monitoring-usage
20. Agent SDK telemetry is structural by default, and the CLI fails silently on export errors. Anthropic, "Observability with OpenTelemetry" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/agent-sdk/observability
21. `total_cost_usd` and `costUSD` are client-side estimates, not authoritative billing data. Anthropic, "Track cost and usage" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/agent-sdk/cost-tracking
22. Every response includes a `data_refreshed_at` timestamp, after which usage is missing or partial. Anthropic, "Usage and Cost Analytics API" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/manage-claude/usage-cost-analytics-api
23. The 90.2% improvement on breadth-first research, about 15x the tokens of chat, and poor fit for shared-context or highly dependent work. Anthropic, "How we built our multi-agent research system" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/research/multi-agent-research-system
24. Find the simplest solution possible and increase complexity only when needed. Anthropic, "Building effective agents" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/research/building-effective-agents
25. BM25 catches exact matches that embeddings miss; chunk-specific context of usually 50–100 tokens is prepended before embedding and BM25 indexing; failed retrievals fell 49%, and 67% with reranking. Anthropic, "Introducing Contextual Retrieval" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/research/contextual-retrieval
26. 25 of 25 aggregate questions answered with the Files API and code execution versus 7 of 25 with the table pasted, at about a twelfth of the cost. Anthropic, "Optimizing for cost and intelligence" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence
27. Citations are guaranteed valid pointers to the provided documents, and enabling citations together with structured outputs returns a 400. Anthropic, "Citations" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/citations
28. Search result blocks require `source` and `title`. Anthropic, "Search results" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/search-results
29. For long documents, extract word-for-word quotes first to ground the response. Anthropic, "Reduce hallucinations" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
30. Anthropic does not update the weights or configuration of an existing model ID. Anthropic, "Model IDs and versioning" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions
31. Anthropic does not offer its own embedding model, and documents and queries are embedded with `input_type="document"` and `input_type="query"` respectively. Anthropic, "Embeddings" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/embeddings
32. `inference_geo` controls where inference runs, defaults to `"global"`, can be set per request or as a workspace default, and workspace geo controls storage at rest. Anthropic, "Data residency" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/manage-claude/data-residency
33. At least 60 days' notice before retirement of publicly released models. Anthropic, "Model deprecations" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/model-deprecations
