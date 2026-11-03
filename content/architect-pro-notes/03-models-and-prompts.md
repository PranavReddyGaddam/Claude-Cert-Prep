# Chapter 3: Models and Prompts as Design Decisions

**Summary**: *Choosing a model, writing a system prompt and picking a prompting technique are three separate decisions, judged on the same scale: cost per completed task at the quality the business needs. Tune effort before you switch models. Put guarantees in API features and code, not in prompt wording. Choose zero-shot, few-shot or reasoning by what each one buys on your evals.*

## Model choice is a cost-per-completed-task decision, made after tuning effort

### The decision

An architect picks a model tier, an effort level and sometimes a speed setting, for each step of a system rather than for the system as a whole. A Pro item rarely asks "which model is smartest." It asks which configuration meets a stated quality bar inside a stated latency or cost limit, and which knob to turn when one of them moves.

The current lineup, as the models overview lists it:<sup>[1]</sup>

| | Claude Fable 5.1 | Claude Opus 5.5 | Claude Sonnet 5.5 | Claude Haiku 5.5 |
|---|---|---|---|---|
| Positioned for | Demanding reasoning, long-horizon agentic work | Long-running agentic coding and knowledge work | Best speed–intelligence balance | High-volume, latency-sensitive classification, extraction, routing |
| Comparative latency | Slower | Moderate | Fast | Fastest |
| Input / output per MTok | $10 / $50 | $4 / $20 | $2 / $10 | From $0.10 / from $0.50 |
| Default effort | `high` | `medium` | `high` | `medium` |
| Thinking | Adaptive, always on | Adaptive, always on | Adaptive | Adaptive |
| Context / max output | 1M / 128K | 1M / 128K | 1M / 128K | 1M / 128K |

Two pricing details change answers. **Claude Haiku 5.5 is priced by prompt length**: up to 100,000 prompt tokens it costs $0.10 / $0.50, and over that it costs $0.50 / $2.50. Cache reads and writes count toward that length.<sup>[2]</sup> And Claude 4.7 and later models use a newer tokenizer that produces **about 30% more tokens for the same text**, so comparing per-token prices across generations misleads.<sup>[2]</sup>

Anthropic's own guidance says to start most workloads on Claude Opus 5.5, start efficiency-first on Haiku 5.5 for prototyping, tight latency and high-volume simple tasks, and move to Fable 5.1 only when evals at `xhigh` or `max` effort on Opus 5.5 still fall short.<sup>[3]</sup> The same page says **tuning effort is often a better lever than switching models**.<sup>[3]</sup>

### Effort is the first knob, model tier is the second

Effort controls how many tokens Claude spends on the whole response: text, tool calls and thinking. Lower effort means fewer and terser tool calls as well as less thinking.<sup>[4]</sup> It is a behavioral signal, not a hard budget. `max_tokens` is the hard ceiling.<sup>[4]</sup> Setting effort to the model's default behaves exactly like omitting it.<sup>[4]</sup>

Anthropic's measurements make the trade concrete.<sup>[5]</sup>

| Configuration (SWE-bench Pro subset) | Tasks solved | Cost per solved task |
|---|---|---|
| Sonnet 5.5 at `high` (default) | 87.6% | $0.11 |
| Opus 5.5 at `low` | 87.4% | $0.12 |
| Opus 5.5 at `medium` (default) | 92.8% | $0.22 |
| Fable 5.1 at `high` (default) | 92.3% (single run) | $1.19 |

Read the table as an architect. Opus 5.5 at its default matched Fable 5.1 for about a fifth of the cost. Opus 5.5 at `low` landed where Sonnet 5.5 at its default did. The page's rule is to **compare on cost per completed task, not per token**, and to **price the tail of your workload**, because a task the cheaper model fails still bills its tokens, then the retry, then the downstream cost.<sup>[5]</sup>

When outcomes are checkable, a mixed policy beats any fixed setting. Running everything at `low` and re-running only the failures at `high` solved about 97% of tasks for about $0.17 each, against 95.3% for $0.29 with everything at `high`.<sup>[5]</sup> It needs a reliable failure signal and costs extra wall-clock time on the failures.

### Options ranked by constraint

| When this dominates | Prefer | Why the alternatives lose |
|---|---|---|
| **Cost**, quality already fine | Lower effort on the current model | Switching tiers changes prompts, behavior and evals at once; effort changes one variable<sup>[5]</sup> |
| **Cost**, work no one waits for | Batch API (50% off input and output) | Results can take up to 24 hours; fine for backfills and evals, wrong for chat<sup>[2]</sup><sup>[5]</sup> |
| **Cost**, checkable output, high volume | Haiku 5.5 first | On GPQA Diamond it scored 85% against 91% for Opus 5.5, at about a twentieth of the cost per correct answer<sup>[5]</sup> |
| **Latency**, user reads a long answer | Fast mode on Opus 5.5 | Up to 2.5x output tokens per second; does not improve time to first token<sup>[6]</sup> |
| **Latency**, first token matters | Smaller model, lower effort, shorter prompts and outputs, streaming<sup>[7]</sup>, `display: "omitted"` | Fast mode targets output speed, not TTFT<sup>[6]</sup>; omitting thinking display speeds first text but not cost<sup>[8]</sup> |
| **Quality**, Opus 5.5 at high effort still short | Fable 5.1 | On the measured coding subset it cost about five times Opus 5.5 per solved task for a similar score, so it is the last step, not the first<sup>[3]</sup><sup>[5]</sup> |
| **Work larger than one context window** | Orchestrator with lower-cost workers | Lowering effort cannot help when the bill is the reading itself<sup>[5]</sup> |

**Fast mode** runs the same model with a faster inference configuration and no change in intelligence. On Opus 5.5 it costs $8 / $40 per MTok, twice the standard price. It is not available with the Batch API or a Priority Tier commitment, and it has its own rate limit.<sup>[6]</sup> Switching speed mid-conversation misses the prompt cache.<sup>[5]</sup>

**Thinking** on current models is adaptive: Claude decides when and how deeply to think, steered by effort. On Opus 5.5 and Fable 5.1 it cannot be turned off. Sonnet 5.5's lowest setting is `between_tools`, and Haiku 5.5 accepts `disabled` at `high` effort or below.<sup>[8]</sup> Thinking tokens are billed as output tokens and count toward `max_tokens`, even when the thinking text is not returned.<sup>[8]</sup> Manual extended thinking with `budget_tokens` belongs to older models. It is deprecated on Opus 4.6 and Sonnet 4.6 and rejected on later models.<sup>[1]</sup><sup>[9]</sup>

### Combining models pays only in two shapes

The pricing guide compares two multi-model patterns.<sup>[5]</sup>

- **Advisor**: a cheaper executor runs the loop and consults a frontier model on hard decisions. It helps only when the executor actually consults. Where consults were rare, the pairing scored within noise of the executor alone, or lower.
- **Orchestrator**: a frontier model plans and delegates bulk work to cheaper workers. It saved money for routine work with a long cost tail and for work larger than one context window. For one dependent chain that fits in context, the orchestrator's model alone at lower effort came out ahead.

The order is fixed: sweep effort on one model first, then price the stronger model alone at low effort, and build a pairing only if it beats that single model's whole score-versus-spend curve.<sup>[5]</sup> Pattern selection is covered in [Chapter 2](/ccar-p/read/pro-notes/02-choosing-the-pattern).

### Reading the evidence

| Symptom | Likely cause |
|---|---|
| After moving to Opus 5.5, requests return 400 | `temperature`/`top_p`/`top_k`, a prefilled assistant turn, `budget_tokens`, `thinking: disabled` or forced `tool_choice` left in the code<sup>[10]</sup> |
| Same prompts on Opus 5.5 cost less but score slightly lower than on Opus 5 | Default effort dropped from `high` to `medium`; set effort explicitly and re-run the sweep<sup>[10]</sup> |
| A newer model "costs more" in a per-token spreadsheet | Tokenizer produces about 30% more tokens; compare per completed task<sup>[2]</sup><sup>[5]</sup> |
| Haiku 5.5 responses end before any text | Thinking is on by default and counts toward a small `max_tokens`<sup>[5]</sup> |
| Attempts end with `stop_reason: max_tokens` | Cap too low for agentic turns; Anthropic suggests 64,000 for agentic work<sup>[5]</sup> |
| Fast mode turned on, users still wait for the first word | Fast mode raises output speed, not time to first token<sup>[6]</sup> |
| Haiku 5.5 agent skips a search or stops early | Long agent prompt at `low` effort; raise to `medium` or `high`<sup>[4]</sup> |

### Numbers worth knowing

- Batch API: 50% off input and output; stacks with caching.<sup>[2]</sup>
- Fast mode: up to 2.5x output speed; Opus 5.5 at $8 / $40.<sup>[6]</sup>
- Output tokens cost five times input on Haiku 5.5, Sonnet 5.5, Opus 5.5 and Fable 5.1.<sup>[5]</sup>
- All four current models: 1M context, 128K max output (300K on the Batches API with a beta header for Opus 5.5, Sonnet 5.5 and Haiku 5.5).<sup>[1]</sup>
- Non-default `temperature`, `top_p` or `top_k` return a 400 on all current models.<sup>[8]</sup>

## A system prompt is a role at the right altitude, and guarantees live outside it

### The decision

The architect decides what goes in the system prompt, what goes in a per-request template, and what is enforced by an API feature or by code. The recurring Pro trap is a requirement written as prompt text when a mechanism could make the failure impossible.

### Write the prompt at the right altitude

Anthropic's context-engineering article describes two failure modes. One hard-codes brittle if-else logic into the prompt. The other gives vague guidance that assumes shared context. The target is in between: **specific enough to guide behavior, flexible enough to give the model strong heuristics**.<sup>[11]</sup> The article recommends starting with a minimal prompt on the best available model, then adding instructions and examples only for failure modes found in testing. Minimal does not mean short.<sup>[11]</sup>

The prompting guide adds the working habits:<sup>[12]</sup>

- **Give a role** in the system prompt. Even one sentence focuses tone and behavior.
- **Explain why.** "Your response will be read aloud, so never use ellipses" generalizes better than "NEVER use ellipses."
- **Use XML tags** to separate instructions, context, examples and variable input, with consistent names.
- **Say what to do**, not what to avoid, when controlling format.
- **Run the colleague test**: if a colleague with minimal context would be confused, so will Claude.

### Templates are stable prefixes with variable slots

A template is the part of the prompt that stays the same, plus tagged slots for the per-request data. Two layout rules matter at scale.

1. **Long documents go at the top, the query at the end.** For inputs of 20k tokens or more, Anthropic reports queries placed at the end can improve response quality by up to 30% in tests, especially with multiple documents.<sup>[12]</sup> Wrap each document with its source in its own tag.
2. **Nothing that changes per request goes ahead of the static part.** A timestamp at the top of the system prompt turns every request into a full cache write.<sup>[5]</sup> Caching and modular prompts are in [Chapter 4](/ccar-p/read/pro-notes/04-context-tokens-and-reuse).

### Prompts decay when the model changes

Prompts collect instructions written for models you no longer run: "verify twice," "be maximally thorough," a mandatory step-by-step script, a hand-rolled scratchpad. A newer model follows them literally and you pay for the extra tool rounds with no gain. In Anthropic's measurement, removing that text cut cost per ticket, and removing contradictory rules and a scratchpad that conflicted with built-in thinking restored accuracy.<sup>[5]</sup> **Audit prompts whenever you change models**, and audit tool descriptions and skills too.

### Guardrails: options ranked by how much they guarantee

| Requirement | Strongest mechanism | Weaker option and why it loses |
|---|---|---|
| Output must always parse against a schema | **Structured outputs**<sup>[13]</sup> | Format instructions or examples are not guarantees; prefill returns a 400 on Claude 4.6 and later<sup>[12]</sup> |
| A tool must be used for this step | `tool_choice: auto` plus strict tool use or structured outputs, with the prompt saying when the tool applies<sup>[10]</sup> | Forced `any`/`tool` choice is rejected on Opus 5.5, Sonnet 5.5 and Fable 5.1<sup>[8]</sup> |
| Block abusive user input | A lightweight **harmlessness screen** (Haiku 5.5 with structured output) before the main call<sup>[14]</sup> | A longer system prompt alone; the user is the adversary |
| Untrusted documents or emails must not steer the agent | Deliver them only in `tool_result` blocks, say where they came from, JSON-encode them, state the policy, apply least privilege<sup>[14]</sup> | Pasting them into the system prompt or user text, where they read as instructions |
| Answers must stay grounded | Permission to say "I don't know," quote first, cite and retract unsupported claims<sup>[15]</sup> | "Be accurate" in the prompt |
| Hidden instructions must not leak | Keep secrets out of the prompt if the task does not need them; monitor and post-process output first<sup>[16]</sup> | Elaborate anti-leak wording; Anthropic warns it adds complexity that can degrade the task<sup>[16]</sup> |

For agent actions, Anthropic's sample prompt asks Claude to confirm before destructive, hard-to-reverse or externally visible actions.<sup>[12]</sup> That is guidance. When an action must never happen, remove the tool or deny it in configuration ([Chapter 9](/ccar-p/read/pro-notes/09-governance-safety-and-risk)).

### Reading the evidence

| Symptom | Likely cause |
|---|---|
| Output format drifts on a small share of requests | Format enforced by instruction; switch to structured outputs |
| Agent follows instructions found in a fetched web page | Untrusted content placed outside `tool_result`, or no stated trust policy |
| Cost per request rose after a model upgrade, accuracy flat | Stale "be thorough" or "verify twice" text followed literally |
| Answers ignore the question in a long document prompt | Query placed before the documents |
| Your own instructions inside a tool result are ignored | Claude treats tool-result text as untrusted; send instructions in a user turn<sup>[14]</sup> |

## Zero-shot, few-shot and chain-of-thought each buy something different

### The decision

The architect picks the cheapest technique that reaches the quality bar. Each adds tokens, so each must earn its place on an eval. Anthropic's overview says to define success criteria and a way to test them **before** prompt engineering, and notes that some failures, especially latency and cost, are better fixed by changing the model.<sup>[17]</sup>

### What each technique buys

| Technique | Pays off when | Costs | Fails when |
|---|---|---|---|
| **Zero-shot** (clear, direct instructions) | The task is well specified and the output format is simple | Fewest tokens | The format or tone is hard to describe in words |
| **Few-shot** (3–5 examples in `<example>` tags) | Format, tone or structure must be consistent; edge cases need showing | Example tokens on every request (cacheable) | Examples are near-identical, so Claude copies surface patterns<sup>[12]</sup> |
| **Built-in thinking** (adaptive, steered by effort) | Multistep reasoning, coding, analysis, reflection after tool results | Thinking billed as output tokens<sup>[8]</sup> | Used on simple extraction where it only adds latency |
| **Manual chain-of-thought** in tags | Thinking is off on a model that allows it | Visible reasoning tokens | On Fable 5.1, Opus 5.5, Opus 5 and Sonnet 5.5, a prompt asking for written-out reasoning may be declined<sup>[12]</sup> |
| **Prompt chaining** (separate calls) | You must inspect, log or branch on intermediate output | Extra calls and latency | The model could do the steps internally and nobody reads the middle |

**Few-shot details.** Examples should be relevant to the real use case, diverse enough to cover edge cases, and wrapped in tags so Claude can tell them from instructions. Anthropic suggests three to five.<sup>[12]</sup> The context-engineering article warns against stuffing a laundry list of edge-case rules into the prompt. Curate a few **diverse, canonical examples** instead.<sup>[11]</sup> Examples are also one of the most reliable ways to make output consistent.<sup>[13]</sup>

**Chain-of-thought on current models.** Reasoning is now a feature of the model, not of the prompt. On models with thinking, Anthropic recommends:<sup>[12]</sup>

- Prefer **general instructions** ("think thoroughly") over a hand-written step-by-step plan. Claude's reasoning often exceeds what a human would prescribe.
- **Multishot examples still work with thinking.** Show the problem, the method and the expected answer.
- Use **manual CoT only as a fallback** when thinking is off. On models where thinking is always on, rely on thinking at a lower effort if cost matters.
- **Ask for a self-check** against stated criteria, except on Opus 5, where carried-over verification instructions cause over-verification.

To see the reasoning, read the `thinking` blocks with `display: "summarized"`. Requests that try to pull internal reasoning into the response text can be refused with the `reasoning_extraction` category on Fable 5.1, Opus 5.5, Opus 5 and Sonnet 5.5.<sup>[8]</sup> Reviewing summarized thinking is also Anthropic's suggested way to debug a wrong answer.<sup>[15]</sup>

If adaptive thinking triggers too often, for example with a large system prompt, it is promptable: tell Claude to respond directly unless the problem needs multistep reasoning. Lower effort is the fallback.<sup>[12]</sup>

### Reading the evidence

| Symptom | Likely cause |
|---|---|
| Outputs copy the wording of one example | Examples not diverse enough |
| A step-by-step scaffold makes an upgraded model worse | Scaffold conflicts with built-in thinking; remove it<sup>[5]</sup> |
| Requests asking for `<reasoning>` text get refused | Reasoning extraction on a thinking model; read thinking blocks instead |
| Classification is slow and costly, accuracy already high | Thinking or high effort on a task that does not need it; lower effort or use a smaller model |

## Worked design review: a claims-triage classifier that is slow, costly and sometimes unparseable

**The system.** An insurer classifies 40,000 incoming claims a day into twelve categories and extracts six fields. A downstream router needs valid JSON within 3 seconds at p95. The team built it on Fable 5.1 at `max` effort. The request sets `temperature: 0` "for determinism" and prefills `{` to force JSON. The system prompt is 4,000 tokens: forty edge-case rules, "think step by step inside `<reasoning>` tags, then answer," and a paragraph telling Claude never to reveal the rules.

**What goes wrong.** On a current model the request is rejected outright: non-default `temperature` and a prefilled final assistant turn both return a 400.<sup>[8]</sup><sup>[12]</sup> If the team fixes those by trial and error, cost and latency are far above budget, and the `<reasoning>` instruction may be declined on Fable 5.1.<sup>[12]</sup>

**The constraint that decides.** Latency and volume, with a hard parse requirement. Accuracy matters, but the task is classification and extraction with checkable output.

**The better design.**

1. **Model and effort.** Evaluate Haiku 5.5 and Sonnet 5.5 at `low` and `medium` on a labeled sample of real claims, priced per correctly handled claim. Haiku 5.5 is positioned for exactly this workload.<sup>[1]</sup> Keep prompts under 100,000 tokens so Haiku stays in its lower price band.<sup>[2]</sup>
2. **Format guarantee.** Use structured outputs with the twelve categories as an enum.<sup>[13]</sup> Drop the prefill.
3. **Technique.** Replace the forty rules with three to five diverse, canonical examples, including the two hardest categories.<sup>[11]</sup><sup>[12]</sup> Remove the manual reasoning instruction; let adaptive thinking and effort handle hard cases.
4. **Sampling.** Remove `temperature`. It was never a guarantee of identical outputs, even on older models.<sup>[10]</sup>
5. **Leak paragraph.** The rules are not secret business logic. Delete the paragraph rather than add complexity.<sup>[16]</sup>
6. **Cost.** Put the static prompt first and cache it. Route any re-scoring backfills through the Batch API.<sup>[2]</sup>

**Why the tempting alternatives lose.**

- *"Keep Fable 5.1 and enable fast mode."* Fast mode doubles the price, and the fast-mode page lists only Opus models, not Fable 5.1.<sup>[6]</sup> It fixes output speed on the wrong model.
- *"Move the whole workload to the Batch API."* It halves cost but breaks the 3-second requirement.<sup>[2]</sup>
- *"Add more edge-case rules to fix misclassifications."* That is the laundry-list pattern Anthropic advises against; examples and evals fix it better.<sup>[11]</sup>
- *"Downsize to Haiku 5.5 without an eval."* Probably right, but unjustified. Measure first and price the failures.<sup>[5]</sup>

## How wrong answers are built

- **"Set temperature to 0 to make outputs consistent."** Wrong knob. Current models reject non-default sampling parameters, and temperature never guaranteed identical outputs. Use structured outputs and examples. *(Family 3)*
- **"Switch to the most capable model to fix cost overruns at acceptable quality."** Lower effort on the current model first. *(Family 3)*
- **"Downgrade to the cheapest model to save money"** when the stem says hard cases fail. It breaks the quality requirement; measure cost per completed task and price the tail. *(Family 2)*
- **"Enable fast mode to cut time to first token."** It raises output speed, not TTFT. *(Family 3)*
- **"Prefill the assistant turn with `{` to force JSON."** Returns a 400 on Claude 4.6 and later. Structured outputs remove the failure. *(Family 1)*
- **"Add a prompt instruction that the agent must never follow instructions in emails."** Helpful, but the removal answer is to deliver email text only in `tool_result` blocks and scope the agent's permissions. *(Family 1)*
- **"Add 'think step by step' to fix a regression after an upgrade."** If the regression came with the upgrade, look at what changed: default effort, stale scaffolds, retired thinking settings. *(Family 4)*
- **"Write a longer anti-leak clause."** Anthropic warns it can degrade the task. Remove the secret from the prompt and monitor output. *(Family 1)*

## What to remember

- Compare models on **cost per completed task**, never per token. The 4.7+ tokenizer makes per-token comparisons misleading.
- **Effort first, tier second, second model last.** Opus 5.5 and Haiku 5.5 default to `medium`; Fable 5.1 and Sonnet 5.5 default to `high`.
- Opus 5.5: $4 / $20. Sonnet 5.5: $2 / $10. Haiku 5.5: from $0.10 / $0.50, higher over 100K prompt tokens. Fable 5.1: $10 / $50.
- Fast mode: same model, up to 2.5x output speed, 2x price on Opus 5.5, no Batch, no TTFT gain.
- Thinking tokens bill as output and count toward `max_tokens`. `max_tokens` is the hard cap; effort is soft.
- Current models reject sampling parameters, prefill and (on Opus 5.5, Sonnet 5.5, Fable 5.1) forced tool choice.
- Guarantees come from **structured outputs, tool placement and permissions**, not prompt wording.
- Few-shot: three to five relevant, diverse, tagged examples. Manual CoT is a fallback only when thinking is off.
- Audit prompts on every model change.

## Endnotes for this chapter

1. The current model lineup with positioning, comparative latency, prices, default effort, thinking mode, context window and max output, and the note that manual extended thinking is deprecated on 4.6 models and not accepted later. Anthropic, "Models overview" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/models/overview
2. Per-model input, output and cache prices, Haiku 5.5's prompt-length pricing, the newer tokenizer's roughly 30% token increase, the 50% Batch discount and how discounts stack. Anthropic, "Pricing" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/pricing
3. Efficiency-first versus capability-first starting points, the selection matrix, and the advice that tuning effort is often a better lever than switching models. Anthropic, "Choosing the right model" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/models/choosing-a-model
4. What effort controls, its levels and per-model defaults, that it is a behavioral signal rather than a budget, and Haiku 5.5's behavior at `low` in long agent prompts. Anthropic, "Effort" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/effort
5. Measured cost-per-task comparisons, effort sweeps, re-running failures at higher effort, output caps, prompt audits, multi-model strategies and the cost of breaking the cache. Anthropic, "Optimizing for cost and intelligence" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence
6. Fast mode's speed gain on output tokens rather than time to first token, supported models, pricing, separate rate limit and incompatibility with Batch and Priority Tier. Anthropic, "Fast mode" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/fast-mode
7. Choosing a faster model, trimming prompt and output tokens, and streaming to cut latency, with time to first token as a distinct measure. Anthropic, "Reducing latency" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-latency
8. Adaptive thinking per model, billing of thinking as output, `display` options, the `reasoning_extraction` refusal, rejected sampling parameters, prefill and forced tool choice. Anthropic, "Thinking" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/thinking
9. Manual `budget_tokens` thinking, its constraints and its place on older models. Anthropic, "Extended thinking" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/extended-thinking
10. Request requirements for Opus 5.5, its `medium` default effort, removal of sampling parameters and the note that temperature 0 never guaranteed identical outputs, and replacing forced tool choice. Anthropic, "Claude Opus 5.5 migration guide" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/models/opus-5-5/migration-guide
11. System prompts at the right altitude, minimal prompts tested on the best model first, and curated canonical examples instead of laundry lists of rules. Anthropic, "Effective context engineering for AI agents" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/research/effective-context-engineering-for-ai-agents
12. Clarity, context, examples, XML tags, roles, long-context layout, prefill migration, thinking guidance, manual CoT as a fallback and confirmation before risky actions. Anthropic, "Prompting best practices" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
13. Structured outputs for guaranteed schema conformance, and examples, retrieval and chaining for consistency. Anthropic, "Increase output consistency" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/increase-consistency
14. Harmlessness screens, handling untrusted content in tool results, JSON encoding, least privilege and not placing your own instructions in tool results. Anthropic, "Mitigate jailbreaks and prompt injections" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks
15. Allowing uncertainty, quote-first grounding, citation verification and reviewing summarized thinking. Anthropic, "Reduce hallucinations" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
16. Leak-resistant prompting only when necessary, monitoring first, and omitting unneeded proprietary details. Anthropic, "Reduce prompt leak" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-prompt-leak
17. Define success criteria and tests before prompt engineering; some failures are better solved by a different model. Anthropic, "Prompt engineering overview" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
