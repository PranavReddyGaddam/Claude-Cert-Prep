# Chapter 8: Evaluation, Testing and Optimization

**Summary**: *An eval suite is the instrument every later decision is read from: whether a prompt change helped, whether a cheaper model is good enough, whether a cost cut broke quality. Build it early, from real failures, with graders matched to what can be checked. Then optimize, diagnose and monitor against it instead of against intuition.*

## Success criteria must be specific, measurable and multidimensional

*The decision*: what "working" means, in numbers, before anything is built or tuned.

Anthropic's evaluation guide asks for criteria that are **specific, measurable, achievable and relevant**. "Safe outputs" is a bad criterion. "Less than 0.1% of outputs out of 10,000 trials flagged for toxicity by the content filter" is a good one.<sup>[1]</sup> Most use cases need several criteria at once. The guide's sentiment example sets an F1 of at least 0.85 on a held-out set of 10,000 posts, 99.5% non-toxic outputs, a bound on how bad errors may be, and 95% of responses under 200 ms.<sup>[1]</sup> Its list of common criteria covers task fidelity, consistency, relevance and coherence, tone and style, privacy preservation, context utilization, latency and price.<sup>[1]</sup>

The metric families map onto concrete measures:

| Family | What to measure | Anthropic-documented examples |
|---|---|---|
| **Accuracy** | Task-level correctness against a reference or rubric, including edge cases | F1, exact match, routing accuracy on the first try, accuracy on an edge-case set (the routing guide aims for at least 80%)<sup>[1][3]</sup> |
| **Consistency** | Same input class, same answer | Cosine similarity across paraphrases. Routing consistency of 95% or more on standardized inputs<sup>[1][3]</sup> |
| **Latency** | Time to first token, total time, output tokens per second | TTFT and baseline latency. Agent evals track `time_to_first_token`, `output_tokens_per_sec`, `time_to_last_token`<sup>[4][2]</sup> |
| **Cost** | Cost per **completed task**, not per token | Cost per classification in the routing guide. Cost per solved task in Anthropic's model comparisons<sup>[3][5]</sup> |
| **Safety** | Rate of harmful or policy-violating outputs, handling of sensitive data | Toxicity rate over many trials. An LLM binary classifier that checks whether responses contain PHI<sup>[1]</sup> |
| **Fairness** | Performance gaps across user groups | Routing accuracy within 2–3% across customer groups<sup>[3]</sup> |

### Security metrics

*General practice, not from Anthropic documentation.*

Security is measured as resistance to an adversary, so it needs an adversarial test set rather than sampled traffic. Typical measures: attack success rate on a fixed prompt-injection suite (including instructions planted in documents and tool results), blocked disallowed tool calls, and data or system-prompt leakage. Track these as regression evals that must stay at or near zero, not as averages traded against helpfulness. The Agent SDK can export `safety_event` records showing which check refused a tool call.<sup>[18]</sup>

### Reliability needs a metric that punishes inconsistency

*Demystifying evals for AI agents* separates two metrics:<sup>[2]</sup>

- **pass@k**: the probability that at least one of k trials succeeds. It rises with k. Use it when one success is enough.
- **pass^k**: the probability that **all** k trials succeed. It falls with k. At a 75% per-trial rate, pass^3 is about 42%. Use it for customer-facing agents where every run must work.

An item that says "users expect the same correct result every time" is asking for pass^k.

## Evaluation datasets start small, real and balanced

*The decision*: which tasks go in the suite, and how each one is graded.

Anthropic's guidance on building the first dataset is concrete:<sup>[2]</sup>

1. **Start early with 20–50 tasks drawn from real failures.** Early changes have large effects, so small samples show them. The research-system team started with **about 20 queries** for the same reason.<sup>[6]</sup>
2. **Start from what you already test by hand**, plus the bug tracker and support queue, prioritized by user impact.
3. **Write unambiguous tasks with a reference solution.** A good task is one where two domain experts would reach the same pass/fail verdict. With frontier models, **0% pass@100 usually means the task is broken**, not that the agent cannot do it.
4. **Balance the set.** Test where a behavior should happen and where it should not. Anthropic's web-search evals for Claude.ai needed both "should search" and "should answer from knowledge" queries, or the model learned to search for almost everything.

The platform guide adds three principles: **be task-specific** (mirror real traffic and include edge cases), **automate when possible**, and **prioritize volume over quality**.<sup>[1]</sup>

### Capability suites and regression suites do different jobs

| Suite | Question | Expected pass rate | Lifecycle |
|---|---|---|---|
| **Capability ("quality")** | What can the agent do well? | Starts low. A hill to climb | Graduates to regression once saturated<sup>[2]</sup> |
| **Regression** | Does it still do what it used to? | Close to 100% | Runs continuously. Any drop means something broke<sup>[2]</sup> |

A saturated eval gives no signal for improvement. Replace or harden it.<sup>[2]</sup>

### Mixed methods: pick the cheapest grader that is reliable for each check

| Grader | Strengths | Weaknesses | Use for |
|---|---|---|---|
| **Code-based** (exact or regex match, unit tests, static analysis, state checks, tool-call checks) | Fast, cheap, objective, reproducible | Brittle to valid variations, lacks nuance | Anything with a checkable outcome: a database row exists, tests pass, the label matches |
| **Model-based** (rubrics, natural-language assertions, pairwise comparison, reference-based) | Flexible, scalable, handles open-ended output | Non-deterministic, costs more, **must be calibrated against humans** | Tone, completeness, groundedness, synthesis quality |
| **Human** (SME review, spot checks, A/B, inter-annotator agreement) | Gold standard. Calibrates model graders | Slow, expensive | Calibration, subjective or high-stakes domains |

The table follows *Demystifying evals*.<sup>[2]</sup> The platform guide gives the same order of preference: code-based grading first, LLM grading once you have tested that it is reliable, and human grading only where needed.<sup>[1]</sup>

For **LLM-as-judge** graders, the documented practices are:

- Use detailed, clear rubrics and an empirical output ("correct"/"incorrect" or a 1–5 score).
- Let the grader reason first (thinking on).<sup>[1]</sup>
- Give the judge a way out, such as returning "Unknown" when it lacks information.
- Grade each rubric dimension with its own isolated judge when one judge grading everything is inconsistent.<sup>[2]</sup>

Anthropic's research-system team reported the opposite result for its own task: **a single judge call** that output 0.0–1.0 scores plus pass/fail was the most consistent and the closest to human judgment.<sup>[6]</sup> The lesson is not a rule about judge count. Validate the judge against human labels and keep whichever design agrees with them.

### Agent evals grade outcomes, not paths

An agent eval has its own vocabulary:<sup>[2]</sup>

- **Task**: a test with defined inputs and success criteria.
- **Trial**: one attempt at a task.
- **Grader**: logic that scores some aspect of the run.
- **Transcript**: the full record of a trial.
- **Outcome**: the final state of the environment. "Your flight has been booked" in the transcript is not the outcome. A reservation in the database is.
- The **evaluation harness** runs the eval. The **agent harness** is part of what you are evaluating.

Four design rules follow:<sup>[2]</sup>

- **Grade what the agent produced, not the exact tool sequence.** Agents find valid paths that eval designers did not foresee, and rigid step checks penalize them. 
- **Give partial credit** on multi-part tasks.
- **Isolate trials.** Leftover files, caches or shared git history cause correlated failures or inflated scores.
- **Read transcripts.** That is how you tell a real agent mistake from a grader that rejected a valid answer. Anthropic cites a benchmark score that went from 42% to 95% once grading bugs, ambiguous specs and a constraining scaffold were fixed.


## Automated evals are one layer of several

*Demystifying evals* compares six methods. Each catches what the others miss. It uses the Swiss cheese model to make the point.<sup>[2]</sup>

| Method | Best at | Blind spot |
|---|---|---|
| Automated evals | Every commit and model upgrade, before users see it | False confidence if tasks do not match real usage |
| Production monitoring | Real behavior and drift at scale | Reactive. Lacks ground truth |
| A/B testing | Real user outcomes with confounds controlled | Slow, needs traffic, says little about *why* |
| User feedback | Problems you did not anticipate | Sparse, self-selected, skews severe |
| Manual transcript review | Intuition, subtle quality issues | Does not scale |
| Systematic human studies | Gold-standard judgments, grader calibration | Expensive, slow |

Use automated evals before launch and in CI, monitoring after launch, A/B tests for significant changes, and weekly transcript sampling.<sup>[2]</sup>

## A/B tests confirm with users what evals predicted offline

*The decision*: when a change needs live validation, and how to roll it out without hurting users.

Anthropic's own guidance is about where A/B testing fits more than how to run one:

- A/B testing measures actual user outcomes and controls for confounds. It is slow (days or weeks to significance), needs enough traffic, and tests only changes you deploy.<sup>[2]</sup>
- Before cutting over to a new model or configuration, **run the winner in shadow on a slice of traffic**, then keep the eval suite running.<sup>[5]</sup>
- Stateful agents need careful deployment. Anthropic uses **rainbow deployments**, shifting traffic gradually from old to new versions while both run, so in-flight agents are not broken.<sup>[6]</sup>
- When comparing configurations such as effort levels, run each in **a separate session**. Changing top-level effort mid-session invalidates the cache and distorts the cost comparison.<sup>[5]</sup>
- Engineer for quality first and reduce latency afterwards.<sup>[4]</sup>

### Running the experiment

*General practice, not from Anthropic documentation.*

- **Fix one primary metric and a few guardrail metrics before launch** (for example, resolution rate as primary, with escalation rate, latency p95 and cost per conversation as guardrails). Decide the ship rule in advance.
- **Size the test from the minimum effect you care about.** Small effects need large samples. *Demystifying evals* makes the same point offline: mature agents need larger evals to detect smaller effects.<sup>[2]</sup>
- **Randomize by user or account, not by request**, so one person does not see two behaviors in one conversation. Keep assignment sticky.
- **Do not stop early when the curve looks good.** Repeated peeking inflates false positives unless the test is designed for sequential analysis.
- **Ramp gradually** (for example 1%, then 10%, then 50%), with automatic rollback on a guardrail breach.
- **Pair online and offline signals.** When an A/B result moves, pull transcripts from both arms to learn why. A/B testing alone gives little signal on the cause.<sup>[2]</sup>

## Diagnosis separates prompt, grounding, model and retrieval failures

*The decision*: which layer failed, judged from the evidence the stem gives about what changed and what stayed the same.

Start with three questions. What changed (prompt, model ID, effort, documents, tools, traffic)? What did not change? Is the failure in **every** case of a type, or random? Then match the symptom:

| Evidence | Likely cause | Fix |
|---|---|---|
| Fails on one class of inputs every time. Instructions never mention that case | **Prompt failure**: ambiguity or a policy gap | Specify the case, add examples, add it to the eval set<sup>[1]</sup> |
| After a model upgrade, cost per task rose and accuracy did not. Prompt says "verify twice", "be maximally thorough" | **Stale prompt written for an older model**. Newer models follow it literally | Audit prompts against the current model. Anthropic measured lower cost, and in one migration higher accuracy, after removing such text<sup>[5]</sup> |
| Confident statements not supported by the provided documents | **Hallucination / weak grounding** | Allow "I don't know", quote first, require a supporting quote per claim, use citations<sup>[15]</sup> |
| Correct documents were never in the context | **Retrieval failure**, not the model | Fix the index or retriever (see [Chapter 6](/ccar-p/read/pro-notes/06-retrieval-augmented-generation))<sup>[22]</sup> |
| Answers shallower after moving from Claude Opus 5 to Claude Opus 5.5 with no `effort` set | **Default changed**: Opus 5.5 defaults to `medium`, Opus 5 to `high`, so the request runs one level lower | Run an effort sweep on your evals and set effort explicitly<sup>[10]</sup> |
| Per-request cost rose about 30% after moving to a Claude 4.7-or-later model. Same prompts | **New tokenizer**: same text, roughly 30% more tokens | Compare per solved task, not per token. Recount prompts with the new model ID<sup>[7][21]</sup> |
| Responses end mid-sentence. `stop_reason: "max_tokens"` | **Output cap**, not a quality problem | Raise `max_tokens` (Anthropic suggests 64,000 for agentic work) and treat the cap as a failure<sup>[5][14]</sup> |
| HTTP 200 but no usable answer. `stop_reason: "refusal"` | **Refusal by safety classifiers** | Read `stop_details`, retry on a fallback model<sup>[14]</sup> |
| Behavior shifted slightly on a pinned model ID | **Serving-infrastructure update**. Weights do not change for an ID | Investigate infrastructure, not "silent model updates". New versions ship under new IDs<sup>[12]</sup> |
| Claude calls tool A when B was intended | **Tool description ambiguity** | Say *when* to use each tool, not only what it does<sup>[16]</sup> |
| 429s after a sudden traffic jump. 529s at busy times | **Acceleration limits** (429) or **API-wide overload** (529) | Ramp traffic gradually. Retry with backoff<sup>[17]</sup> |
| Eval score low, transcripts show valid answers | **Grader bug** or ambiguous task | Fix the eval before the agent<sup>[2]</sup> |

If the stem says the model ID did not change, "the model silently changed" is wrong: IDs are pinned snapshots.<sup>[12]</sup> If it says the documents were refreshed and nothing else changed, the answer is in the retrieval layer. Deprecations are announced, not silent. Anthropic gives at least 60 days' notice before retiring a publicly released model and recommends testing replacements well before the date.<sup>[13]</sup>

## Optimization lowers cost per task without moving the quality bar

*The decision*: which lever to pull, in which order, while the eval suite holds quality constant.

Anthropic's cost guide orders the levers. Free ones come first: prompt caching and trimming tokens. Then batch what can wait, audit prompts against the current model, upgrade the model, tune effort, and only then combine models.<sup>[5]</sup>

### Caching is the first lever for any repeated prefix

Prompt caching matches a byte-exact prefix in the order tools → system → messages. A change anywhere invalidates everything after it.<sup>[9]</sup> Multipliers:<sup>[7][9]</sup>

- A 5-minute cache write costs **1.25x** the input price. A 1-hour write costs **2x**.
- A cache read costs **0.1x** (0.05x on Claude Opus 5.5 and Claude Sonnet 5.5, 0.025x on Claude Fable 5.1 and Claude Mythos 5.1).
- The default lifetime is 5 minutes, measured from the start of the request, and each use refreshes it.

At standard multipliers, caching pays off after one read for the 5-minute cache, or after two for the 1-hour cache.<sup>[7]</sup> Over a day of real traffic, agent loops read a **median 84%** of their input from cache. Anthropic advises that **below about 80%**, something is breaking the cache.<sup>[5]</sup> The classic breaker is per-request text (a timestamp, a queue position) placed ahead of the stable prefix.<sup>[5]</sup> Changing tool definitions, the system prompt, effort, thinking settings or speed also invalidates the cache.<sup>[9]</sup> Prompts below the model's minimum cacheable length are processed uncached **without an error**. Both cache usage fields read 0.<sup>[9]</sup>

### Batch, effort and routing trade time or capability for money

| Lever | What it buys | What it costs | Fits |
|---|---|---|---|
| **Message Batches API** | **50% off** all input and output tokens. Stacks with caching discounts | Results within 24 hours (most batches finish in under an hour). No streaming, no fast mode | Evals, backfills, nightly enrichment, moderation queues<sup>[8]</sup> |
| **Lower effort** | Fewer tokens across text, tool calls and thinking | Some capability, depending on the task | Routine or latency-sensitive work once evals show quality holds<sup>[10]</sup> |
| **Low effort, re-run failures at high** | About 40% lower cost than all-`high` at the same pass rate in Anthropic's test | Needs a reliable failure signal. Failures take two runs of wall-clock time | Checkable outputs: tests, validators<sup>[5]</sup> |
| **Smaller model** | Lower price per token and latency | Capability on hard cases | High-volume work with checkable outputs. Anthropic suggests trying Claude Haiku 5.5 first there<sup>[5]</sup> |
| **Advisor or orchestrator pairings** | Frontier capability only where needed | Complexity. Gains only if the executor actually consults, or the work truly splits | Only when they beat the single model's whole score-vs-cost curve<sup>[5]</sup> |
| **Fast mode** (`speed: "fast"`) | Up to 2.5x output tokens per second, same model | Premium price (twice standard on Claude Opus 5.5). No gain in TTFT. Not with batch | Interactive output-heavy work where speed is worth paying for<sup>[5][11]</sup> |

Two cost rules recur in exam stems:

- **Compare models on cost per completed task.** A failed task still bills its tokens, then its retry. Price the hardest tenth of the workload, not the median.<sup>[5]</sup>
- **Output tokens are expensive twice.** They cost five times input on current models. In an agent loop, each one comes back as input on every later turn. Asking for shorter answers cut cost about 13% in Anthropic's test.<sup>[5]</sup>

### Latency levers are different from cost levers

For latency, the documented levers are a faster model and effort level (Claude Haiku 5.5 at `low` is the fastest option), fewer prompt and output tokens, streaming for perceived speed, caching long prefixes for time to first token, and fast mode for output throughput.<sup>[4][5][9][11]</sup> Fast mode does not improve TTFT. Streaming improves perceived speed, not total time. Batch makes latency worse in exchange for price.

### Numbers worth knowing

| Figure | Value |
|---|---|
| Batch discount and window | 50% off. Results within 24 hours. Up to 100,000 requests or 256 MB per batch. Results kept 29 days<sup>[8]</sup> |
| Claude Opus 5.5 list price | $4 / MTok input, $20 / MTok output. Batch $2 / $10<sup>[7]</sup> |
| Claude Haiku 5.5 list price | $0.10 / $0.50 per MTok up to 100,000-token prompts. $0.50 / $2.50 above<sup>[7]</sup> |
| Tokenizer on Claude 4.7 and later | About 30% more tokens for the same text<sup>[7]</sup> |
| Token counting | Free, separately rate-limited, returns an estimate<sup>[21]</sup> |

## Monitoring needs traces, cost data and the eval suite running in production

*The decision*: what to log, where authoritative numbers come from, and how to see inside a non-deterministic agent.

Anthropic's research team found that users reported agents "not finding obvious information," and nobody could tell whether the cause was bad queries, poor sources or tool failures until they **added full production tracing**. They also monitor agent decision patterns and interaction structure **without monitoring the contents of individual conversations**.<sup>[6]</sup>

For agents built on the Agent SDK, telemetry is OpenTelemetry:<sup>[18]</sup>

- **Three signals**, each enabled separately. **Metrics** cover tokens, cost, sessions and tool decisions. **Log events** cover prompts, API requests, errors and tool results. **Traces** (beta) produce spans for each interaction, model request, tool call and hook.
- Telemetry is **off until `CLAUDE_CODE_ENABLE_TELEMETRY=1`** is set and an exporter is chosen. **Export errors fail silently** by default, so verify that the collector actually receives data.
- Subagent spans **nest under the parent's tool span**, so a delegation chain is one trace. W3C trace context from your application is propagated, so the agent run appears inside your service's trace.
- Content is **not recorded by default**. Prompt text, tool arguments and tool output each need an opt-in variable, which is a privacy decision.
- In a multi-tenant service, **inject end-user and tenant IDs as resource attributes** for a per-user audit trail.

Cost monitoring has an authority rule. The SDK's `total_cost_usd` is a **client-side estimate** from a bundled price table and can drift. Use it for development insight, and use the **Usage and Cost Analytics API** or the Console for billing and financial decisions.<sup>[19]</sup> That API breaks down usage and cost by model, workspace, API key, service tier and identity, in daily, hourly or per-minute buckets.<sup>[20]</sup> For per-request health, the `usage` fields (`input_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`, output tokens) are what a cache-hit-rate dashboard is built from.<sup>[9]</sup>

## Worked design review: a claims-summary agent that got cheaper and worse

**The system.** An insurer runs an agent that reads each new claim file, pulls policy terms through a tool, and writes a summary with a coverage recommendation for adjusters. It runs on Claude Opus 5 at `high`, about 30,000 claims a day, mostly overnight. Finance asks for a 50% cost cut.

**The flawed change.** The team switched to Claude Haiku 5.5, set `max_tokens: 2048` to "cap spend," and checked ten summaries by eye. Two weeks later adjusters report wrong coverage calls on multi-policy claims, about 8% of runs end with `stop_reason: "max_tokens"`, and the bill fell less than projected.

**The constraint that decides.** Coverage recommendations must stay at least as accurate as before. Cost is the goal, and accuracy is the guardrail.

**The better design.**

1. **Build the instrument first.** Collect 50 real claims, weighted toward past complaints and multi-policy cases. Give each a reference coverage call and grade it in code. Grade summary quality with a rubric judge calibrated against adjuster labels. Track cost per **completed** claim.<sup>[2][5]</sup>
2. **Take the free levers.**
   - Cache the system prompt and tool definitions, and keep per-claim text after the breakpoint.<sup>[5][9]</sup>
   - Move overnight volume to the **Batch API** for 50% off. Nobody waits for those results.<sup>[8]</sup>
   - Audit the prompt for instructions written for an older model.<sup>[5]</sup>
3. **Sweep tiers and effort on the suite**, each configuration in its own session: Claude Opus 5.5 at `low` and `medium`, Claude Sonnet 5.5, Claude Haiku 5.5. Plot score against cost per completed claim.<sup>[5]</sup>
4. **Route by difficulty if the curve supports it.** Single-policy claims go to the cheapest configuration that passes. Multi-policy claims go to the stronger one. Or run low effort everywhere and re-run failed validations at higher effort.<sup>[5]</sup>
5. **Raise `max_tokens`.** The truncated runs were billed and then discarded. On Claude Haiku 5.5, thinking counts toward the cap.<sup>[5]</sup>
6. **Ship in shadow** on a slice of claims, then ramp. Keep the regression suite and traces running.<sup>[5][18]</sup>

**Why the tempting alternatives lose.**

- *"Keep Haiku and add a human check on every recommendation."* That compensates for a mismatch the suite can measure and route around, and the labor cost erases the saving. Family 1.
- *"Keep the low `max_tokens` to control spend."* The cap does not make the model economize. It throws away billed work. Family 2.
- *"Lower the temperature to fix the coverage errors."* Nothing points to sampling. Hard cases exceed the model's capability. Family 3.
- *"Haiku must have been updated, since errors started recently."* The errors started when the team switched models. That is the change to follow. Family 4.
- *"Ten summaries looked fine, so the eval passed."* Ten unweighted samples miss the multi-policy tail where the cost of failure sits.<sup>[5]</sup>

## How wrong answers are built

- **"Add monitoring to catch bad answers in production."** Monitoring is reactive. If the failure can be tested offline, build the eval and gate releases on it. (Family 1)
- **"Check that the agent calls tools in exactly this order."** Grade outcomes. Rigid path checks punish valid solutions. (Family 3)
- **"Use pass@k to show the support bot is reliable."** Consistency needs pass^k. (Family 3)
- **"Trust the LLM judge's scores as they are."** Model graders need calibration against human labels. (Family 1)
- **"Compare the models on price per million tokens."** Compare cost per completed task. Newer tokenizers and retries make per-token prices misleading. (Family 3)
- **"Downsize to the smallest model to hit the budget."** Batch, caching and effort often reach the target without moving the quality bar. Downsizing must pass the suite. (Family 2)
- **"Lower `max_tokens` to cut cost."** Truncated responses are billed and wasted. Use effort and shorter-answer instructions. (Family 2)
- **"The provider silently updated the model."** Model IDs are pinned. Look for what did change: effort default, prompt, documents, tokenizer, tools. (Family 4)
- **"Use fast mode to reduce time to first token."** Fast mode raises output throughput, not TTFT, and it costs more. (Family 3)
- **"Bill customers from the SDK's `total_cost_usd`."** It is an estimate. Use the Usage and Cost Analytics API. (Family 3)

## What to remember

- Criteria are specific and measurable, and they cover accuracy, latency, cost, safety and security together. Safety can be quantified ("<0.1% flagged over 10,000 trials").
- pass@k for "one success is enough". pass^k for "every run must work".
- Start with 20–50 real failures. Use unambiguous tasks with reference solutions and balanced positive and negative cases. 0% pass@100 suggests a broken task.
- Graders: code where checkable, calibrated LLM judges where nuanced, humans for calibration. Grade outcomes and read transcripts.
- A/B tests confirm with real users. Shadow first, ramp gradually, set metrics in advance (general practice for the statistics).
- Diagnose from what changed: prompt, grounding, retrieval, model or effort default, tokenizer, caps, tools. Pinned model IDs do not silently change.
- Optimization order: cache and trim, batch, audit prompts, upgrade, tune effort, then multi-model. Judge everything on cost per completed task.
- Batch is 50% off within 24 hours. Cache reads are 0.1x (0.05x on Opus 5.5 and Sonnet 5.5). A cache read share below ~80% means something is breaking the cache.
- Monitoring uses OTel metrics, events and traces. It is off by default, export errors are silent, and content capture is opt-in. Bill from the Usage and Cost API, not SDK estimates.

## Endnotes for this chapter

1. Success criteria (specific, measurable, achievable, relevant), the safety and multidimensional examples, common criteria, eval design principles, grader types and their order of preference, and tips for LLM-based grading. Anthropic, "Define success criteria and build evaluations" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/test-and-evaluate/develop-tests
2. Eval vocabulary, the three grader types, capability versus regression evals, pass@k and pass^k, the roadmap (20–50 tasks, unambiguous tasks, balanced sets, isolated trials, outcome grading, partial credit, transcript reading, saturation), per-agent-type evals, and the comparison of automated evals, monitoring, A/B testing, feedback, transcript review and human studies. Anthropic, "Demystifying evals for AI agents" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/research/demystifying-evals-for-ai-agents
3. Routing evaluation criteria (consistency, edge-case accuracy, bias within 2–3%, explainability), accuracy and cost-per-classification thresholds, and the latency cost of multi-stage classifiers. Anthropic, "Ticket routing" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/use-case-guides/ticket-routing
4. Latency terms (baseline, TTFT), the advice to engineer for quality before reducing latency, and the model, token-trimming and streaming levers. Anthropic, "Reducing latency" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-latency
5. Lever ordering, cache read shares, cache breakers, batching unattended work, prompt audits after model changes, cost per completed task, effort sweeps in separate sessions, re-running failures at higher effort, `max_tokens` guidance, output token costs, advisor and orchestrator conditions, fast mode pricing on Claude Opus 5.5, and the four-step measurement method including shadow runs. Anthropic, "Optimizing for cost and intelligence" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence
6. Starting with about 20 queries, outcome-focused evaluation, the single-call LLM judge result, human testing, production tracing without monitoring conversation contents, and rainbow deployments. Anthropic, "How we built our multi-agent research system" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/research/multi-agent-research-system
7. Model and batch prices, cache multipliers and break-even, the newer tokenizer's roughly 30% more tokens, and long-context pricing. Anthropic, "Pricing" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/pricing
8. The Message Batches API's 50% discount, 24-hour window, size limits, 29-day result retention, and unsupported parameters (streaming, fast mode). Anthropic, "Batch processing" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/batch-processing
9. Prefix hierarchy, lifetime and refresh, what invalidates the cache, silent no-cache below the minimum length, and usage fields for tracking. Anthropic, "Prompt caching" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/prompt-caching
10. Effort levels, what effort affects, and per-model defaults including `medium` on Claude Opus 5.5 and Claude Haiku 5.5 versus `high` on Claude Opus 5. Anthropic, "Effort" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/effort
11. Fast mode's up to 2.5x output tokens per second, premium pricing, and gains focused on output speed rather than TTFT. Anthropic, "Fast mode" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/fast-mode
12. Model IDs are pinned snapshots, and serving-infrastructure updates are the likely cause of minor behavior differences on a stable ID. Anthropic, "Model IDs and versioning" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions
13. Lifecycle states, at least 60 days' notice before retirement, and testing replacements early. Anthropic, "Model deprecations" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/model-deprecations
14. Stop reason values and handling, including `max_tokens`, `refusal` as an HTTP 200 response, and `model_context_window_exceeded`. Anthropic, "Stop reasons and fallback" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons
15. Hallucination reduction: allowing uncertainty, quote-first grounding, citation-based verification, and restricting answers to provided documents. Anthropic, "Reduce hallucinations" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
16. Symptom-to-fix tables for wrong tool selection, cache invalidation and instructions delivered inside tool results. Anthropic, "Troubleshooting tool use" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/agents-and-tools/tool-use/troubleshooting-tool-use
17. HTTP error types, including 429 acceleration limits and 529 overload. Anthropic, "Claude API errors" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/api/errors
18. OpenTelemetry metrics, log events and traces from the Agent SDK, enablement, silent export failures, span nesting, trace-context propagation, opt-in content capture, end-user attribution, and security events. Anthropic, "Observability with OpenTelemetry" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/agent-sdk/observability
19. `total_cost_usd` is a client-side estimate. Authoritative billing comes from the Usage and Cost API or the Console. Anthropic, "Track cost and usage" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/agent-sdk/cost-tracking
20. Usage and cost reporting by model, workspace, API key, service tier and identity, in time buckets. Anthropic, "Usage and Cost Analytics API" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/manage-claude/usage-cost-analytics-api
21. Token counting is free, separately rate-limited and an estimate. Counts from models before Claude Opus 4.7 should not be reused. Anthropic, "Token counting" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/token-counting
22. Retrieval failures measured as missed relevant chunks, and the techniques that reduce them. Anthropic, "Introducing Contextual Retrieval" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/research/contextual-retrieval
