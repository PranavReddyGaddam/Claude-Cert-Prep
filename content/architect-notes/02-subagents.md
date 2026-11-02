# Chapter 2: Subagents

**Summary**: *A subagent is a separate Claude instance with its own system prompt, its own tool list and a fresh context window. Its only input from the parent is the prompt string the parent writes. Most subagent failures come from that one fact: the subagent cannot see what the parent knows, and the parent cannot see the subagent's working.*

## A subagent starts with almost nothing from its parent

In the Agent SDK, you can define subagents in code with the `agents` option (each an `AgentDefinition`), as Markdown files in `.claude/agents/`, or rely on the built-in general-purpose agent. The parent starts them through the **Agent tool**. That tool was called **Task** before Claude Code v2.1.63, and `Task(...)` still works as an alias.<sup>[1]</sup> For the parent to delegate at all, **`"Agent"` must be in the parent's `allowedTools`**.<sup>[1]</sup>

What a non-fork subagent receives is short and worth memorizing.<sup>[1]</sup>

| A subagent receives | A subagent does **not** receive |
|---|---|
| Its own system prompt (the definition's `prompt`) | The parent's conversation history |
| The prompt string the parent passes to the Agent tool | The parent's tool results, such as files it already read |
| Project CLAUDE.md (unless `omitClaudeMd` is set) | The parent's system prompt |
| The tools its definition allows | Skills, unless listed in its `skills` field |

The SDK docs put it plainly: the **Agent tool's prompt string is the only channel** from parent to subagent. File paths, error messages, decisions already made and constraints all have to be written into it.<sup>[1]</sup>

## A complete handoff prompt carries findings, data and provenance

Anthropic's multi-agent research system learned this the hard way. Short, vague task descriptions led subagents to **duplicate each other's work** or misread the task. The lead agent improved once each delegation stated four things.<sup>[2]</sup>

1. **An objective.** What question this subagent answers.
2. **An output format.** What shape the answer comes back in.
3. **Guidance on tools and sources.** Where to look and what to trust.
4. **Clear task boundaries.** What is out of scope, so parallel workers do not overlap.

For an architect, a complete handoff adds what the parent already knows.

- **Findings so far**, so the subagent does not redo them.
- **Structured data**, such as IDs, file paths or records, rather than a prose paraphrase.
- **Source metadata**: where each fact came from and how current it is, so the subagent can weigh conflicts and cite back.

The same rule applies on the way back. Define what the subagent returns, for example a list of findings each with a claim, a source and a confidence note. The SDK also warns that the parent may **summarize** what a subagent returns. If you need the output verbatim, say so in the parent's instructions.<sup>[1]</sup>

### Delegate the goal, not a script

There is a balance between too little and too much. A handoff with no objective produces wandering. A handoff that dictates every step throws away the subagent's judgment and breaks when reality differs from the script. Anthropic's context-engineering article calls the target the **"right altitude"**: specific enough to guide, flexible enough to let the model use good heuristics.<sup>[3]</sup> In practice, state the goal, the constraints and the definition of done, and let the subagent choose the steps.

## Tool restrictions are set by the definition's `tools` list

Each subagent can get a different tool set, and that is one of the main reasons to use one.<sup>[4]</sup>

- **Omitting a tool from `tools` removes it completely.** The subagent never sees it, so there is no permission prompt and no error to handle.<sup>[1]</sup>
- `disallowedTools` removes named tools and accepts MCP patterns such as `mcp__server`.<sup>[1]</sup>
- The SDK docs suggest common sets: **read-only analysis** gets `Read`, `Grep` and `Glob`. A **test runner** gets `Bash`, `Read` and `Grep`. A **code modifier** gets `Read`, `Edit`, `Write`, `Grep` and `Glob`.<sup>[1]</sup>

Claude Code's subagent page adds edge cases.<sup>[4]</sup>

- If both `tools` and `disallowedTools` are set, **`disallowedTools` is applied first**.
- A `disallowedTools` entry with a specifier, such as a particular Bash command pattern, removes the **whole tool**. To block only some Bash commands, use `permissions.deny` rules instead.
- If no tools remain after filtering, the subagent **refuses to launch**.
- `mcpServers` in a subagent's frontmatter can attach an MCP server to that subagent only, which keeps its tool definitions out of the main conversation.

### `allowedTools` approves, it does not restrict

In the SDK, `allowedTools` **auto-approves** the listed tools. Tools not on the list still exist and fall through to the permission mode. `disallowedTools` is what blocks.<sup>[5]</sup> The same trap exists for skills: a skill's `allowed-tools` field **pre-approves** tools while the skill runs and does not limit the others.<sup>[6]</sup> If the scenario says a reviewer "must not be able to edit files," the answer is a subagent `tools` list without `Edit` and `Write`, or a deny rule. An allow list alone does not do it.

## The description decides when Claude delegates

Claude picks a subagent automatically by matching the task against each agent's **`description`**. Write it as "use this agent when…". If a subagent must run, **name it explicitly** in the request. That guarantees it is used.<sup>[1]</sup> The `prompt` field is the subagent's **system prompt**. That is where its role belongs ("You are a security reviewer. You report, you do not fix.").

### Diagnosing a subagent that never runs or behaves wrongly

| Symptom | Likely cause |
|---|---|
| The parent never delegates | `"Agent"` missing from the parent's `allowedTools`, or a vague `description` |
| A filesystem agent is ignored | Missing `name` or `description`, `---` not on line 1, or invalid YAML. A new agents directory also needs a restart<sup>[4]</sup> |
| A frontmatter field has no effect | Unknown fields are silently ignored. Run `claude --debug` and look for "does not recognize or apply"<sup>[4]</sup> |
| Two definitions conflict | A programmatic `agents` definition overrides a filesystem one with the same name<sup>[1]</sup> |
| The subagent asks about things the parent already knew | The prompt string left out context. Nothing else carries it |
| `permissionMode` in the definition seems ignored | It does not apply when the parent runs in `bypassPermissions`, `acceptEdits` or `auto`<sup>[4]</sup> |

## Other `AgentDefinition` fields you should recognize

`description` and `prompt` are required. The others are optional: `tools`, `disallowedTools`, `model` (an alias such as `sonnet`, or `inherit`), `skills`, `memory`, `mcpServers`, `maxTurns`, `background`, `effort`, `permissionMode`, `omitClaudeMd` and a few more.<sup>[1]</sup> Two behaviors come up in questions.

- **`maxTurns`** caps the subagent's turns and returns whatever partial output it has when the cap is hit.<sup>[1]</sup>
- Subagents run in the **background by default** and report status `async_launched`. Set `background: false` when the parent must wait.<sup>[1]</sup>

Limits also exist for safety. `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` defaults to 3 (setting it to 1 disables nesting), and `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` defaults to 20.<sup>[1]</sup>

## A fork is a subagent that keeps the conversation

`subagent_type: "fork"` starts a subagent that **inherits the parent's conversation** instead of starting clean. You can block forks with an `Agent(fork)` deny rule.<sup>[1]</sup> Choose a fork when the side task needs everything discussed so far. Choose a normal subagent when you want **isolation**, so the side task's file reads and dead ends stay out of the main context.

Do not confuse this with the skill setting **`context: fork`**. That runs a skill's content as the prompt of a new, isolated subagent that does **not** see the conversation history.<sup>[6]</sup>

## Worked example: a security reviewer that rewrites code

A team defines a `security-reviewer` subagent. The parent passes "review the auth changes." The reviewer reports problems that were fixed two commits ago, sometimes edits files to "fix" findings, and its output arrives in the parent as a two-line summary.

- **Stale findings.** The reviewer could not see which files changed or what was already fixed. The handoff prompt should list the changed paths, the relevant diff or commit range, prior findings with their status, and the output format.
- **Unwanted edits.** Its definition had no `tools` field, so it inherited a full tool set. Set `tools: ["Read", "Grep", "Glob"]`. An `allowedTools` entry would not help, because that only approves.
- **Lost detail.** The parent summarized the result. Ask for a structured report (for example, one entry per finding with file, line, severity and evidence) and tell the parent to pass findings through verbatim.
- **Role drift.** Put "report only, never modify" in the subagent's `prompt`, its system prompt. But rely on the tool list for enforcement.

## How wrong answers are built

- **"The subagent can read the parent's earlier tool results."** It cannot. Only the prompt string crosses over.
- **"Add the tool to `allowedTools` to restrict the subagent."** `allowedTools` approves. Restrict with `tools`, `disallowedTools` or deny rules.
- **"Use `disallowedTools: ['Bash(rm *)']` to block one command."** A specifier there removes all of Bash. Use `permissions.deny`.
- **"Tell the subagent in its prompt not to use Write."** That is guidance, not enforcement. Leave `Write` out of `tools`.
- **"Give every subagent every tool for flexibility."** It widens the blast radius and makes tool selection harder. Scope tools to the role.
- **"Script each step for the subagent."** Delegate the goal with constraints and a definition of done.
- **"`context: fork` gives the skill the conversation."** It does the opposite.

## What to remember

- Parent to subagent: **the prompt string only**. No history, no tool results, no parent system prompt.
- A good handoff has an objective, an output format, tool and source guidance, boundaries, prior findings, structured data and provenance.
- `"Agent"` (alias `Task`) must be in the parent's `allowedTools`.
- `tools` removes everything not listed. `allowedTools` and skill `allowed-tools` only pre-approve.
- `description` drives automatic delegation. Naming the agent guarantees it. `prompt` is the role.
- Forks inherit the conversation. `context: fork` skills do not.
- `maxTurns` returns partial output. Subagents run in the background unless `background: false`.

## Endnotes for this chapter

1. The SDK subagent guide covers the three ways to define subagents, the Agent tool and its Task alias, what context a subagent inherits, tool scoping, `AgentDefinition` fields, forks, background execution and spawn limits. Anthropic, "Subagents in the SDK" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/agent-sdk/subagents
2. Anthropic found that each subagent needs an objective, an output format, tool and source guidance and clear boundaries, or it duplicates work. Anthropic, "How we built our multi-agent research system" (Anthropic Engineering, accessed 2026-11-01), https://www.anthropic.com/research/multi-agent-research-system
3. System prompts should sit at the right altitude, between brittle hard-coded logic and vague guidance. Anthropic, "Effective context engineering for AI agents" (Anthropic Engineering, accessed 2026-11-01), https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
4. Claude Code's subagent page documents frontmatter, the order in which tool filters apply, launch failures, inline MCP servers, permission-mode interactions and debug output for unknown fields. Anthropic, "Create custom subagents" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/sub-agents
5. `allowedTools` auto-approves the listed tools while `disallowedTools` blocks tools. Anthropic, "How the agent loop works" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/agent-sdk/agent-loop
6. A skill's `allowed-tools` pre-approves tools rather than restricting them, and `context: fork` runs the skill in an isolated subagent without conversation history. Anthropic, "Extend Claude with skills" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/skills
