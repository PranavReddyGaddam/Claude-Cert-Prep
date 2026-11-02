# Chapter 7: Tools and MCP

**Summary**: *Claude chooses tools from their names, descriptions and schemas, and recovers from failures using the error text you return. Good tool design means clear boundaries between tools, errors the model can act on, and only the tools each agent needs. MCP adds a standard way to connect tools and data, with configuration scopes, credential handling and discovery checks that the exam tests directly.*

## The description is what Claude selects on

Anthropic calls **detailed descriptions the most important factor** in tool performance. A good description says what the tool does, **when to use it and when not to**, what each parameter means, and any caveats, such as what the tool does not return. Aim for at least three or four sentences, more for complex tools.<sup>[1]</sup>

Several design rules follow.<sup>[1][2]</sup>

- **Draw boundaries between similar tools.** If `search_customers` and `search_orders` both take "a name or ID," say in each description which requests belong to it and which belong to the other.
- **Consolidate related operations.** Rather than `create_pr`, `review_pr` and `merge_pr`, one tool with an `action` parameter can reduce overlap.
- **Namespace names** by service or resource, such as `github_list_prs`. Anthropic's tool-writing article found that the choice between prefix and suffix namespacing had measurable effects in its evaluations.<sup>[2]</sup>
- **Use `input_examples`** for inputs with complex structure. Examples that do not match the schema return a 400.<sup>[1]</sup>
- **Do not just wrap API endpoints.** Build tools around the tasks an agent actually does.<sup>[2]</sup>
- **Return high-signal fields and stable identifiers**, not every field the backend has.<sup>[1]</sup>
- **Offer a `response_format` option** (concise or detailed). In Anthropic's example, the concise form used about a third of the tokens.<sup>[2]</sup>
- **Paginate, filter and truncate with sensible defaults.** Claude Code caps tool responses at 25,000 tokens by default.<sup>[2]</sup>

The tool-writing article has a useful cautionary example. Claude kept adding "2025" to web search queries, which skewed results. The fix was a better tool description, not a model change.<sup>[2]</sup>

## Errors must say what went wrong and what to do next

MCP separates two kinds of failure.<sup>[3]</sup>

| Kind | Examples | How it is reported | Model's ability to fix |
|---|---|---|---|
| **Protocol error** | Unknown tool, malformed request, server crash | JSON-RPC error | Low |
| **Tool execution error** | Upstream API failure, invalid input, a business rule says no | A normal result with **`isError: true`** | High. The spec says clients **should** pass these to the model so it can correct itself |

A useful execution error carries enough structure for the model and the code around it to choose a response.

- **Category**: validation, not found, permission, rate limit, upstream outage, business rule.
- **Retryable or not**, and if retryable, **when** (for example, "retry after 30 seconds").
- **What to change**: which field was invalid and what values are allowed.
- **Partial results**, if some of the work succeeded.

Anthropic's guidance favors **actionable messages over opaque codes or stack traces**.<sup>[2]</sup> On the Claude API, the same idea applies to `tool_result` with `is_error: true`.<sup>[4]</sup>

In the Agent SDK, if a custom tool handler throws an uncaught exception, the SDK turns it into an error result containing the raw message. Returning an `isError` result yourself lets you write a message that helps, and the agent loop continues either way.<sup>[5]</sup>

### Retry-aware means the caller can tell transient from permanent

Exam distractors often blur these. A **timeout or rate limit** is transient, so retrying (after a delay) may work. A **validation failure** is fixed by changing the input, not by retrying the same call. A **business-rule denial**, such as "refund exceeds policy limit," should not be retried at all. It may need escalation. A single generic "operation failed" message makes all three look the same, so Claude retries what it should not, or gives up on what it could fix.

## Give each agent only the tools its role needs

Too many tools make selection harder and waste context. Several mechanisms help.

- **Per-subagent tool lists.** A research subagent gets search and read tools. A writer gets edit tools. A reviewer gets read-only tools (Chapter 2).<sup>[6]</sup>
- **Tool search.** Instead of loading every schema up front, tools can be **deferred** and discovered when needed. Claude Code defers MCP tool schemas by default.<sup>[7]</sup>
- **Inline MCP servers on a subagent.** A server listed in a subagent's `mcpServers` frontmatter is available to that subagent only, so its tools never enter the main context.<sup>[6]</sup>
- **`tool_choice`.** Controls whether a call is required in a given request (Chapter 1).

## MCP servers are configured in three scopes

Claude Code reads MCP server definitions from three scopes.<sup>[7]</sup>

| Scope | Stored in | Who gets it | Use for |
|---|---|---|---|
| **local** (default) | `~/.claude.json`, under this project's path | You, in this project only | Personal or experimental servers, and personal credentials |
| **project** | `.mcp.json` at the repository root, committed | Everyone who clones the repo | Servers the team shares. Each person must **approve** them first |
| **user** | `~/.claude.json` | You, in every project | Personal tools you use everywhere |

When the same server name exists in several places, **local beats project, project beats user**, and those beat plugin servers and claude.ai connectors. The whole entry from the winning source is used. Entries are not merged field by field.<sup>[7]</sup> Project servers show as **"Pending approval"** until the user approves them.<sup>[7]</sup>

### Keep secrets out of `.mcp.json` with environment variables

`.mcp.json` supports `${VAR}` and `${VAR:-default}` in `command`, `args`, `env`, `url` and `headers`.<sup>[7]</sup> The team commits the file with `${GITHUB_TOKEN}`, and each developer sets the variable locally. Know the edge cases.<sup>[7]</sup>

- An **unset variable with no default** produces a warning in `claude mcp list`, and the literal text `${VAR}` is kept.
- An **empty string counts as set**, so the default is not used.
- Some credential variables, including `ANTHROPIC_API_KEY`, read as **empty when used in a remote server's `url` or `headers`**. Copy the value into a variable with your own name.

### Verify that tools were actually discovered

Configuration is not proof that the tools work. Check:<sup>[7][8]</sup>

- `claude mcp list` and `claude mcp get <name>` show configured servers and their status.
- `/mcp` inside a session shows connection status and tools.
- In headless runs, the **`system/init` event lists `mcp_servers` with a status for each**. `--mcp-config` **skips invalid entries silently**, so a CI job should check this field rather than assume the server loaded. `--strict-mcp-config` uses only the servers given in `--mcp-config`.

## Resources are data the application supplies, tools are actions the model calls

MCP defines both, with different control models.<sup>[9][10]</sup>

- **Tools** are **model-controlled**. Claude decides when to call them, and they can have side effects.
- **Resources** are **application-driven** context: files, schemas, documents, identified by URI. The application or user decides what to include.

In Claude Code, you reference a resource with an @-mention such as `@server:protocol://resource/path`.<sup>[7]</sup> Read-only reference material, such as a database schema or a policy document, fits a resource. An operation such as "create ticket" is a tool. The spec also says tool annotations (hints like read-only) should be treated as **untrusted** unless the server is trusted.<sup>[3]</sup>

## Choose Claude Code's built-in tools by what the step needs

| Need | Tool | Notes |
|---|---|---|
| Find files by name or pattern | `Glob` | Fast pattern matching on paths |
| Find text in files | `Grep` | Ripgrep-based. Modes: `files_with_matches` (default), `content`, `count` |
| Read a file or a range | `Read` | Absolute paths, line ranges, PDF page ranges |
| Change part of a file | `Edit` | Needs an exact, **unique** `old_string` (or `replace_all`) and a prior read |
| Create or replace a whole file | `Write` | For new files or full rewrites |
| Run builds, tests, git | `Bash` | Also where find and grep run when Glob and Grep are not present |

On macOS, Linux and WSL, the default tool set **leaves out `Glob` and `Grep`**, and Claude uses fast `find` and `grep` through Bash instead. They come back when you name them with `--tools` or `--allowedTools`, or in a subagent whose `tools` list has no `Bash`.<sup>[11]</sup> Safe choice means search first, then read narrowly. Use `Edit` for targeted changes rather than rewriting files with `Write`. Do not use `Bash` to edit files when `Edit` exists, because `Edit` checks that the target text is exact and unique.<sup>[11]</sup>

## Worked example: a support agent that loops on refunds

An agent has `lookup`, `search` and `find` tools, all described as "gets information." It also has a `refund` tool whose errors return `{"error": "failed"}`. Logs show the agent picks lookup tools at random and retries refunds five times when a policy limit is hit. Each developer also has a personal token committed in `.mcp.json`.

- **Selection.** Rename and merge the overlapping tools, for example `orders_get` and `kb_search`. State in each description what it covers and when to use the other.
- **Errors.** Return `isError: true` with a category (`policy_limit`), `retryable: false`, the limit, and a suggestion (escalate to a human). Mark timeouts as retryable with a delay.
- **Secrets.** Replace the token with `${SUPPORT_API_TOKEN}` in the committed `.mcp.json`. Each developer sets it locally, or keeps a personal server in local scope.
- **Verification.** In CI, assert that the support server shows as connected in `system/init` before trusting the run.

## How wrong answers are built

- **"Shorten descriptions to save tokens."** Descriptions are the main selection signal. Make them detailed.
- **"Return a JSON-RPC error for an invalid input."** Execution failures belong in the result with `isError: true`, so Claude can fix the input.
- **"Retry every error with backoff."** Validation and policy failures will not succeed on retry.
- **"Put the API key in `.mcp.json`."** Use `${VAR}` expansion, or local scope.
- **"Project scope overrides local."** Local wins, and entries are not merged.
- **"The server is in the config, so its tools are available."** Check `/mcp`, `claude mcp list` or the `system/init` status.
- **"Expose the schema as a tool."** Passive reference data fits a resource.
- **"Give every agent every tool."** Scope tools by role, and defer the rest.

## What to remember

- Detailed descriptions with when-to-use and when-not-to-use. Namespace and consolidate similar tools.
- Protocol errors go through JSON-RPC. Execution errors return `isError: true` to the model.
- Errors should state the category, whether to retry and when, what to change, and any partial results.
- MCP scopes: local (default, private), project (`.mcp.json`, shared, needs approval), user (all projects). Local wins.
- `${VAR}` and `${VAR:-default}` in `.mcp.json`. Unset with no default keeps the literal text and warns.
- Verify with `claude mcp list`, `/mcp`, or `system/init` in headless runs. `--mcp-config` skips bad entries silently.
- Tools are model-controlled actions. Resources are application-provided data.
- `Glob` finds paths, `Grep` searches content, `Read` reads, `Edit` needs a unique match.

## Endnotes for this chapter

1. Detailed descriptions are the most important factor in tool performance, and the define-tools page also covers input examples, consolidation, namespacing and high-signal returns. Anthropic, "Define tools" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools
2. Anthropic's tool-writing article covers namespacing effects, response-format options, pagination and truncation defaults, actionable errors, task-shaped tools, and the search-query description fix. Anthropic, "Writing effective tools for agents — with agents" (Anthropic Engineering, accessed 2026-11-01), https://www.anthropic.com/engineering/writing-tools-for-agents
3. The MCP specification separates protocol errors from tool execution errors reported with `isError`, and says annotations from untrusted servers should be treated as untrusted. Anthropic, "Tools" (MCP Specification, accessed 2026-11-01), https://modelcontextprotocol.io/specification/2026-07-28/server/tools
4. A tool result can set `is_error` and should explain the failure in a way that helps Claude recover. Anthropic, "Handle tool calls" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls
5. In the Agent SDK, uncaught handler exceptions become error results, while returning `isError` lets the tool control the message. Anthropic, "Give Claude custom tools" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/agent-sdk/custom-tools
6. Subagents can be given their own tool lists and their own inline MCP servers that stay out of the main context. Anthropic, "Create custom subagents" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/sub-agents
7. Claude Code's MCP page covers local, project and user scopes, precedence, project approval, environment-variable expansion and its edge cases, verification commands, deferred tool schemas and resource @-mentions. Anthropic, "Connect Claude Code to tools via MCP" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/mcp
8. In SDK and headless runs, the init message reports each MCP server's status and invalid config entries can be skipped without an error. Anthropic, "Connect to external tools with MCP" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/agent-sdk/mcp
9. MCP describes tools as model-controlled and resources as application-driven context. Anthropic, "Understanding MCP servers" (MCP Specification, accessed 2026-11-01), https://modelcontextprotocol.io/docs/2026-07-28/learn/server-concepts
10. MCP resources expose data identified by URIs for clients to read. Anthropic, "Resources" (MCP Specification, accessed 2026-11-01), https://modelcontextprotocol.io/specification/2026-07-28/server/resources
11. The tools reference describes Glob, Grep, Read, Edit, Write and Bash, Edit's unique-match rule, and when Glob and Grep are absent by default. Anthropic, "Tools reference" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/tools-reference
