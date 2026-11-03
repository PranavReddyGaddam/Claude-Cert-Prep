# Chapter 4: Context, Tokens and Prompt Reuse

**Summary**: *A large context window is a ceiling, not a target. Quality falls as context grows, and every token you resend is billed again on every turn. The architect's job is to keep context small and high-signal, measure it before sending, and keep the reusable part of every request byte-identical so the cache can carry it. Skills extend the same idea to instructions: load them only when needed.*

## The context window is an attention budget, not just a size limit

### The decision

For a long-running or high-volume system, the architect decides what enters context, when it leaves, and how it is measured. The options are trimming inputs, clearing stale content, summarizing (compaction), moving state outside the window (notes and memory), and splitting work across fresh windows (subagents). Each has a different cost and a different failure mode.

### What counts, and why "fits" is not enough

Everything in the request counts toward the window: the system prompt, every message including tool results, images and documents, the tool definitions, and the output Claude generates for the turn, including thinking.<sup>[1]</sup> Cached tokens still occupy the window. Caching changes what you pay, not whether the tokens count.<sup>[1]</sup>

Current models have a 1M-token window, 1M is the default with no beta header, and a single request can return up to 128K output tokens.<sup>[1]</sup> Long context is billed at standard per-token rates on Claude 4.6 and later, **except Claude Haiku 5.5**, where a prompt over 100,000 tokens pays higher prices for the whole request.<sup>[2]</sup> A request can include up to 600 images or PDF pages, so large media can hit request size limits before the token limit.<sup>[1]</sup>

Fitting is not the bar. Anthropic's docs call the degradation **context rot**: as token count grows, accuracy and recall fall.<sup>[1]</sup> The context-engineering article frames context as a finite attention budget with diminishing returns. The goal is **the smallest set of high-signal tokens** that makes the desired outcome likely.<sup>[3]</sup>

Cost compounds too. Every turn of an agent loop resends the whole growing conversation, so a 40-turn task sends its first turn 40 times and task cost grows roughly with the square of the turn count.<sup>[4]</sup>

### Measure before you send

The **token counting** endpoint takes the same inputs as a message request (system prompt, tools, images, PDFs, thinking) and returns the input token count.<sup>[5]</sup> Design facts that come up in questions:

- It is **free**, but rate-limited by requests per minute: 5,000 at Start, 10,000 at Build, 20,000 at Scale.<sup>[5]</sup>
- It counts under the tokenizer of the `model` you pass. Count the same request on the current and the target model before a migration, because Claude 4.7 and later produce about 30% more tokens for the same text.<sup>[5]</sup><sup>[2]</sup>
- It does **not** accept server tools such as web search and code execution, the MCP connector, or image and document blocks given by URL or file ID. For those, read `usage` on the real response.<sup>[5]</sup>
- It does not apply caching logic, so it estimates total input, not the cached split.<sup>[5]</sup>
- With context editing configured, it reports both the post-clearing count and `original_input_tokens`.<sup>[6]</sup>

Use it to route requests to a model, to keep Haiku 5.5 prompts under the 100,000-token price threshold, and to fail fast before a request overflows. If input alone exceeds the window, the API returns a 400 "prompt is too long." If input plus `max_tokens` exceeds the window on Claude 4.5 and newer, the request is accepted and generation stops with `stop_reason: "model_context_window_exceeded"`.<sup>[1]</sup>

### Levers ranked by constraint

| Lever | What it does | Best when | Watch out for |
|---|---|---|---|
| **Defer tool definitions** (tool search, `defer_loading`) | Unused schemas leave every request | Many MCP tools attached | Keep the 3–5 most used tools loaded<sup>[4]</sup> |
| **Files API plus code execution** for tables | Data is queried, not pasted | Computation over structured data | Needs the code execution tool |
| **Just-in-time retrieval** | Agent holds identifiers and loads data with tools | Large or changing corpora | Slower than precomputed retrieval; needs good tools<sup>[3]</sup> |
| **Tool result clearing** (context editing) | Server replaces old tool results with a placeholder | Heavy tool use, long sessions | Each clearing invalidates the cached prefix<sup>[6]</sup> |
| **Thinking block clearing** | Drops earlier turns' thinking | Long sessions on models that keep prior thinking | Clearing invalidates the cache at that point<sup>[6]</sup> |
| **Compaction** | Older turns replaced by a server-written summary | Long conversations that must keep their flow | Over-aggressive summaries lose subtle context<sup>[7]</sup><sup>[3]</sup> |
| **Structured notes / memory** | State persists outside the window | Iterative work with milestones | Agent must be told what to record<sup>[3]</sup> |
| **Subagents** | Deep work in a fresh window, condensed result returned | Parallel research, exploration | Coordination cost; only the summary comes back<sup>[3]</sup> |

Two measured results keep this table honest. Pasting a 1,862-row CSV (about 91,000 tokens) into the prompt let Claude Sonnet 5 answer 7 of 25 aggregate questions. Uploading it and using code execution answered all 25 for about a twelfth of the cost.<sup>[4]</sup> But context editing **cost more than it saved** on a short 20-issue run and changed nothing on the long run, while a hand-written prune at task boundaries and compaction both cut cost on the long run.<sup>[4]</sup> Context levers pay only on sessions long enough to need them.

### The mechanics you should recognize

**Tool result clearing** (`clear_tool_uses_20250919`) activates once the prompt passes `trigger`, default 100,000 input tokens, and keeps the most recent `keep` tool uses, default 3. `clear_at_least` stops it from firing unless enough tokens are cleared to justify breaking the cache, and `exclude_tools` protects results you must keep.<sup>[6]</sup> Context editing is applied server-side: your client keeps the full history. It is in beta behind `context-management-2025-06-27`.<sup>[6]</sup> Paired with the memory tool, Claude gets a warning near the threshold so it can save what matters before results are cleared.<sup>[6]</sup>

**Compaction** replaces older turns with a summary Claude writes on the server. On-demand compaction (you decide when) and threshold compaction (the API decides at a trigger) are both in beta. Anthropic recommends on-demand wherever it is available.<sup>[7]</sup> For a custom summarizer, the article's advice is to tune for recall first, then precision.<sup>[3]</sup>

**Thinking in context.** On Opus 4.5 and later, Sonnet 4.6 and later, Haiku 5.5 and the Fable models, earlier turns' thinking blocks stay in context and are billed as input. Budget for them like any other history.<sup>[1]</sup><sup>[8]</sup>

For resumable state across sessions, see Foundations [Chapter 4](/ccar-f/read/notes/04-state-resumption-and-long-context). For the progressive-discovery versus monolithic-context decision at the integration level, see [Chapter 5](/ccar-p/read/pro-notes/05-integration-mechanisms-and-scope).

### Reading the evidence

| Symptom | Likely cause |
|---|---|
| Answers degrade late in long sessions, no errors | Context rot from accumulated tool output; clear, prune or compact |
| Haiku 5.5 bill jumps for some requests only | Those prompts crossed 100,000 tokens, including cached tokens<sup>[2]</sup> |
| Token budget estimate wrong after a model migration | Counted on the old tokenizer; recount with the new model ID |
| Context editing turned on, cost went up | Short sessions; each clearing rewrote the cache<sup>[4]</sup><sup>[6]</sup> |
| `count_tokens` returns `invalid_request_error` | Request includes server tools, the MCP connector or URL-sourced files<sup>[5]</sup> |
| Agent re-reads the same files after compaction | Summary dropped needed detail; improve the summarization prompt or keep recent turns |

### Numbers worth knowing

- 1M context, 128K max output, up to 600 images or PDF pages per request on current models.<sup>[1]</sup>
- Haiku 5.5 price step at 100,000 prompt tokens.<sup>[2]</sup>
- Token counting free; 5,000 / 10,000 / 20,000 RPM by tier.<sup>[5]</sup>
- Tool result clearing defaults: trigger 100,000 input tokens, keep 3 tool uses.<sup>[6]</sup>
- Subagents in Anthropic's research system returned condensed summaries of about 1,000–2,000 tokens.<sup>[3]</sup>

## Prompt reuse works only when the reusable prefix is byte-identical

### The decision

The architect decides how prompts are assembled so the expensive part is reused: what order blocks go in, where cache breakpoints sit, which TTL to buy, what is allowed to change mid-conversation, and which instructions should be loaded only on demand. In Anthropic's measurements prompt caching was usually the **largest single cost lever**, and it should be turned on before any other.<sup>[4]</sup>

### How the cache works

The cache key is the full prefix in a fixed order: **`tools`, then `system`, then `messages`**, up to and including the block marked with `cache_control`.<sup>[9]</sup> A hit requires that segment to be 100% identical.<sup>[9]</sup> The rules that decide most items:

- **Automatic caching** puts one `cache_control` at the top level and moves the breakpoint to the last cacheable block as the conversation grows. It is the recommended start for multi-turn work.<sup>[9]</sup>
- **Explicit breakpoints** go on blocks. You get up to **4**, and automatic caching uses one of them.<sup>[9]</sup>
- **Writes happen only at a breakpoint.** Reads look backward for an earlier write, at most **20 blocks** per breakpoint.<sup>[9]</sup> A breakpoint on a block that changes every request never gets a hit. Put it on the last block that stays the same.<sup>[9]</sup>
- **Minimum cacheable length**: 512 tokens on Fable 5.1, Opus 5.5, Opus 5, Sonnet 5.5 and Haiku 5.5; 1,024 on Opus 4.8 and Sonnet 5; 2,048 on Opus 4.7; 4,096 on Opus 4.6, Opus 4.5 and Haiku 4.5. A shorter prefix is processed uncached **with no error**. Both cache fields in `usage` read 0.<sup>[9]</sup>
- **Lifetime**: 5 minutes by default, refreshed free each time the entry is used, measured from the **start** of the request. A 1-hour TTL costs more to write.<sup>[9]</sup>
- **Concurrency**: an entry becomes available only after the first response starts. For parallel fan-out, send one request first.<sup>[9]</sup>
- **Isolation**: caches are per organization, and per workspace on the Claude API, Claude Platform on AWS and Microsoft Foundry.<sup>[9]</sup>

### What it costs and saves

| Operation | Multiplier on base input price |
|---|---|
| 5-minute cache write | 1.25x |
| 1-hour cache write | 2x |
| Cache read | 0.1x standard; **0.05x** on Opus 5.5 and Sonnet 5.5; **0.025x** on Fable 5.1 |

At the standard read price, a 5-minute entry pays off after one read and a 1-hour entry after two.<sup>[2]</sup> The multipliers stack with the Batch API's 50% discount and with data residency pricing.<sup>[2]</sup> On most models, **cache reads do not count toward input-tokens-per-minute rate limits**, so caching also raises effective throughput.<sup>[10]</sup>

Anthropic reports that over a day of real traffic, agent loops read a median 84% of their input from the cache. Below about 80%, look for something breaking it.<sup>[4]</sup> On the SWE-bench Pro subset, Opus 5.5 without caching cost 3.3 times as much as with it.<sup>[4]</sup>

### What breaks the cache

A change at a level invalidates that level and everything after it.<sup>[9]</sup>

| Change | Invalidates |
|---|---|
| Tool definitions (name, description, parameters) | Everything |
| Web search or citations toggled; `speed` switched | System and messages |
| `tool_choice`; images added or removed | Messages |
| Thinking configuration or top-level `effort` value | Messages, and on some models tools and system |
| Anything per-request (timestamp, queue position) placed early | Everything after it |
| Non-deterministic JSON key order in tool-use blocks | Silently, every request |

Sources: the prompt caching page and the cost guide.<sup>[9]</sup><sup>[4]</sup><sup>[8]</sup>

When something must change mid-conversation, send it in the form that keeps the prefix. In Anthropic's test on a cached 100,000-token conversation, editing the system prompt cost about 25 to 50 times what the same text cost as a **mid-conversation system message**, and changing effort at the top level cost 20 to 40 times what a **per-message effort** change cost.<sup>[4]</sup> Per-message effort is in beta and keeps the cache on Fable 5.1, Opus 5.5, Opus 5, Sonnet 5.5 and Haiku 5.5.<sup>[11]</sup> Otherwise, make cache-breaking changes at a natural break, such as the first request after a compaction.<sup>[4]</sup>

### Picking the TTL

Count the gaps between requests in a conversation.<sup>[4]</sup>

| Gaps between requests | Use |
|---|---|
| Seconds apart (agent loop) | 5-minute default |
| About 1 gap in 20 or more falls between 5 minutes and an hour, few run longer | 1-hour TTL |
| Most pauses over 5 minutes also run past an hour | 5-minute default (the 1-hour entry expires anyway) |
| Opus 5.5 or Sonnet 5.5, only 1–2 in 20 gaps of this kind, none over about 30 minutes | 5-minute cache kept warm |

Choose the TTL when the conversation starts. Switching mid-conversation rewrites the whole prompt once.<sup>[4]</sup> To keep a 5-minute entry warm, or to pre-load a system prompt before a user arrives, send the same request with **`max_tokens: 0`**. It writes or refreshes the cache and returns no output. It is rejected with streaming, manual extended thinking, structured outputs, forced tool choice, and inside a batch.<sup>[9]</sup> Batch requests can still use caching on a best-effort basis, and Anthropic suggests the 1-hour TTL for batches with shared context.<sup>[12]</sup>

### Modular prompts: separate what changes from what does not

A modular prompt is assembled from blocks that change at different rates, ordered from most stable to least: tool definitions, the static system prompt, long reference documents and examples, then conversation, with per-request data at the end of the newest user turn.<sup>[9]</sup><sup>[4]</sup> Each stable block can carry its own breakpoint, which is the reason for having up to four.<sup>[9]</sup> Because cached examples cost a fraction to resend, Anthropic notes caching makes 20+ diverse examples affordable.<sup>[9]</sup>

The Agent SDK builds this in.<sup>[13]</sup>

- A custom TypeScript system prompt can be passed as an array with `SYSTEM_PROMPT_DYNAMIC_BOUNDARY` between the static instructions and per-request context. Each part gets its own breakpoint, so the instructions stay cached while the ticket details change.
- On the `claude_code` preset, `excludeDynamicSections: true` moves per-user details out of the system prompt so a fleet of agents shares one cache entry.
- CLAUDE.md content is injected into the conversation, not the system prompt, so it does not affect the system prompt cache.

### Skills: progressive disclosure for instructions

**Agent Skills** are directories with a `SKILL.md` file and optional scripts and references. They load in three levels.<sup>[14]</sup>

| Level | Loaded | Approximate cost |
|---|---|---|
| 1. `name` and `description` | Always, in the system prompt | About 100 tokens per skill |
| 2. `SKILL.md` body | When the request matches the description | Under 5K tokens |
| 3. Bundled files and scripts | Only when read or run | Nothing until accessed; a script's code never enters context, only its output |

That makes skills the right home for **procedures needed sometimes**, while caching is the right tool for **content needed every time**. Claude Code's docs say the same: create a skill when a section of CLAUDE.md has grown into a procedure, because the skill's body loads only when used.<sup>[15]</sup>

Design rules from the authoring guide:<sup>[16]</sup>

- The **description** decides triggering. Say what the skill does and when to use it, in the third person, with key terms.
- Keep the `SKILL.md` body **under 500 lines** and keep references **one level deep**, because Claude may only preview nested files.
- Match freedom to fragility: text guidance where many approaches work, an exact script where a sequence must not vary.
- Test with every model you will run, since what works for Opus may need more detail for Haiku.

Operating them at scale is a governance problem.<sup>[17]</sup><sup>[14]</sup>

- On the Claude API, skills need the **code execution tool**, run in a container with no network access, and are shared **workspace-wide**. A request can include at most **20 skills**.
- Too many active skills hurt selection, because every description competes for attention. Measure recall as you add them. Claude Code also caps its skill listing at about 1% of the context window and drops descriptions when it overflows.<sup>[15]</sup>
- **Pin versions in production.** Omitting `version` means the latest upload, by anyone in the workspace, changes what production runs.
- Skills do **not sync across surfaces** (API, claude.ai, Claude Code).
- Vet skills like software: scripts, network calls, MCP references and hardcoded credentials are high-risk indicators. Agent Skills are not covered by ZDR arrangements.

### Options ranked by constraint

| Need | Best reuse mechanism | Why the others lose |
|---|---|---|
| Same large context on every request | Prompt caching, static content first | A skill adds a read step for content you always need |
| Procedure needed in some requests | Skill (metadata always, body on demand) | Caching it still sends it every time and still dilutes attention |
| Instructions that vary per customer or ticket | Static/dynamic split, variable part last | One combined string misses the cache on every change |
| Many tools, few used per task | Deferred loading with tool search | Loading all schemas costs tokens on every turn<sup>[4]</sup> |
| Mid-session behavior change | Mid-conversation system message or per-message effort | Editing `system` or top-level effort rewrites the cache |

### Reading the evidence

| Symptom | Likely cause |
|---|---|
| `cache_creation_input_tokens` high on every request, reads near 0 | Varying content ahead of the breakpoint, or breakpoint on the varying block |
| Both cache fields 0, no error | Prefix below the model's minimum cacheable length |
| Hits fine in tests, misses in production fan-out | Parallel requests sent before the first response started |
| Cache rate fell right after a "small" deploy | Tool definition, tool order or JSON key order changed |
| Cost spikes after users return from a break | Gaps between 5 minutes and an hour on a 5-minute TTL |
| Hit rate fell when two teams split into workspaces | Caches are workspace-isolated on the Claude API |
| A skill never triggers, or steals requests from others | Vague or overly broad description |

## Worked design review: a support agent paying full price on almost every turn

**The system.** A support agent on Claude Sonnet 5.5 handles 15,000 conversations a day. Each request carries 48 MCP tool definitions, a 60,000-token policy manual and a system prompt that begins `Current time: 14:02:37. Customer tier: Gold.` A router lowers top-level `effort` to `low` for "simple" turns and restores `high` for others. Customers often pause 10 to 20 minutes mid-conversation. Usage logs show about 15% of input read from cache. Finance asks for a 60% cost cut with no loss in policy accuracy.

**The constraint that decides.** Cost, with a stated requirement that the full policy stays available.

**What is actually wrong.** The timestamp and tier at the top of the system prompt change every request, so everything after the tools is rewritten every turn.<sup>[4]</sup> The effort toggles break the message cache again.<sup>[9]</sup> The tools are serialized from a map whose key order is not stable. Pauses over 5 minutes let the entry expire.

**The better design.**

1. **Order the prefix by stability.** Tools (with a fixed order), static system prompt, policy manual, conversation. Move time and tier to the end of the newest user turn.<sup>[4]</sup>
2. **Defer tools.** Keep the three to five most used tools loaded and put the rest behind tool search.<sup>[4]</sup>
3. **Change effort per message**, using the per-message effort beta, so the prefix survives.<sup>[11]</sup>
4. **Buy the 1-hour TTL** at conversation start, because roughly one gap in twenty or more falls between 5 minutes and an hour.<sup>[4]</sup> On Sonnet 5.5, reads then cost 0.05x the input price.<sup>[2]</sup>
5. **Watch the metric.** Target a cache read share above 80%, and use cache diagnostics when it drops.<sup>[4]</sup>

**Why the tempting alternatives lose.**

- *"Move to Haiku 5.5."* It does not fix the cause. A 60,000-token manual plus history also pushes prompts toward Haiku's 100,000-token price step.<sup>[2]</sup> *(Wrong knob.)*
- *"Summarize the policy manual to a tenth of its size."* Cheaper, but it breaks the accuracy requirement. Cached, the full manual is cheap to resend. *(Blunt fix.)*
- *"Turn on context editing."* It clears tool results, which is not where the cost is, and each clearing breaks the cache. *(Wrong knob.)*
- *"Add a cost dashboard and alerts."* Visibility without removal. *(Compensating control.)*
- *"Put the manual in a skill."* It is needed on almost every turn. A skill suits procedures needed sometimes, so it adds a load step without cutting cost. *(Wrong knob.)*

## How wrong answers are built

- **"Use the full 1M-token window so nothing is lost."** More context lowers recall and raises cost on every turn. Curate. *(Family 3)*
- **"Truncate older history to stay under budget."** If the stem needs that history, it breaks a requirement. Compact or move state to notes. *(Family 2)*
- **"Caching is on but costs did not fall, so caching does not suit this workload."** Look for what changed in the prefix: a timestamp, a tool, effort, speed, key order. *(Family 4)*
- **"Add more cache breakpoints to raise the hit rate."** Breakpoints cost nothing, but they do not help if the content before them changes. *(Family 3)*
- **"Use the 1-hour TTL everywhere for safety."** Loops seconds apart refresh the 5-minute entry for free; a 2x write buys nothing. *(Family 2)*
- **"Count tokens with `count_tokens` to verify cache hits."** It ignores caching. Read `cache_read_input_tokens` in `usage`. *(Family 3)*
- **"Load every skill for every user so nothing is missed."** Descriptions compete for attention and recall drops. Bundle by role. *(Family 2)*
- **"Monitor skill outputs in production"** when a skill fetches from external URLs or carries credentials. Vet and remove the risk before deployment. *(Family 1)*

## What to remember

- Everything counts toward the window, including tools, thinking and cached tokens.
- Context rot is real: aim for the **smallest high-signal context**, not the largest that fits.
- Token counting is free, model-specific (new tokenizer is about 30% larger) and ignores caching.
- Prefix order: **tools → system → messages**. Byte-identical or no hit. Up to 4 breakpoints, 20-block lookback.
- Minimum cacheable: 512 tokens on current 5.x models; below it, silently uncached.
- Writes 1.25x (5 min) or 2x (1 h); reads 0.1x, 0.05x on Opus 5.5 and Sonnet 5.5, 0.025x on Fable 5.1. Stacks with Batch.
- TTL lifetime runs from request start; pick TTL by counting gaps, at conversation start.
- Change behavior mid-session with mid-conversation system messages or per-message effort, not by editing `system`.
- Context editing and compaction pay only on long sessions, and clearing breaks the cache.
- Skills: ~100 tokens always, body under 5K on trigger, files on demand. Pin versions, cap the count, vet like software.

## Endnotes for this chapter

1. What counts toward the context window, current window and output sizes, image limits, context rot, thinking blocks in later turns, compaction and context editing as the main tools, and overflow behavior. Anthropic, "Context windows" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/context-windows
2. Haiku 5.5's 100,000-token price step, long-context pricing, the newer tokenizer, cache multipliers and break-even, and how caching stacks with Batch and data residency. Anthropic, "Pricing" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/pricing
3. Context as a finite attention budget, the smallest high-signal token set, just-in-time retrieval, compaction, structured note-taking and subagents returning condensed summaries. Anthropic, "Effective context engineering for AI agents" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/research/effective-context-engineering-for-ai-agents
4. Caching as the first lever, cache-hit benchmarks, what breaks the cache and its measured cost, TTL selection by gap counting, deferred tools, keeping data files out of the prompt, and when context levers pay. Anthropic, "Optimizing for cost and intelligence" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence
5. The token counting endpoint, unsupported inputs, per-model tokenizers, free pricing with RPM limits, and no caching logic. Anthropic, "Token counting" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/token-counting
6. Tool result and thinking block clearing, their defaults, cache interactions, server-side application, beta header, token counting support and pairing with the memory tool. Anthropic, "Context editing" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/context-editing
7. On-demand versus threshold compaction and when to choose each. Anthropic, "Compaction overview" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/compaction
8. How earlier thinking blocks count toward context per model, and that thinking configuration and effort are rendered into the prompt and invalidate the cache when changed. Anthropic, "Thinking" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/thinking
9. Prefix order, automatic and explicit breakpoints, the 20-block lookback, minimum lengths, TTLs, concurrency, isolation, invalidation rules, pre-warming with `max_tokens: 0` and using many cached examples. Anthropic, "Prompt caching" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/prompt-caching
10. Cache-aware input-tokens-per-minute limits: cache reads do not count for most models. Anthropic, "Rate limits" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/api/rate-limits
11. Per-message effort in beta and the models on which it keeps the prompt cache. Anthropic, "Effort" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/effort
12. Best-effort cache hits in batches and the suggestion to use the 1-hour TTL for shared batch context. Anthropic, "Batch processing" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/batch-processing
13. Splitting a custom prompt at a dynamic boundary, `excludeDynamicSections` for fleet-wide caching, and CLAUDE.md delivered in the conversation rather than the system prompt. Anthropic, "Modifying system prompts" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/agent-sdk/modifying-system-prompts
14. The three levels of skill loading and their token costs, API prerequisites and sandbox, sharing scope, cross-surface limits, security considerations and data retention. Anthropic, "Agent Skills" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
15. When to turn CLAUDE.md content into a skill, and the skill listing's character budget in Claude Code. Anthropic, "Extend Claude with skills" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/skills
16. Writing descriptions, keeping `SKILL.md` under 500 lines, one-level references, degrees of freedom and testing across models. Anthropic, "Skill authoring best practices" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
17. Risk indicators and review checklist, recall limits, the 20-skill request limit, role-based bundles and version pinning. Anthropic, "Skills for enterprise" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/agents-and-tools/agent-skills/enterprise
