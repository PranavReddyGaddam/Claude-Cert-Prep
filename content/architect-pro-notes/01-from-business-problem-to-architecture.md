# Chapter 1: From Business Problem to Architecture

**Summary**: *A business request becomes a Claude architecture in three moves: turn it into measurable tasks, wire those tasks into a pipeline that has a real feedback loop, and tie each design choice to the value pillar the sponsor actually cares about. Most wrong answers in this domain skip the first move and optimize something nobody asked for.*

## A business problem becomes a Claude solution only after it becomes measurable tasks

**The decision.** A sponsor arrives with "automate support" or "speed up claims." The architect must decide three things before choosing a model or a pattern: whether an LLM is the right tool at all, which specific tasks it will perform, and how success will be measured.

### First decide whether Claude is the right tool

Anthropic's ticket-routing guide lists the signals that favor an LLM over a traditional machine-learning classifier.<sup>[1]</sup> Paraphrased:

- **Little labeled data.** Claude can classify well from a few dozen labeled examples instead of a large training set.
- **Categories that change.** New or redefined classes need a prompt change, not relabeling and retraining.
- **Unstructured, messy input** that would otherwise need heavy feature engineering.
- **Rules defined by meaning** (conditions) rather than by surface patterns.
- **A need for human-readable reasoning** behind each decision.
- **Many ambiguous or edge cases**, where a traditional model falls back to a catch-all class.
- **Several languages** without one model per language.

The reverse also holds. If the categories are stable, labeled data is plentiful, inputs are structured and nobody needs an explanation, an existing classifier may already be the cheaper answer. A Pro item can offer "replace the working classifier with Claude" as a distractor when nothing in the stem favors it.

The customer-support guide gives a parallel list for conversational automation: high volumes of repetitive questions, the need to pull together information quickly, round-the-clock coverage, sudden peaks, and a consistent brand voice.<sup>[2]</sup>

### Then break the request into tasks you can prompt and evaluate

The support guide's core method is to **write out the ideal interaction, then break it into every distinct task** Claude must perform: greeting, product questions, staying on topic, collecting details and calling a quote tool, and so on.<sup>[2]</sup> The reason is practical. Each task gets its own prompt section, its own test cases and its own success measure. A request that stays as one blob ("handle support") cannot be evaluated, so it cannot be improved.

The same decomposition tells you what each task needs:

| Task needs | Mechanism | Why |
|---|---|---|
| Static product or policy knowledge too large for the prompt | Retrieval (RAG) | Loads only the relevant passages per query<sup>[2]</sup> |
| Live data such as balances or order status | Tool use | Embedding-based retrieval cannot return real-time values<sup>[2]</sup> |
| An action such as issuing a quote or a refund | Tool use, with the action performed by your code | The model only signals the call; your application executes it<sup>[2]</sup> |
| A fixed label from a known list | A classification prompt with few-shot examples | Fast, cheap, easy to measure<sup>[1]</sup> |

### Then write success criteria before you build

Anthropic's evaluation guide says good success criteria are **specific, measurable, achievable and relevant**, and that most use cases need **several criteria at once**.<sup>[3]</sup> "Good performance" is not a criterion. "An F1 of at least 0.85 on a held-out set, 99.5% non-toxic outputs and 95% of responses under 200 ms" is the shape the guide uses.<sup>[3]</sup> The common dimensions it lists include task fidelity, consistency, relevance, tone, privacy preservation, context use, **latency** and **price**.<sup>[3]</sup>

Two levels of criteria matter for an architect:

- **Task-level** criteria judge Claude's work: routing accuracy, comprehension accuracy, escalation accuracy, topic adherence.
- **Business-level** criteria judge whether the system was worth building: deflection rate, handling time, cost per ticket, customer satisfaction. The support guide separates these two lists explicitly.<sup>[2]</sup>

A pilot that reports only task-level accuracy cannot answer the sponsor's question, and a pilot that reports only business metrics cannot tell you what to fix.

### Options ranked by constraint: which build path

Anthropic describes three build paths that differ in how much of the implementation you hand off.<sup>[4]</sup>

| Path | What you own | Wins when | Loses when |
|---|---|---|---|
| Messages API | The loop, tools and infrastructure | You need fine-grained control, or the task is a single call or a fixed workflow | You would be rebuilding a long-running agent harness yourself |
| Agent SDK | Your process runs Claude Code's loop, tools, hooks and permissions<sup>[5]</sup> | You want a proven agent loop inside infrastructure you operate | The work is a simple classification that needs no loop |
| Claude Managed Agents | Configuration only. Anthropic hosts the loop, sandbox and runtime<sup>[6]</sup> | Long-running, asynchronous, stateful work with minimal infrastructure | Zero data retention or a HIPAA BAA is required. Managed Agents is not eligible for either, because sessions are stored server-side<sup>[6]</sup> |

The regulation row is the one that decides items. If the stem says the workload needs zero data retention, an answer that moves it onto Managed Agents fails, however convenient it is.

### Reading the evidence

| Symptom | Likely cause |
|---|---|
| The pilot "works" but the sponsor cannot say whether to fund it | No business-level success criteria were agreed before the build |
| Accuracy is high in testing but users complain about a whole class of request | That task was never broken out, so it has no test cases |
| The bot gives confident but stale answers about account status | Live data is being served from a retrieval index instead of a tool |
| Routing quality drops every time the support team adds a category | Categories are poorly defined. The guide ties routing quality directly to how well the categories are defined<sup>[1]</sup> |

## An end-to-end architecture has four stages, and the feedback loop is the one teams skip

**The decision.** Every Claude system has an input stage, a processing stage, an output stage and feedback loops. The architect chooses a mechanism for each and makes sure the loops actually close.

### Input: how work arrives

The ticket-routing guide describes two ways to connect to a source system.<sup>[1]</sup>

- **Push.** The source system sends a webhook to your service. It scales well for web traffic, but you must expose a public endpoint.
- **Pull.** Your service polls on a schedule. It is easier to build, but polling too often wastes calls and polling too rarely makes routing slow.

The input stage is also where you decide what context comes with each request: retrieved passages, a customer record from a tool, or nothing beyond the ticket text. The routing guide suggests measuring whether accuracy holds with **only the title and a short description** when token count matters.<sup>[1]</sup>

### Processing: the pattern and the model

Processing is where the pattern (single call, workflow or agent) and the model are chosen. Chapter 2 covers patterns, and [chapter 3](/ccar-p/read/pro-notes/03-models-and-prompts) covers models. Two architecture-level facts belong here:

- Every extra step adds latency. The support guide notes that a separate intent classifier in front of specialized conversations **requires an additional call** that can increase latency.<sup>[2]</sup> The routing guide says the same of hierarchical classifiers and recommends running them on the fastest model.<sup>[1]</sup>
- The support guide also recommends trying better prompts and additional tools **before** adding new architectural layers.<sup>[2]</sup>

### Output: shape it for the next consumer

Output is designed for whatever reads it next.

- **Code reads it.** Ask for clearly separated parts, for example reasoning and the label in separate XML tags, so your code can extract the label alone and route on it.<sup>[1]</sup> For stronger guarantees, use structured outputs (see [Foundations chapter 8](/ccar-f/read/notes/08-prompting-and-structured-output)).
- **A person reads it.** Streaming shows text as it is generated. The support guide notes it can make a more capable, higher-latency model acceptable, because the user starts reading sooner.<sup>[2]</sup>
- **Guardrails sit on the output path** as well as the input path: grounding and citations, policy cross-checks, no unauthorized commitments, PII removal.<sup>[2]</sup> [Chapter 9](/ccar-p/read/pro-notes/09-governance-safety-and-risk) treats these in depth.

### Feedback loops: three of them, at three timescales

"Feedback loop" means different things at different timescales. A strong design names all three.

| Loop | Timescale | What closes it | Source |
|---|---|---|---|
| Runtime loop | Within one task | The agent checks **ground truth** from the environment (tool results, test output) at each step, with stopping conditions such as an iteration cap | <sup>[7]</sup> |
| Evaluation loop | Per change | Success criteria, then test cases, then a prompt, then iterate until the criteria pass, then ship | <sup>[3]</sup> |
| Production loop | Continuous | Tracing, human review of real outputs and edge cases, fed back into test cases and prompts | <sup>[8]</sup> |

The production loop is the one most often missing. Anthropic's research team found that adding **full production tracing** was what let them see why agents failed, and that **human testers** caught problems automated evals missed, such as agents preferring low-quality, search-optimized sources.<sup>[8]</sup> They also note that stateful agents need careful deployment, because a running agent can be anywhere in its process when new code ships. They gradually shift traffic between versions while both run (**rainbow deployments**).<sup>[8]</sup>

The evaluation guide also says to **prioritize volume over quality** in test cases: many automatically graded cases beat a few hand-graded ones.<sup>[3]</sup> In a feedback-loop item, the answer that turns production failures into new automated test cases usually beats the one that adds a quarterly manual review.

### Reading the evidence

| Symptom | Likely cause |
|---|---|
| Users report "it didn't find obvious information" and nobody can say why | No tracing of the agent's queries, sources and tool results |
| A prompt fix for one complaint breaks something else | No regression suite. Changes ship without the evaluation loop |
| An agent sometimes runs until it hits a cost ceiling | No stopping condition in the runtime loop |
| Long-running agents fail after a deploy, but new ones are fine | In-flight agents hit the new version mid-task. Deployment needs to keep both versions running |

## Each value pillar maps to a metric and to a specific lever

**The decision.** Sponsors fund systems for efficiency, productivity, cost, transformation or performance SLAs. The architect must say which pillar a design serves, how it will be measured, and which lever moves it, without breaking the others.

### Options ranked by pillar

| Pillar | Measure it with | Claude-side levers | What breaks it |
|---|---|---|---|
| Efficiency | Time-to-assignment, average handling time<sup>[1]</sup> | A fast model at low effort for simple, high-volume steps<sup>[1]</sup>, streaming for perceived speed<sup>[2]</sup> | Adding chained calls or a classifier in front of every request |
| Productivity | Tickets resolved per agent per day, deflection rate<sup>[1][2]</sup> | Automate the repetitive tier, route the rest to people with context attached | Measuring deflection without checking that the deflected cases were actually resolved |
| Cost | Cost per ticket or per document<sup>[1]</sup> | Model routing, prompt caching, the Batch API for work that can wait<sup>[9][10]</sup> | Downsizing a task that needs reasoning, or batching work that has a deadline |
| Transformation | New capability, such as new languages or categories without retraining<sup>[1]</sup> | Classes defined in the prompt, multilingual handling in one model | Treating it as a cost project and judging it only on cost |
| Performance SLAs | Latency percentiles, availability, error rate | Streaming, fast mode, capacity planning against rate limits<sup>[11][12]</sup> | Assuming a rate limit is a capacity guarantee |

The routing guide gives example business targets worth recognizing as shapes rather than memorizing: a 10–20% improvement in tickets per agent and a 10–15% reduction in cost per ticket after a new routing system, a rerouting rate under 10%, and a 90–95% first-try routing accuracy benchmark.<sup>[1]</sup> Its own sample evaluation sets thresholds of 95% accuracy and a 50% average reduction in cost per classification against the current method.<sup>[1]</sup>

### Cost: the three levers stack, and each has a precondition

- **Model routing.** Send easy, common requests to a small model and hard ones to a larger model.<sup>[7]</sup> The precondition is that the classification itself is accurate.
- **Prompt caching.** A cache read costs a fraction of base input price: 0.1x on most models and 0.05x on Claude Opus 5.5 and Claude Sonnet 5.5. A 5-minute cache write costs 1.25x and a 1-hour write costs 2x.<sup>[10]</sup> The precondition is a stable, repeated prefix.
- **Batch API.** 50% off input and output for asynchronous work. Most batches finish within an hour, but a batch can take up to 24 hours, and requests still unprocessed at 24 hours expire.<sup>[9]</sup> The precondition is that the business can wait a day.

Batch and caching discounts **can be combined**, though cache hits inside a batch are best-effort, and the batch guide suggests the 1-hour cache for shared context because batches can outlast the 5-minute lifetime.<sup>[9][10]</sup>

### Performance SLAs: what the platform does and does not promise

This is where Pro items set the most traps, because the honest answer is often "the platform does not promise that."

- **Rate limits are ceilings, not guarantees.** The rate-limits page says the limits are maximum allowed usage, **not guaranteed minimums**. They are enforced with a token bucket, so short bursts can trip them even under the per-minute figure.<sup>[11]</sup>
- **Only uncached input counts toward input-token limits** on most models, so caching raises effective throughput as well as cutting cost.<sup>[11]</sup>
- **A spend cap looks like an outage.** When an organization reaches its tier's monthly spend cap, requests return HTTP 429 with **no `retry-after` header**, and retries fail until access resumes. The `enforced_spend_limit_reached` error code tells it apart from a rate limit.<sup>[11]</sup> An availability design must monitor spend as well as errors.
- **Priority Tier is legacy.** Priority Tier capacity commitments are **no longer sold**. Existing commitments run to their end dates, and organizations that need guaranteed capacity are told to contact sales.<sup>[12]</sup> An answer that says "buy Priority Tier to meet the SLA" is out of date.
- **Fast mode** gives significantly faster output on Claude Opus 5.5 (and, in research preview, two other Opus models) at premium prices, and it is not available with the Batch API.<sup>[10]</sup>
- **US-only inference** (`inference_geo: "us"`) costs 1.1x on Claude 4.6 and later models.<sup>[10]</sup> A residency requirement is therefore also a cost line.

#### Turning an SLA into something you can operate

*General practice, not from Anthropic documentation.*

An SLA is a promise to a customer. Under it sits a service-level objective (SLO), the internal target, and under that a service-level indicator (SLI), the measurement. For an LLM feature, write SLIs that match what users feel: time to first token for chat, end-to-end completion time for pipelines, the share of requests that return a valid, policy-compliant result, and availability measured at your service boundary, not the provider's. Set the SLO tighter than the SLA so you have room to act. Track an error budget, and agree in advance what happens when it is spent, for example pausing prompt changes. Never promise a sponsor more availability than your dependencies, retries and fallbacks can support together.

### Reading the evidence

| Symptom | Likely cause |
|---|---|
| Sudden 429s with no `retry-after`, all at once, near month-end | Spend cap reached, not a rate limit |
| 429s in short bursts while the per-minute average is under the limit | Token-bucket enforcement of a short interval, or acceleration limits after a sharp traffic increase<sup>[11]</sup> |
| Cost per ticket fell, but escalations and reopen rates rose | The cost lever (often a model downsize) broke task fidelity |
| An overnight pipeline sometimes finishes after the morning deadline | Batch work with a hard deadline. Most batches finish within an hour, but up to 24 hours is possible<sup>[9]</sup> |

### Numbers worth knowing

| Fact | Value |
|---|---|
| Batch API discount | 50% on input and output<sup>[9]</sup> |
| Batch limits | 100,000 requests or 256 MB per batch. Expires if not done in 24 hours. Results available 29 days<sup>[9]</sup> |
| Claude Haiku 5.5 price (prompts up to 100,000 tokens) | $0.10 input / $0.50 output per million tokens. Higher rates above that prompt length<sup>[10]</sup> |
| Claude Sonnet 5.5 price | $2 input / $10 output per million tokens<sup>[10]</sup> |
| Claude Opus 5.5 price | $4 input / $20 output per million tokens. Fast mode $8 / $40<sup>[10]</sup> |
| Cache read multiplier | 0.1x base input on most models. 0.05x on Opus 5.5 and Sonnet 5.5<sup>[10]</sup> |
| US-only inference multiplier | 1.1x on Claude 4.6 and later<sup>[10]</sup> |

## Worked design review: triaging a logistics company's inbound email

**The system.** A logistics company receives about 40,000 customer emails a day. A small share are shipment exceptions (damaged goods, missed deliveries) that the contract says must reach the right team **within 15 minutes**. The rest need a drafted reply ready for an agent **by the next business morning**. The sponsor's goal is to cut cost per email by half while keeping the exception SLA.

**The flawed design.** The team proposes one agent on Claude Opus 5.5 with every tool (CRM read and write, shipment lookup, refund issuance), processing all mail. To hit the cost goal, it submits everything through the Batch API every evening. To protect the SLA, it adds an alert when an exception email is found more than 15 minutes after arrival.

**The constraint that decides.** Two workloads with opposite latency requirements are sharing one path. Exceptions have a 15-minute deadline. Replies have an overnight deadline. A batch can take up to 24 hours,<sup>[9]</sup> so batching exceptions breaks the contract. The alert only reports the breach after it happens (family 1).

**The better design.**

1. **Synchronous classification for everything.** As each email arrives (push, by webhook, so there is no polling delay<sup>[1]</sup>), a classification prompt on Claude Haiku 5.5 at low effort assigns an intent and an exception flag, with the label in its own tag for routing.<sup>[1]</sup> As rough arithmetic at list prices, 40,000 emails at about 1,500 input and 150 output tokens is about 60 million input and 6 million output tokens a day: about $6 plus $3.<sup>[10]</sup>
2. **Exceptions route immediately** to the right team with the shipment record attached by a read-only lookup tool.
3. **Reply drafting goes to the Batch API** on a mid-size model, with the shared instructions and policy text as a cached prefix. Batch pricing halves that spend, and caching cuts the repeated prefix further.<sup>[9][10]</sup>
4. **No write tools in the drafting step.** Drafts go to a human agent. Refunds stay with people or with a separate, narrowly scoped workflow.
5. **Success criteria agreed up front.** Exception recall (missed exceptions are the expensive error), routing accuracy against a labeled set, draft acceptance rate by human agents, and cost per email against the current baseline.<sup>[1][3]</sup>
6. **A production loop.** Misrouted emails that agents correct become new test cases, and the classification prompt is re-evaluated on that growing set before every change.

**Why the tempting alternatives lose.**

- **"Run everything synchronously on Opus 5.5 to be safe."** It meets the SLA but ignores the cost goal, the pillar the sponsor named (family 2).
- **"Batch everything and add the alert."** The alert is a compensating control for a design that breaks the SLA (family 1).
- **"Buy Priority Tier to guarantee the 15-minute SLA."** Priority Tier is no longer sold,<sup>[12]</sup> and capacity was never the problem. The batch path was (family 3).
- **"Use fast mode for the exception path."** Fast mode speeds up Opus output generation.<sup>[10]</sup> A short Haiku classification is not where the 15 minutes go. The delay was the overnight batch (family 3).
- **"Classify with a hierarchy of classifiers for accuracy."** With a handful of intents this adds calls and latency.<sup>[1]</sup> The guide suggests a hierarchy at around 20 or more categories.

## How wrong answers are built

- **"Add monitoring to catch SLA breaches."** Family 1. If the design makes the breach likely, monitoring only reports it. Change the path the latency-critical work takes.
- **"Move all traffic to the Batch API to halve cost."** Family 2 when any part of the traffic has a deadline shorter than 24 hours.
- **"Downsize to the smallest model across the board."** Family 2 when the stem sets an edge-case or reasoning-heavy accuracy target. Route instead.
- **"Purchase Priority Tier for guaranteed capacity."** Out of date. Commitments are no longer sold, so the route is to contact sales.<sup>[12]</sup>
- **"Rate limits guarantee our throughput."** They are maximums, not minimums.<sup>[11]</sup>
- **"The 429s mean we need to retry with backoff."** Family 4 when the stem says the responses carry no `retry-after` and arrive at month-end. That is the spend cap.
- **"Replace the existing classifier with Claude."** Family 3 when the stem describes stable categories, plentiful labels and no need for explanations.
- **"Put account balances in the retrieval index."** Live data needs a tool, not embeddings.<sup>[2]</sup>
- **"Move the workload to Managed Agents to reduce infrastructure."** Family 2 when the stem requires zero data retention or a HIPAA BAA.<sup>[6]</sup>
- **"Measure success by accuracy alone."** It answers the engineer's question, not the sponsor's. Pair task-level and business-level criteria.

## What to remember

- Decide whether an LLM fits, break the request into tasks, and write specific, measurable, multidimensional success criteria **before** building.
- Retrieval for large static knowledge. Tools for live data and actions.
- Messages API for control, Agent SDK for a proven loop in your process, Managed Agents for hosted long-running work. Managed Agents is not ZDR- or HIPAA-eligible.
- Name three feedback loops: runtime ground truth with stopping conditions, the evaluation loop, and production tracing plus human review.
- Every added call or classifier layer adds latency.
- Batch: 50% off, up to 24 hours. Caching: reads at 0.1x (0.05x on Opus 5.5 and Sonnet 5.5). They combine.
- Rate limits are ceilings, not guarantees. A spend-cap 429 has no `retry-after`. Priority Tier is no longer sold.
- Split workloads by deadline before choosing a cost lever.

## Endnotes for this chapter

1. The ticket-routing guide lists when to prefer an LLM over traditional ML, ties routing quality to category definitions, gives task-level and business-level success criteria with example targets, recommends Claude Haiku 5.5 at low effort for classification, describes extracting reasoning and intent from separate XML tags, warns that hierarchical classifiers add latency, and compares push and pull integration. Anthropic, "Ticket routing" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/use-case-guides/ticket-routing
2. The customer-support guide describes when to automate support, breaking an ideal interaction into tasks, separate task and business criteria, RAG for large static context, tools for real-time data, output guardrails, streaming to reduce perceived latency, trying prompts and tools before new layers, and the extra latency of an intent classifier. Anthropic, "Customer support agent" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/use-case-guides/customer-support-chat
3. Success criteria should be specific, measurable, achievable and relevant, usually multidimensional, and include latency and price. Evals should be task-specific, automated where possible, and favor volume over hand-graded quality. Anthropic, "Define success criteria and build evaluations" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/test-and-evaluate/develop-tests
4. The three build paths, the Messages API, the Agent SDK and Managed Agents, differ in how much control you keep and how much you offload. Anthropic, "Guides to common use cases" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/use-case-guides/overview
5. The Agent SDK embeds Claude Code's agent loop, tools, permissions, sessions and hooks in an application you operate. Anthropic, "Agent SDK overview" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/agent-sdk/overview
6. Managed Agents is a hosted harness for long-running, asynchronous, stateful work. Because sessions are stored server-side, it is not eligible for Zero Data Retention or HIPAA BAA coverage. Anthropic, "Claude Managed Agents overview" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/managed-agents/overview
7. Agents should gain ground truth from the environment at each step and use stopping conditions such as an iteration cap. Routing can send easy questions to smaller, cheaper models and hard ones to more capable models. Anthropic, "Building effective agents" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/research/building-effective-agents
8. Production tracing, human testing that caught source-quality bias, and rainbow deployments for stateful agents were key to running the Research system in production. Anthropic, "How we built our multi-agent research system" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/research/multi-agent-research-system
9. The Message Batches API gives a 50% discount, has per-batch limits of 100,000 requests or 256 MB, usually completes within an hour but expires at 24 hours, keeps results for 29 days, and supports best-effort prompt caching, with the 1-hour cache suggested for shared context. Anthropic, "Batch processing" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/batch-processing
10. Model prices, cache multipliers, the combination of batch and caching discounts, fast mode pricing and its unavailability with batch, and the 1.1x US-only inference multiplier. Anthropic, "Pricing" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/pricing
11. Rate limits are maximums rather than guaranteed minimums, use a token bucket, count only uncached input toward ITPM on most models, and differ from spend caps, which return 429 without `retry-after` and with `enforced_spend_limit_reached`. Anthropic, "Rate limits" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/api/rate-limits
12. Service tiers are legacy. Priority Tier capacity commitments are no longer sold, existing ones continue to their end date, and organizations that need guaranteed capacity should contact sales. Anthropic, "Service tiers" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/api/service-tiers
