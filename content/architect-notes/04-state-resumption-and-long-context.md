# Chapter 4: State, Resumption and Long Context

**Summary**: *A long-running agent has two memories: the context window, which is expensive, temporary and gets worse as it fills, and external state, which is cheap and durable. Reliable designs keep the context small and focused, write progress to files or application state, and resume from that state instead of trusting an old transcript to still be true.*

## Context is a budget that degrades before it runs out

Anthropic's context-engineering article describes **context rot**: as the number of tokens grows, a model's ability to recall and use any one piece of information goes down. It treats context as a finite **attention budget**. Good context engineering looks for the **smallest set of high-signal tokens** that gets the job done.<sup>[1]</sup> Larger windows do not remove the problem. The article expects windows of every size to keep suffering from context pollution and relevance problems.<sup>[1]</sup>

Claude Code's guidance makes the same point about cost. Most current models have a 1M-token window and compaction runs on its own, so running out is rare. But every request resends the whole conversation, so you still **pay for context you do not need**. The advice is to run `/clear` between unrelated tasks.<sup>[2]</sup>

## Six tools for keeping context small

| Technique | What it does | Best for |
|---|---|---|
| **Compaction** | Summarizes older turns and continues with the summary | Long conversations that need continuity |
| **Tool result clearing** (context editing) | Removes old tool results once they have been used | Agent loops with heavy tool output |
| **Structured note-taking** | The agent writes progress to a file outside the context and reads it back later | Multi-step work with clear milestones |
| **Subagents** | Detailed work happens in a separate context, and only a summary returns | Research and exploration with lots of reading |
| **Selective retrieval** | Keep lightweight references (paths, IDs, URLs) and load content only when needed | Large corpora and codebases |
| **Keeping recent turns verbatim** | The summary covers only older turns, and the last few stay word for word | Cases where the latest exchange must not be paraphrased |

### Compaction summarizes, so choose what it keeps

**Compaction** replaces older turns with a summary that Claude writes. On the Claude API, server-side compaction is the main strategy for long conversations, and it has variants. One keeps recent turns verbatim, and another runs in the background so work does not pause.<sup>[3]</sup> The engineering article warns that compaction that is too aggressive can lose details whose importance only shows up later. It recommends tuning the compaction prompt against real agent traces.<sup>[1]</sup>

In Claude Code and the Agent SDK, you can steer compaction. Add a "Compact Instructions" section to CLAUDE.md, use a `PreCompact` hook, or run `/compact` with a focus such as `/compact keep the API decisions`. Rules that must hold for the whole session belong in CLAUDE.md, because CLAUDE.md is put back in from disk after compaction rather than summarized.<sup>[4]</sup>

The compaction table in Claude Code's context-window page is a frequent source of trick questions.<sup>[5]</sup>

- **Re-injected after compaction:** the system prompt, project-root CLAUDE.md, rules without `paths`, auto memory, skill descriptions, a fresh git status snapshot, and the **plan file** written in plan mode.
- **Summarized away:** **path-scoped rules and nested CLAUDE.md files**. They entered as message history when a matching file was touched. If a rule must survive compaction, remove its `paths:` frontmatter or move it into the root CLAUDE.md.
- **Partly restored:** up to five recently read or edited files are re-read. Files over 5,000 tokens come back as a path reference only.

### Context editing clears what has already been used

On the Claude API, **context editing** runs server side before the prompt reaches Claude. Your application keeps the full history, and you do not need to sync anything.<sup>[6]</sup>

- `clear_tool_uses_20250919` clears older **tool results** once context passes a threshold you set. Old file contents and search results are rarely needed after Claude has used them.
- `clear_thinking_20251015` controls how many earlier **thinking blocks** are kept. If you use both strategies, list it first.
- Clearing tool results **invalidates the prompt cache** from that point on. Use `clear_at_least` so each clearing removes enough tokens to be worth the cache write.<sup>[6]</sup>

The context-engineering article calls tool result clearing one of the safest, lightest forms of compaction.<sup>[1]</sup>

### "Sliding window" means keeping recent turns and summarizing the rest

Exam options sometimes describe a **sliding window** that keeps the last N turns and drops everything older. Dropping turns outright loses decisions and facts with no record. The documented tools do this more safely: compaction that keeps recent turns verbatim and summarizes the older ones<sup>[3]</sup>, plus structured notes for the facts that must never be lost. When an option offers "truncate the oldest messages" against "compact with a summary and persist key facts to a notes file," the second is stronger.

## Structured state lets a pipeline resume where it stopped

Anthropic's research system is a good model for **state persistence**. Agents run for a long time and keep state across many tool calls, so an error partway through is costly. The system was built to **resume from where the error occurred** instead of restarting.<sup>[7]</sup> Four design choices made that work.

- The lead agent **saved its plan to external memory**, because context beyond 200,000 tokens would be truncated and the plan had to survive.<sup>[7]</sup>
- When a phase finished, the agent **summarized it into external memory** and could hand off to fresh subagents with clean contexts.<sup>[7]</sup>
- Subagents **wrote outputs to a filesystem** and passed back lightweight references. This avoided a "game of telephone" through the coordinator.<sup>[7]</sup>
- When a tool failed, the agent was **told about the failure** so it could adapt.<sup>[7]</sup>

Anthropic's prompting guide gives the same advice for long tasks that span several context windows.<sup>[8]</sup>

- Keep **structured state** in a structured file, such as test status in `tests.json`.
- Keep **free-form progress notes** in a text file, such as `progress.txt`.
- Use **git** as a log and as checkpoints you can restore.
- When a new window starts, it can be better to begin **fresh** and have Claude rebuild state from the filesystem ("review progress.txt, tests.json and the git log") than to rely on compaction.

For multi-agent pipelines, the practical shape is a **manifest**: one structured record per work item, with status (pending, in progress, done, failed), the output location, and the error if any. On restart, the coordinator reads the manifest, skips completed items, retries failed ones, and continues. It does not rerun finished work, and it does not depend on any agent's conversation history.

The **memory tool** on the Claude API supports this pattern. Claude reads and writes files in a `/memories` directory that your application stores. Claude checks that directory before starting a task, so work can continue across conversations.<sup>[9]</sup>

## Resume, fork, or start fresh

Session commands come up often.<sup>[10]</sup>

| Goal | Claude Code | Agent SDK |
|---|---|---|
| Pick up the most recent session in this directory | `claude --continue` | `continue: true` |
| Pick up a specific session | `claude --resume <id or name>` or `/resume` | `resume: <session_id>` |
| Branch off and try something without changing the original | `--fork-session` | `fork_session` / `forkSession` |
| Start clean | `/clear` | A new `query()` |

What a resumed session restores matters for stale-context questions. It brings back the last compaction summary plus the messages after it. A tool that was **still running when the process died is not rerun**. Some launch flags, including `--mcp-config`, `--settings` and `--add-dir`, are **not restored** and must be passed again.<sup>[10]</sup>

### When the transcript is stale, resume from state instead

Resuming is right when the world has not changed. If files were edited, branches moved or dependencies upgraded since the session, the transcript holds **facts that are no longer true**, such as old file contents and old test results. Claude will reason from them unless told otherwise.

The SDK sessions guide offers a cleaner path: **capture the results you need as application state** (decisions, analysis output, diffs) and pass them into a **fresh session's prompt**. It calls this often more robust than moving transcripts around.<sup>[11]</sup> When you do resume, say what changed and ask Claude to re-read the affected files before acting.

## Long codebases need targeted reads, isolation and scratchpads

For exploring a large codebase, these techniques combine.<sup>[1][5][12]</sup>

- **Targeted reads.** Search first (`Grep`, `Glob`, or a language server), then read only the matching ranges. Claude Code also lets you deny reads of irrelevant paths.
- **Subagent isolation.** Send broad searches to the Explore subagent or a custom read-only subagent, so its reading stays out of the main context and only the conclusion returns.
- **Scratchpad and notes files.** Have the agent write findings to a file as it goes, such as `NOTES.md` or a manifest of call sites, and re-read that file after compaction.
- **Scoped instructions.** Per-directory CLAUDE.md files, plus `claudeMdExcludes` for packages you never touch, keep irrelevant instructions out of context.

## Worked example: an overnight document pipeline that crashed at item 412

A pipeline processes 900 contracts. A coordinator assigns batches to extraction subagents. The host restarts at item 412. The team's first fix is `--resume` on the coordinator's session.

- **The problem with resuming.** The tool call in flight is not rerun, and the transcript cannot say which subagent results were written. It may also carry stale assumptions.
- **The better design.** Keep a manifest with one row per contract: status, output path, error. Subagents write results to files and report the path. On restart, a fresh coordinator reads the manifest and resumes from the first item not marked done.
- **Context hygiene.** The coordinator never holds full extraction outputs, only references and status counts. Its context stays small however long the run is.
- **Failures.** A failed item is marked failed with its error, retried, and if it fails again, sent to human review. One failure does not end the run.

## How wrong answers are built

- **"Use a bigger context window."** Context rot and cost still apply. Reduce and structure the context instead.
- **"Drop the oldest turns."** It loses facts with no record. Compact with a summary and keep key facts in a notes file.
- **"Resume the old session" after the code changed.** The transcript is now stale. Start fresh with captured state, or resume and say what changed.
- **"Put the critical rule in a path-scoped rule"** for a long session. It can be summarized away. Use root CLAUDE.md or an unscoped rule.
- **"Rerun the whole pipeline after a crash."** It wastes work and may duplicate side effects. Resume from a manifest.
- **"Have subagents return full documents to the coordinator."** That floods the coordinator. Write to files and return references.

## What to remember

- Context rot: quality drops as context grows. Aim for the smallest high-signal context.
- Compaction summarizes. Context editing clears used tool results server side. Clearing invalidates the cache, so use `clear_at_least`.
- After compaction in Claude Code, root CLAUDE.md, unscoped rules and the plan file come back. Path-scoped rules and nested CLAUDE.md do not.
- Persist plans, phase summaries and outputs outside the context. Pass references, not payloads.
- A manifest of work items makes a pipeline resumable without replaying history.
- `--continue` picks the latest session, `--resume` a specific one, `--fork-session` branches. Interrupted tools are not rerun.
- When the world has changed, pass captured state into a fresh session instead of resuming a stale one.

## Endnotes for this chapter

1. The article defines context rot, recommends the smallest high-signal context, and describes compaction, tool result clearing, structured note-taking, sub-agents and just-in-time retrieval with lightweight identifiers. Anthropic, "Effective context engineering for AI agents" (Anthropic Engineering, accessed 2026-11-01), https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
2. Claude Code's guide notes that running out of context is rare with large windows but unneeded context still costs on every request, so `/clear` between unrelated tasks. Anthropic, "Best practices for Claude Code" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/best-practices
3. Server-side compaction replaces older turns with a summary and has variants that keep recent turns verbatim or run in the background. Anthropic, "Compaction overview" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/build-with-claude/compaction
4. In the Agent SDK, persistent rules belong in CLAUDE.md, and compaction can be guided by CLAUDE.md instructions, a PreCompact hook or a focused `/compact`. Anthropic, "How the agent loop works" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/agent-sdk/agent-loop
5. Claude Code's context-window page lists what is re-injected after compaction and notes that path-scoped rules and nested CLAUDE.md files are summarized away. Anthropic, "Explore the context window" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/context-window
6. Context editing runs server side, can clear tool results or thinking blocks, and invalidates cached prefixes when it clears content. Anthropic, "Context editing" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/build-with-claude/context-editing
7. The research system saved its plan and phase summaries to external memory, resumed from errors instead of restarting, and had subagents write outputs to a filesystem and return references. Anthropic, "How we built our multi-agent research system" (Anthropic Engineering, accessed 2026-11-01), https://www.anthropic.com/research/multi-agent-research-system
8. For work across context windows, Anthropic recommends structured state files, free-form progress notes, git checkpoints, and sometimes starting fresh rather than compacting. Anthropic, "Prompting best practices" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
9. The memory tool lets Claude keep files in a client-side `/memories` directory that it checks before starting a task. Anthropic, "Memory tool" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool
10. Claude Code sessions can be continued, resumed or forked; interrupted tools are not rerun and some launch flags must be passed again. Anthropic, "Manage sessions" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/sessions
11. Instead of resuming a session, capturing results as application state and passing them to a fresh session is often more robust. Anthropic, "Work with sessions" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/agent-sdk/sessions
12. In large codebases, per-directory CLAUDE.md files, `claudeMdExcludes`, read deny rules and code intelligence keep irrelevant content out of context. Anthropic, "Set up Claude Code in a monorepo or large codebase" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/large-codebases
