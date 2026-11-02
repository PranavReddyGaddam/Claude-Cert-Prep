# Chapter 10: Last-Week Review

**Summary**: *This chapter compresses the notes into decision rules and the distinctions exam items most often turn on. Use it to check yourself, not to learn things for the first time. If a line here surprises you, go back to the chapter it points to.*

## Ten decision rules that settle most scenarios

1. **"Must never" or "must always" means enforcement.** Use hooks, deny rules, tool lists, schemas or code checks, not prompt wording (Chapter 5).<sup>[1]</sup>
2. **Start simple.** Use a single call, then a workflow, and an agent only when the steps cannot be known in advance (Chapter 3).<sup>[2]</sup>
3. **A subagent knows only its prompt string.** Every needed fact, path, prior finding and source goes in the handoff (Chapter 2).<sup>[3]</sup>
4. **Restrict with `tools`, not with `allowedTools`.** Allow lists pre-approve. They do not remove (Chapters 2 and 6).<sup>[3][4]</sup>
5. **Answer all parallel tool calls in one user message.** Every `tool_use` gets a `tool_result` (Chapter 1).<sup>[5]</sup>
6. **Schemas guarantee shape, code checks truth.** Validate, then retry with the specific error, then send to a person (Chapter 8).
7. **Let schemas say "not found".** Use nullable fields, enums with "other", and evidence fields (Chapter 8).<sup>[6]</sup>
8. **Persist state outside the context.** Use manifests, notes files and references. Resume from state, not from a stale transcript (Chapter 4).<sup>[7]</sup>
9. **Review with fresh eyes.** Use a separate pass or session with criteria, read-only tools and structured output (Chapter 6).<sup>[8]</sup>
10. **Route review by risk.** Use validation failures, missing fields, disagreement and stakes, not random sampling (Chapter 9).

## Distinctions that decide close answers

| Pair | The difference |
|---|---|
| `tools` vs `allowedTools` | `tools` defines what exists. `allowedTools` pre-approves<sup>[3][4]</sup> |
| Skill `allowed-tools` vs subagent `tools` | The first pre-approves during the skill. The second restricts<sup>[9]</sup> |
| Fork subagent vs `context: fork` skill | A fork inherits the conversation. A `context: fork` skill runs isolated, without history<sup>[3][9]</sup> |
| `--continue` vs `--resume` vs `--fork-session` | Latest session, a named session, or a branch that leaves the original unchanged<sup>[10]</sup> |
| CLAUDE.md vs `.claude/rules/` with `paths` | Always loaded vs loaded when matching files are touched<sup>[11]</sup> |
| `@import` vs path rule | An import still loads at launch. A path rule defers loading<sup>[11]</sup> |
| User vs project vs local MCP scope | All projects (private), shared `.mcp.json` (approved), this project (private, the default). Local wins<sup>[12]</sup> |
| MCP tool vs resource | Model-controlled action vs application-provided data<sup>[13]</sup> |
| Protocol error vs `isError` result | JSON-RPC failure vs an execution failure the model can fix<sup>[14]</sup> |
| Structured outputs vs strict tool use | Constrains the response vs constrains tool inputs. They work together<sup>[6]</sup> |
| `tool_choice` `any` vs `tool` | Some tool vs a named tool. Both skip preamble and thinking. Rejected on the newest models<sup>[15]</sup> |
| Messages vs Message Batches | Synchronous vs asynchronous at 50% cost, within 24 hours, matched by `custom_id`<sup>[16]</sup> |
| Compaction vs context editing | Summarize old turns vs clear used tool results or thinking server side<sup>[17]</sup> |
| Plan mode vs direct execution | Propose with edits blocked until approval vs act at once<sup>[18]</sup> |
| `--tools` vs `--allowedTools` in CI | Restrict built-in tools vs pre-approve them<sup>[4]</sup> |

## Numbers worth knowing

| Fact | Value |
|---|---|
| Subagent spawn depth default | 3 (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`)<sup>[3]</sup> |
| Concurrent subagents default | 20<sup>[3]</sup> |
| CLAUDE.md import depth | 4 hops<sup>[11]</sup> |
| Suggested CLAUDE.md length | Under about 200 lines<sup>[1]</sup> |
| Few-shot examples | 3 to 5<sup>[19]</sup> |
| Query at the end of long inputs | Up to 30% better in Anthropic's tests<sup>[19]</sup> |
| Batch limits | 100,000 requests or 256 MB; 24-hour expiry; 29-day results; 50% price<sup>[16]</sup> |
| Server tool iteration default | 10, then `pause_turn`<sup>[20]</sup> |
| Claude Code tool response cap | 25,000 tokens by default<sup>[21]</sup> |
| Multi-agent vs single agent (research eval) | 90.2% better; about 15 times the tokens of chat<sup>[22]</sup> |

## Model-specific facts that change answers

- **Forced `tool_choice`** (`any` or `tool`) returns a 400 on Opus 5.5, Sonnet 5.5, Fable 5.1 and Mythos 5.1, and whenever manual extended thinking is enabled. Use `auto` with `strict: true`, or structured outputs.<sup>[15]</sup>
- **Prefilling** the final assistant turn returns a 400 from Claude 4.6 models onward. Use structured outputs or direct instructions.<sup>[19]</sup>
- **Parallel calls on Fable 5.1** may drop off in long loops. Repeat the instruction after each round of tool results.<sup>[19]</sup>

## A final self-check

Answer each in a sentence before the exam.

1. A coordinator spawns three researchers that keep covering the same sources. What is missing from the handoff?
2. A CI reviewer with `--allowedTools "Read,Grep"` still edits files. Why, and what is the fix?
3. A pipeline crashed at item 412 of 900. How does it resume without redoing work?
4. An extraction returns plausible due dates for invoices that have none. Which layer is wrong?
5. Three tool results come back in three user messages, and Claude stops making parallel calls. Why?
6. A migration rule in the root CLAUDE.md is ignored, and the file is 600 lines long. Where should the rule go?
7. A team commits `.mcp.json` with a token in it. What should it contain instead?
8. Human review uses a 5% random sample, and errors cluster in amended contracts. What should drive routing?
9. An Opus 5.5 integration sets `tool_choice: {"type": "any"}` and gets a 400. What is the replacement?
10. A long session forgets a rule that lived in a path-scoped rule file. What happened?

Answers, briefly: (1) objective, output format, source guidance and boundaries. (2) `allowedTools` only pre-approves, so use `--tools` or `--disallowedTools`. (3) A manifest with per-item status, and outputs written to files. (4) The schema forced a value, so make the field nullable. (5) Results must share one user message. (6) A `paths:`-scoped rule for the migrations directory. (7) `${VAR}` expansion. (8) Conflict flags, null fields, failed quote checks, disagreement and stakes. (9) `auto` with strict tools, or structured outputs. (10) Compaction summarized it away, so make it unscoped or move it into the root CLAUDE.md.

## Endnotes for this chapter

1. Deterministic controls are separated from advisory ones, and CLAUDE.md should stay under about 200 lines. Anthropic, "Best practices for Claude Code" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/best-practices
2. Start with the simplest solution and add agentic complexity only when it is justified. Anthropic, "Building effective agents" (Anthropic Engineering, accessed 2026-11-01), https://www.anthropic.com/engineering/building-effective-agents
3. Subagents receive only their prompt string from the parent, are restricted by their tools list, can be forks, and are limited by spawn depth and concurrency settings. Anthropic, "Subagents in the SDK" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/agent-sdk/subagents
4. `--tools` restricts built-in tools while `--allowedTools` lets listed tools run without prompts. Anthropic, "CLI reference" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/cli-reference
5. All results for parallel calls belong in one user message. Anthropic, "Parallel tool use" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use
6. Structured outputs and strict tool use constrain different things and can be combined. Anthropic, "Structured outputs" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/build-with-claude/structured-outputs
7. Capturing results as application state for a fresh session is often more robust than resuming. Anthropic, "Work with sessions" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/agent-sdk/sessions
8. Independent review uses a fresh subagent or second session that did not write the code. Anthropic, "Best practices for Claude Code" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/best-practices
9. A skill's `allowed-tools` pre-approves tools, and `context: fork` runs the skill in an isolated subagent. Anthropic, "Extend Claude with skills" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/skills
10. Sessions can be continued, resumed by ID or name, or forked. Anthropic, "Manage sessions" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/sessions
11. CLAUDE.md imports nest up to four hops and still load at launch, while path-scoped rules load when matching files are touched. Anthropic, "How Claude remembers your project" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/memory
12. MCP servers can be configured in local, project or user scope, with local taking precedence. Anthropic, "Connect Claude Code to tools via MCP" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/mcp
13. MCP tools are model-controlled and resources are application-driven. Anthropic, "Understanding MCP servers" (MCP Specification, accessed 2026-11-01), https://modelcontextprotocol.io/docs/2026-07-28/learn/server-concepts
14. MCP separates protocol errors from tool execution errors reported with `isError`. Anthropic, "Tools" (MCP Specification, accessed 2026-11-01), https://modelcontextprotocol.io/specification/2026-07-28/server/tools
15. Forced tool choice skips preamble and thinking and is rejected by the newest models and by manual extended thinking. Anthropic, "Define tools" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools
16. Message Batches cost half price, expire after 24 hours, keep results for 29 days and return results in any order. Anthropic, "Batch processing" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/build-with-claude/batch-processing
17. Context editing clears tool results or thinking blocks server side, separate from summary-based compaction. Anthropic, "Context editing" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/build-with-claude/context-editing
18. Plan mode blocks source edits until a plan is approved. Anthropic, "Choose a permission mode" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/permission-modes
19. The prompting guide recommends 3 to 5 examples and queries at the end of long inputs, says prefill returns a 400 from Claude 4.6 onward, and covers parallel calling on Fable 5.1. Anthropic, "Prompting best practices" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
20. Server tools pause with `pause_turn` after their default iteration limit. Anthropic, "How tool use works" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works
21. Claude Code limits tool responses to 25,000 tokens by default. Anthropic, "Writing effective tools for agents — with agents" (Anthropic Engineering, accessed 2026-11-01), https://www.anthropic.com/engineering/writing-tools-for-agents
22. The multi-agent research system outperformed a single agent by 90.2% and used about 15 times the tokens of chat. Anthropic, "How we built our multi-agent research system" (Anthropic Engineering, accessed 2026-11-01), https://www.anthropic.com/research/multi-agent-research-system
