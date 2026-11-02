# Chapter 3: Shape of the Work

**Summary**: *Before choosing tools or agents, decide what shape the task has. Is it a fixed sequence, a set of independent pieces, or a problem whose steps only become clear as you go? Is the change small enough to just make, or risky enough to plan first? The right answer is usually the simplest shape that fits the uncertainty in the task.*

## Workflows follow your code paths, agents choose their own

Anthropic separates two kinds of agentic system. A **workflow** runs LLM calls and tools through **code paths you define in advance**. An **agent** lets the model **decide its own steps and tool use** as it goes.<sup>[1]</sup> Workflows give predictability for well-defined tasks. Agents give flexibility when you cannot know the steps up front. For many applications, a single well-prompted call with retrieval and examples is enough, and no agentic system is needed at all.<sup>[1]</sup>

The same article names five workflow patterns. Exam scenarios usually describe one without naming it.<sup>[1]</sup>

| Pattern | Shape | Pick it when |
|---|---|---|
| **Prompt chaining** | Fixed steps in sequence, with optional code checks ("gates") between them | The task splits cleanly into known subtasks, and accuracy matters more than latency |
| **Routing** | Classify the input, then send it to a specialized prompt, tool set or model | Inputs fall into distinct categories that are better handled separately |
| **Parallelization** | Run independent sections at once (sectioning), or the same task several times (voting) | Pieces are independent, or you want several attempts for higher confidence |
| **Orchestrator-workers** | A central model breaks the task down at runtime and delegates the pieces | You **cannot predict the subtasks** until you see the input |
| **Evaluator-optimizer** | One call generates, another critiques, in a loop | Clear evaluation criteria exist and feedback measurably improves the output |

The key difference between parallelization and orchestrator-workers is **who decides the subtasks**. In parallelization they are fixed in code. In orchestrator-workers the orchestrator decides them for each input.<sup>[1]</sup>

## Sequential decomposition fits known steps, adaptive fits discovery

**Sequential (fixed) decomposition** is prompt chaining. You know the stages, such as extract, then validate, then summarize. You can put a gate between stages that stops the pipeline if a check fails.

**Adaptive decomposition** means the plan changes as findings arrive. Anthropic's research system starts wide and then narrows. The lead agent writes a plan, spawns subagents for different angles, reads what they return, and decides whether more research is needed.<sup>[2]</sup> The article also says the lead should **scale effort to the task**. A simple fact-finding question gets one agent with about 3 to 10 tool calls. A direct comparison gets 2 to 4 subagents with about 10 to 15 calls each. Complex research may use more than 10 subagents with clearly divided responsibilities.<sup>[2]</sup>

Signals that a task needs adaptive decomposition:

- The number of pieces depends on what you find, such as "every service that calls this deprecated API."
- Early results change what the later questions are.
- The work is **breadth-first and parallelizable**, such as research across many independent sources.

Signals against it:

- The steps are known and stable. A fixed chain is cheaper and easier to test.
- The pieces are **tightly coupled**. Anthropic notes that coding tasks usually have fewer truly parallel parts than research, so multi-agent designs pay off less there.<sup>[2]</sup>
- Cost matters. Anthropic measured agents using about 4 times the tokens of a chat interaction, and multi-agent systems about 15 times.<sup>[2]</sup>

## Coordinator topologies trade isolation against coordination

A **coordinator with subagents** (hub and spoke) keeps the coordinator's context clean. Workers explore in their own context windows and return condensed results.<sup>[3]</sup> In the research system, multi-agent with an Opus lead and Sonnet workers beat a single agent by 90.2% on Anthropic's internal research evaluation.<sup>[2]</sup> **Chained subagents**, where each one's output feeds the next, suit multi-step work in Claude Code. Each subagent finishes and returns results, and the main conversation passes the relevant context to the next one.<sup>[4]</sup>

When choosing, ask three questions.

1. **Are the pieces independent?** If yes, parallel workers help. If no, a single agent or a chain avoids conflicting edits.
2. **Will the detail flood the main context?** If yes, isolate it in a worker that returns a summary.
3. **Does the coordinator need to decide the next step from results?** If yes, use orchestrator-workers. If no, a fixed chain will do.

## Plan mode, direct execution, or a multi-phase workflow

In Claude Code, the same shape question shows up as "plan, or just do it?"

**Plan mode** has Claude research and propose without editing source files. It reads files, can run shell commands to explore, and writes a plan. **Edits stay blocked until you approve the plan.**<sup>[5]</sup> Enter it with `Shift+Tab`, a `/plan` prefix on one prompt, or `--permission-mode plan` at launch. `Ctrl+G` opens the plan in your editor. When you approve, you choose which permission mode the session continues in, or you keep planning.<sup>[5]</sup> To make plan mode the default for a project, set `permissions.defaultMode` to `"plan"` in a settings file.<sup>[5]</sup>

For large codebases, Anthropic recommends planning **before** cross-package edits. Claude writes the plan to a file, and that file is put back into context after compaction, so a long session does not lose the plan.<sup>[6]</sup>

| Situation | Best shape | Why |
|---|---|---|
| A one-line fix in a known file | **Direct execution** | Planning adds a round trip with nothing to decide |
| A change touching many files or an unfamiliar area | **Plan mode first** | You review the approach before anything touches disk |
| You do not yet know what you want | **Interview, then spec, then build** | Claude asks questions and writes `SPEC.md`, then a fresh session builds from it<sup>[7]</sup> |
| You only need to understand the code | **Explore subagent** | It searches without editing and keeps the reading out of your main context<sup>[4]</sup> |
| One large mechanical change across many files | **Multi-phase with parallel units** | `/batch` splits the work into units, shows the plan, and runs each unit in its own worktree<sup>[7]</sup> |

The built-in **Explore** subagent is read-only and chooses a thoroughness level: *quick* for targeted lookups, *medium*, or *very thorough*. It starts **without CLAUDE.md and the git status snapshot** so research stays fast and cheap.<sup>[4]</sup>

A **multi-phase workflow** separates phases deliberately: explore, then plan, then implement, then verify. Each phase can run in a fresh context with a written artifact (a findings file, a plan, a spec) carried forward. The interview pattern is a two-phase example. One session produces `SPEC.md`. A **fresh session** builds from it with a clean context and a written definition of done. The same spec later anchors an independent review.<sup>[7]</sup>

## Worked example: migrating every caller of a deprecated client

A platform team must replace a deprecated HTTP client across a monorepo. Nobody knows how many services use it. Some calls are wrapped in custom retry helpers.

- **Shape.** The number of call sites is unknown until you search, so the subtasks cannot be fixed in advance. That is **orchestrator-workers**, or adaptive decomposition.
- **Phase 1, explore.** An Explore subagent (or a read-only custom subagent) finds every call site and writes a manifest: file, call pattern, and whether a retry wrapper is involved. The searching stays out of the main context.
- **Phase 2, plan.** In plan mode, Claude proposes the migration approach per pattern. The team approves the plan, which is written to a file that survives compaction.
- **Phase 3, implement.** Independent services can be migrated in parallel units, each in its own worktree. Services with shared helpers go in sequence, because their edits would conflict.
- **Phase 4, verify.** A separate review pass checks each change against the plan and the tests.

The wrong choices are easy to spot. Starting edits directly, without planning, in an unknown blast radius. A fixed prompt chain that assumes a known list of services. Running every service in parallel, including those that share helpers.

## How wrong answers are built

- **"Use a multi-agent system" for a small, fixed task.** It adds cost and coordination with no benefit. Start simple.
- **"Parallelize everything."** Coupled pieces produce conflicting changes. Parallelize only independent work.
- **"Plan mode for a typo fix."** It is not wrong, just wasteful. Questions usually want direct execution for small, clear changes.
- **"Direct execution for a large refactor in unfamiliar code."** That skips the review point that plan mode provides.
- **"Prompt chaining when the subtasks depend on the input."** If you cannot list the steps in advance, you need an orchestrator.
- **"Plan mode stops Claude from running any commands."** It blocks edits to source. Claude can still read files and run shell commands to explore.

## What to remember

- Workflows follow predefined code paths. Agents choose their own steps. Prefer the simplest design that works.
- Know the five patterns: chaining, routing, parallelization (sectioning or voting), orchestrator-workers, evaluator-optimizer.
- Orchestrator-workers decides subtasks at runtime. Parallelization fixes them in code.
- Scale effort to the task: about 3 to 10 calls for simple work, 2 to 4 subagents for comparisons, more than 10 only for complex research.
- Plan mode blocks edits until approval. Enter with `Shift+Tab`, `/plan` or `--permission-mode plan`.
- Interview, then `SPEC.md`, then a fresh session to build. Use Explore for read-only understanding.

## Endnotes for this chapter

1. Anthropic distinguishes workflows from agents, recommends the simplest workable solution, and describes prompt chaining, routing, parallelization, orchestrator-workers and evaluator-optimizer. Anthropic, "Building effective agents" (Anthropic Engineering, accessed 2026-11-01), https://www.anthropic.com/engineering/building-effective-agents
2. The research system scales subagent count to query complexity, starts wide then narrows, outperformed a single agent by 90.2%, uses far more tokens than chat, and fits coding less well than research. Anthropic, "How we built our multi-agent research system" (Anthropic Engineering, accessed 2026-11-01), https://www.anthropic.com/research/multi-agent-research-system
3. Sub-agent architectures keep detailed search context inside workers while the lead agent synthesizes condensed results. Anthropic, "Effective context engineering for AI agents" (Anthropic Engineering, accessed 2026-11-01), https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
4. Claude Code delegates broad codebase searches to the read-only Explore agent, which picks a thoroughness level and starts without CLAUDE.md; chained subagents suit staged work. Anthropic, "Create custom subagents" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/sub-agents
5. Plan mode lets Claude read and explore but blocks source edits until a plan is approved, and can be entered from the keyboard, a prompt prefix, a CLI flag or the default mode setting. Anthropic, "Choose a permission mode" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/permission-modes
6. In large codebases Claude should plan cross-package changes first and write the plan to a file that survives compaction. Anthropic, "Set up Claude Code in a monorepo or large codebase" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/large-codebases
7. The best-practices guide describes interviewing to produce `SPEC.md`, building it in a fresh session, and using `/batch` to split large mechanical changes into worktree units. Anthropic, "Best practices for Claude Code" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/best-practices
