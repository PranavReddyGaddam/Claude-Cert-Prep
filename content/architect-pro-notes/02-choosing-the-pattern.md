# Chapter 2: Choosing the Pattern: Workflows, Agents and Multi-Agent Systems

**Summary**: *Pattern choice is a cost, latency and risk decision before it is a capability decision. Start from a single augmented LLM call, move to a workflow when the steps are known, to an agent when they are not, and to several agents only when the work is broad, parallel and valuable enough to pay for many more tokens.*

## Pick the least autonomous pattern that meets the requirement

**The decision.** Given a task, choose among a single augmented LLM call, a workflow, a single agent and a multi-agent system. Each step up buys flexibility and costs latency, tokens, predictability and debuggability.

### The vocabulary the exam uses

Anthropic's "Building effective agents" draws the distinctions this objective is built on.<sup>[1]</sup>

- The **augmented LLM** is the building block: a model given retrieval, tools and memory, which it uses on its own initiative (writing search queries, choosing tools, deciding what to keep).
- **Workflows** orchestrate LLMs and tools through **predefined code paths**. Your code decides the sequence.
- **Agents** let the LLM **direct its own process** and tool use. The model decides the sequence.
- Both are **agentic systems**. The line between them is who controls the path.

The same article advises finding the **simplest solution possible**, and notes that for many applications **a single LLM call with retrieval and in-context examples is enough**.<sup>[1]</sup> The Foundations treatment of the same distinction is in [Foundations chapter 3](/ccar-f/read/notes/03-shape-of-the-work). Here the question is which one to pay for.

### The pattern ladder

| Pattern | Use it when | What it costs | Source |
|---|---|---|---|
| Single augmented call | One step, with retrieval or examples for knowledge | Lowest latency and cost | <sup>[1]</sup> |
| Prompt chaining | The task splits cleanly into **fixed** subtasks. Programmatic gates can check each step | Latency, traded for accuracy on easier steps | <sup>[1]</sup> |
| Routing | Inputs fall into **distinct categories** that are better handled separately, and classification is accurate | One extra call. A misroute sends the input down the wrong path | <sup>[1]</sup> |
| Parallelization: sectioning | Independent subtasks can run at once, or separate aspects deserve focused attention | More calls in parallel. Results must be aggregated | <sup>[1]</sup> |
| Parallelization: voting | The same task run several times gives higher confidence | Multiplies cost by the number of votes | <sup>[1]</sup> |
| Orchestrator-workers | Subtasks **cannot be predicted** in advance and depend on the input | A central LLM call plus workers. Less predictable | <sup>[1]</sup> |
| Evaluator-optimizer | Clear evaluation criteria exist and iteration measurably improves output | Several rounds per task | <sup>[1]</sup> |
| Autonomous agent | Open-ended problems where the **number of steps cannot be predicted** and no fixed path can be hard-coded | Higher cost, **compounding errors**. Needs sandboxed testing and guardrails | <sup>[1]</sup> |

Two distinctions come up often.

- **Sectioning versus orchestrator-workers.** They look alike. The difference is that sectioning's subtasks are **fixed in code**, while an orchestrator **decides the subtasks from the input**.<sup>[1]</sup> If every document gets the same three checks, it is sectioning, and you do not need an orchestrator.
- **Evaluator-optimizer fit test.** The article gives two signs of a good fit: responses demonstrably improve when a human articulates feedback, and an LLM can give that kind of feedback.<sup>[1]</sup> If no one can say what "better" means, the loop has nothing to optimize.

The article's guardrail example is also worth knowing: screening a request for inappropriate content in **one call while another call answers it** tends to work better than asking a single call to do both.<sup>[1]</sup>

### Options ranked by constraint

| When this dominates | Prefer | Because |
|---|---|---|
| Predictability, auditability, regulation | A workflow with gates | Every path is in code, so it can be tested, reviewed and explained |
| Cost | A single augmented call, or routing to small models | Fewest tokens. The article lists routing easy questions to smaller models as a cost pattern<sup>[1]</sup> |
| Latency | A single call, or sectioning in parallel | Chaining and evaluator loops add sequential calls |
| Unknown steps, open-ended goals | An agent with stopping conditions | No fixed path exists to code<sup>[1]</sup> |
| Breadth beyond one context window | Multi-agent orchestration | Separate context windows add capacity (next section) |
| Maintainability by a small team | The simplest pattern that passes the evals, built directly on the API | The article warns that frameworks can hide prompts and responses and tempt teams into unneeded complexity<sup>[1]</sup> |

The article closes with three principles for agents: keep the design **simple**, make planning **transparent**, and invest in the **agent-computer interface** through tool documentation and testing.<sup>[1]</sup> A Pro item that asks how to make an agent more maintainable usually wants one of those three, not a new layer.

### Where the pattern runs

The pattern and the hosting surface are separate decisions. You can build a workflow on the Messages API, run an agent loop in your own process with the Agent SDK, or have Anthropic host it in Claude Managed Agents.<sup>[2][3]</sup> [Chapter 1](/ccar-p/read/pro-notes/01-from-business-problem-to-architecture) compares them. The constraint to remember here: Managed Agents, including its multiagent features, is **not eligible for zero data retention or HIPAA**, because sessions are stateful and transcripts persist until you delete them.<sup>[3][4]</sup>

### Reading the evidence

| Symptom | Likely cause |
|---|---|
| An agent takes a different number of steps on near-identical inputs, and auditors object | The task has fixed steps. It should be a workflow |
| Optimizing the prompt for one input type hurts another | Distinct categories share one prompt. Route them<sup>[1]</sup> |
| An evaluator loop runs many rounds without improving | No clear criteria, or the evaluator cannot give actionable feedback |
| A routing workflow's errors are concentrated in one downstream path | Misclassification upstream, not the downstream prompt |
| A chained pipeline is accurate but too slow | Sequential calls on independent steps. Section them in parallel |

## Multi-agent systems buy breadth with tokens, and only some problems pay for it

**The decision.** Whether to use more than one agent, and if so, how to orchestrate them: a lead that delegates and reads reports, a program that fans work out, or one agent that consults a stronger model.

### When multiple agents win

Anthropic's Research system is the main published evidence.<sup>[5]</sup>

- A multi-agent system with a Claude Opus 4 lead and Claude Sonnet 4 subagents **outperformed a single Opus 4 agent by 90.2%** on Anthropic's internal research eval. The gain came on **breadth-first** queries that pursue several independent directions at once.
- On BrowseComp, three factors explained 95% of performance variance, and **token usage alone explained 80%**. Multi-agent designs work largely because separate context windows let the system spend more tokens on the problem.
- The cost is large: agents used about **4x** the tokens of chat, and multi-agent systems about **15x**.
- They fit poorly when agents must **share the same context** or have **many dependencies** between them. The article notes that most coding tasks have fewer truly parallel parts than research.
- They excel at valuable tasks with **heavy parallelization**, information that **exceeds one context window**, and **many complex tools**.

The architect's test follows directly: is the task broad, parallel and valuable enough to justify roughly 15 times the tokens of a chat? If not, a single agent or a workflow is the better design.

### Orchestration options in Managed Agents

Claude Managed Agents offers three ways for an agent to involve others. This feature is in beta.<sup>[4]</sup>

| Approach | What happens | Use it when | Watch for |
|---|---|---|---|
| Subagents | The agent delegates tasks and reads each report. Each subagent has its own **persistent** session thread, so the agent can send follow-ups | The lead needs to follow up with a specialist, or needs listed specialists with their own prompts and tools | Delegation is **one level deep**. At most **25 child threads** per session at a time, idle ones included |
| Dynamic workflows | The agent writes a program that runs many agents in phases in the background and combines results | Work with many pieces, parallel work, or long tasks that should finish sooner, such as audits, migrations and cross-checking | Every agent uses tokens. Set a **session budget**. The agent cannot send follow-ups to a run's threads |
| Advisor | The primary thread consults a stronger model mid-turn for planning or review, and keeps doing the work itself | One agent should do the work, with a stronger model's judgment at key moments | Only the primary thread can consult it. Billed at the advisor model's rates |

Sources for the table: Anthropic's multiagent orchestration page.<sup>[4]</sup>

Facts from that page that items can turn on:

- **You enable the mechanisms. The agent decides when to use them.** To steer that choice, say in the system prompt when to start a workflow run and which small tasks to do directly. There is **no approval step** before a run starts, so "describe the plan and wait for my go-ahead" in a prompt is not enforced.<sup>[4]</sup>
- **One level only.** Listing an agent that itself has `multiagent` set fails with a 400 error.<sup>[4]</sup> A design with nested managers does not run.
- **Pinning.** Listed agents are pinned to the version resolved when the lead is created or updated. Updating a specialist does not change the lead's behavior until the lead's list is updated.<sup>[4]</sup> This catches teams who "fixed the reviewer" and see no change.
- **Existing sessions keep their settings.** A session copies the multiagent setting when it is created.<sup>[4]</sup>
- **Budgets must be set at session creation.** You cannot add one to an existing session. Runs pause when the budget is reached.<sup>[4]</sup>
- **The advisor pairing is constrained.** The agent's own model must not be more capable than its advisor.<sup>[4]</sup>
- **Inference geography must match** across the lead and every listed agent, or the request is rejected.<sup>[4]</sup>

### Scope is shared unless you narrow it

This is where multi-agent design meets security. All agents in a Managed Agents session **share the same sandbox, filesystem and vault credentials**, while each has its own context-isolated thread.<sup>[4]</sup> MCP servers are declared per agent definition. An **inline agent** (one the lead or a workflow defines on the fly) has no definition of its own, so it uses the **model, tools, MCP servers and skills of the agent the session runs**.<sup>[4]</sup>

The consequence: if the lead has a write-capable MCP server, an inline helper does too. To limit a helper's access, create it as a **predefined agent** that declares only the servers it needs, and **disable inline agents** under both `subagents` and `workflows` so only listed agents can run.<sup>[4]</sup> That removes the capability. A prompt telling helpers not to write is a compensating control (family 1).

### Production realities of multi-agent systems

The Research team's production lessons are a checklist for any orchestration item.<sup>[5]</sup>

- **Errors compound in stateful agents.** Restarting from scratch is expensive, so build the ability to **resume** from where an error occurred, combining the model's adaptability with deterministic retries and regular checkpoints.
- **Synchronous orchestration is simpler but creates bottlenecks.** The lead waits for each set of subagents, cannot steer them, and one slow subagent blocks the run. Asynchronous execution adds parallelism but makes coordination, state consistency and error propagation harder.
- **Small changes to the lead can unpredictably change subagent behavior.** Observability of decision patterns and interaction structure matters more than in single-agent systems.

### Options ranked by constraint

| When this dominates | Prefer |
|---|---|
| Cost | A single agent, or the advisor pattern: one worker with occasional expert input |
| Breadth and time to completion | Dynamic workflows or parallel subagents, with a session budget |
| Follow-up with specialists | Subagents, whose threads persist |
| Least privilege | Predefined agents with only the servers they need, inline agents disabled |
| Zero data retention or HIPAA | Not Managed Agents. Orchestrate in your own code on an eligible surface<sup>[3][4]</sup> |
| Tight dependencies between parts | Not multi-agent. One agent, or a sequential workflow<sup>[5]</sup> |

### Numbers worth knowing

| Fact | Value |
|---|---|
| Multi-agent gain on Anthropic's research eval | 90.2% over single-agent Opus 4<sup>[5]</sup> |
| Token use relative to chat | Agents about 4x. Multi-agent about 15x<sup>[5]</sup> |
| Variance explained by token usage (BrowseComp) | 80% (three factors explain 95%)<sup>[5]</sup> |
| Managed Agents child threads per session | At most 25 at a time, idle included<sup>[4]</sup> |
| Predefined agents per list | Up to 20 (separate lists for `subagents` and `workflows`)<sup>[4]</sup> |
| Delegation depth | One level<sup>[4]</sup> |

## Decompose along independence and verifiability

**The decision.** How to split a complex problem: into fixed steps, categories, parallel sections, dynamically chosen subtasks or refinement rounds. And how to describe each piece so the worker can do it.

### Five ways to cut a problem

| Cut | Pattern | Signal in the stem |
|---|---|---|
| By stage | Prompt chaining with gates | "First … then …", with a checkable intermediate result such as an outline<sup>[1]</sup> |
| By category | Routing, or a taxonomic hierarchy for many classes | Distinct input types. The ticket-routing guide suggests a hierarchy at **20+ intents**, at the cost of extra latency<sup>[6]</sup> |
| By independent part | Sectioning | Same checks over many items, or separate aspects of one item<sup>[1]</sup> |
| By discovery | Orchestrator-workers or multi-agent | "We cannot know in advance which files, sources or systems are involved"<sup>[1]</sup> |
| By round | Evaluator-optimizer | Clear criteria and measurable gain per round<sup>[1]</sup> |

The governing rule: **cut where the parts are independent and each part's result can be checked.** A cut between tightly dependent parts forces agents to share context they do not have, which is exactly where the Research article says multi-agent systems struggle.<sup>[5]</sup>

### A delegated piece needs a complete brief

The Research team found that short instructions such as "research the semiconductor shortage" led subagents to misread tasks and **duplicate each other's searches**. Each subagent needed an **objective, an output format, guidance on tools and sources, and clear task boundaries**.<sup>[5]</sup> [Foundations chapter 2](/ccar-f/read/notes/02-subagents) covers the mechanics of the handoff. The Pro points are about scale:

- **Scale effort to complexity, in the prompt.** Agents judge effort poorly, so the team embedded rules: simple fact-finding with **1 agent and 3–10 tool calls**, direct comparisons with **2–4 subagents and 10–15 calls each**, complex research with **more than 10 subagents**.<sup>[5]</sup> Early versions spawned 50 subagents for simple queries.
- **Parallelize at two levels.** The lead started 3–5 subagents at once instead of serially, and subagents called 3 or more tools in parallel. That cut research time by **up to 90%** on complex queries.<sup>[5]</sup>
- **Return condensed results.** A subagent may use tens of thousands of tokens exploring, but returns a distilled summary, often **1,000–2,000 tokens**.<sup>[7]</sup>
- **Bypass the "game of telephone" for large outputs.** Subagents can write their work to external storage and pass back **lightweight references**, which preserves fidelity and saves tokens.<sup>[5]</sup>
- **Persist the plan.** The Research lead saved its plan to memory, because content beyond its context window would be truncated.<sup>[5]</sup>

### Evaluate the decomposition, not just the answer

Agents that take different valid paths cannot be graded by checking for one prescribed path. The Research team graded **outcomes and a reasonable process**, with an LLM judge scoring factual accuracy, citation accuracy, completeness, source quality and tool efficiency in one call.<sup>[5]</sup> For agents that change state, they recommend **end-state evaluation**, with checkpoints where specific state changes should have happened.<sup>[5]</sup> They also started with **about 20 queries**, because early changes have large effects that a small set can detect.<sup>[5]</sup> [Chapter 8](/ccar-p/read/pro-notes/08-evaluation-testing-and-optimization) develops this.

### Reading the evidence

| Symptom | Likely cause |
|---|---|
| Subagents return overlapping findings and leave gaps | Vague briefs with no boundaries<sup>[5]</sup> |
| Simple questions spawn many agents and cost spikes | No effort-scaling rules in the lead's prompt<sup>[5]</sup> |
| Complex queries are slow, though each search is fast | Subagents or tool calls run serially<sup>[5]</sup> |
| Detail present in subagent work is missing from the final report | Everything passes through the lead's summary. Use stored artifacts and references<sup>[5]</sup> |
| A long run loses its plan midway | The plan lived only in the context window |
| Evals fail runs that reached the right answer by a different route | The eval checks steps instead of outcomes or end state |

## Worked design review: checking 400 product labels against new guidance

**The system.** A consumer-health company must check about 400 product labels against a new 60-page regulatory guidance document before a deadline three weeks away. Each label is checked against the same list of requirements. Flagged labels go to the regulatory team. The company's label system is writable through an MCP server, and a policy says no automated system may edit labels.

**The flawed design.** The team proposes a Managed Agents lead with nested managers: a lead, one manager agent per product line, and inline worker agents under each manager. Workers inherit the lead's tools, including the label system's MCP server. Each worker returns a free-form summary to its manager, which summarizes for the lead. A system-prompt line tells workers never to edit labels. To catch mistakes, an audit log records every MCP call.

**The constraint that decides.** The work is **independent and identical per item**. Every label gets the same checks, and no label's result depends on another's. That is sectioning, a fixed workflow, not a discovery problem.<sup>[1]</sup> The design also breaks in three specific ways:

- Nested managers cannot be built in Managed Agents. Delegation is one level, and listing an agent with `multiagent` set fails.<sup>[4]</sup>
- Inline workers inherit the lead's MCP servers, so they **can** edit labels. The prompt line and the audit log are compensating controls.<sup>[4]</sup>
- Two layers of summaries lose the exact clause and label text the regulatory team needs.<sup>[5]</sup>

**The better design.**

1. **A code-orchestrated sectioning workflow.** For each label, one call checks it against the requirements and returns structured findings: requirement, pass or fail, the quoted label text, and the guidance section.
2. **The guidance as a cached prefix.** All 400 calls share the same long guidance and instructions, so caching cuts the repeated input cost. On Sonnet 5.5 a cache read is 0.05x base input.<sup>[8]</sup>
3. **Batch processing.** With three weeks to the deadline, an up-to-24-hour turnaround is fine, and batch halves the price. The batch guide suggests the 1-hour cache for shared context.<sup>[8][9]</sup>
4. **A second, independent check on flagged labels and a sample of passed ones**, a voting-style pass that guards against both false alarms and misses.<sup>[1]</sup>
5. **No write path at all.** The workflow uses read-only access to fetch labels. The label system's write tools are never in reach.
6. **Evaluation first.** About 20 labels with known answers, reviewed by the regulatory team, form the first test set before the full run.<sup>[5]</sup>

**Why the tempting alternatives lose.**

- **"Use a multi-agent research system, as Anthropic did."** That system won on breadth-first discovery. Here the steps are known, so the extra tokens, about 15x chat, buy nothing.<sup>[5]</sup>
- **"A single agent that loops over all 400 labels."** Sequential and slow, and a long run invites compounding errors and context pressure for no benefit.<sup>[1][5]</sup>
- **"Keep the design but strengthen the system prompt and audit log."** Family 1. Remove the write capability instead.
- **"Move to the largest model to reduce misses."** Family 3. The stem gives no evidence that model capability is the problem. Measure on the 20-label set first.
- **"Run it as a Managed Agents dynamic workflow with predefined read-only checkers and inline agents disabled."** This is a defensible design: it fixes the nesting and the scope problem. But it pays for agent orchestration and session runtime on work that needs no planning, and it cannot use the Batch discount, because Managed Agents sessions have no batch mode.<sup>[8]</sup> When cost and predictability dominate, the plain workflow wins.

## How wrong answers are built

- **"Use an agent so it can handle any future case."** Family 2 when the stem stresses auditability or a fixed procedure. Known steps belong in a workflow.
- **"Add more subagents to improve quality."** Family 3 unless the task is breadth-first. More agents mean more tokens and coordination, not better judgment on dependent work.
- **"Tell inline helpers in the prompt not to use the write tool."** Family 1. Inline agents inherit the session agent's MCP servers. Use predefined agents and disable inline agents.<sup>[4]</sup>
- **"Add a manager layer between the lead and the workers."** Managed Agents delegation is one level deep.<sup>[4]</sup>
- **"The reviewer agent was updated, so the lead now uses the new version."** Listed agents are pinned until the lead's list is updated.<sup>[4]</sup>
- **"Ask the agent to wait for approval before starting a run."** There is no enforced approval step before a workflow run. A prompt instruction is guidance only.<sup>[4]</sup>
- **"Use orchestrator-workers for a fixed set of checks per document."** That is sectioning. Orchestrators earn their cost when subtasks depend on the input.<sup>[1]</sup>
- **"Subagents duplicated work, so switch to a bigger model."** Family 4. The evidence points to vague briefs without boundaries.<sup>[5]</sup>
- **"Add a classifier hierarchy for five intent types."** Extra latency for a problem the guide addresses only at 20+ categories.<sup>[6]</sup>
- **"Use Managed Agents multiagent for the HIPAA workload."** Not HIPAA-eligible.<sup>[4]</sup>

## What to remember

- Augmented LLM, then workflow (your code picks the path), then agent (the model picks the path). Start at the bottom.
- Chaining for fixed stages, routing for distinct categories, sectioning or voting for parallel work, orchestrator-workers when subtasks depend on the input, evaluator-optimizer when criteria are clear.
- Agents fit open-ended problems with unpredictable steps. They cost more and errors compound, so add stopping conditions, sandboxed testing and guardrails.
- Multi-agent: 90.2% better on breadth-first research, about 15x chat tokens, poor fit for shared-context or dependent work.
- Managed Agents: subagents (persistent threads, one level, 25 child threads), dynamic workflows (background program, set a budget at session creation), advisor (primary thread only). In beta, not ZDR- or HIPAA-eligible.
- Inline agents inherit the session agent's tools and MCP servers. Least privilege means predefined agents with inline agents disabled.
- Decompose where parts are independent and checkable. Brief each piece with objective, format, tools and boundaries, and scale effort to complexity.
- Evaluate outcomes and end state, starting with about 20 cases.

## Endnotes for this chapter

1. Definitions of the augmented LLM, workflows and agents; the advice to start with the simplest solution; when to use prompt chaining, routing, sectioning and voting, orchestrator-workers, evaluator-optimizer and autonomous agents; the cost and compounding-error risks of agents; and the principles of simplicity, transparency and a well-designed agent-computer interface. Anthropic, "Building effective agents" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/research/building-effective-agents
2. The Agent SDK runs Claude Code's agent loop and tools in a process you operate, compared with the CLI, the Client SDK and Managed Agents. Anthropic, "Agent SDK overview" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/agent-sdk/overview
3. Managed Agents is a hosted, stateful harness and is not eligible for Zero Data Retention or HIPAA BAA coverage. Anthropic, "Claude Managed Agents overview" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/managed-agents/overview
4. Subagents, dynamic workflows and the advisor; one-level delegation; the 25-child-thread limit; up to 20 predefined agents per list; version pinning; budgets set at session creation; no approval step before a run; advisor pairing rules; matching inference geography; the shared sandbox, filesystem and vault credentials; inline agents using the session agent's MCP servers; disabling inline agents; beta status and data-handling eligibility. Anthropic, "Multiagent orchestration" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/managed-agents/multiagent-orchestration
5. The Research system's orchestrator-worker architecture, the 90.2% gain, token-usage findings and 4x/15x token multiples, fit and non-fit conditions, delegation briefs, effort-scaling rules, parallelization and its time savings, outcome-based and end-state evaluation starting from about 20 queries, resumable execution, synchronous bottlenecks, and artifacts passed by reference. Anthropic, "How we built our multi-agent research system" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/research/multi-agent-research-system
6. A taxonomic hierarchy of classifiers is suggested for 20 or more intent categories, at the cost of added latency. Anthropic, "Ticket routing" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/use-case-guides/ticket-routing
7. Subagents explore with clean context windows and return condensed summaries, often 1,000–2,000 tokens. Anthropic, "Effective context engineering for AI agents" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/research/effective-context-engineering-for-ai-agents
8. Cache read multipliers, including 0.05x on Claude Sonnet 5.5, the 50% Batch API discount, the combination of batch and caching discounts, and the fact that the Batch discount does not apply to Managed Agents sessions, which have no batch mode and are also billed for session runtime. Anthropic, "Pricing" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/pricing
9. Batches can take up to 24 hours. The 1-hour cache duration is suggested for shared context in batches. Anthropic, "Batch processing" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/batch-processing
