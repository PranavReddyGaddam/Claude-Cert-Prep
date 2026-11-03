# Chapter 5: Integration Mechanisms and Capability Scope

**Summary**: *Three integration decisions recur in Pro items: how much an agent can reach, which mechanism connects it to each system, and when tool definitions enter its context. The right answer usually removes reach the task does not need, picks the simplest mechanism that the system's location and ownership allow, and loads definitions on demand once they crowd out the work.*

This chapter assumes the tool and MCP mechanics from [Foundations Chapter 7](/ccar-f/read/notes/07-tools-and-mcp) and the subagent tool-scoping rules from [Foundations Chapter 2](/ccar-f/read/notes/02-subagents). It does not re-teach them. Token-cost mechanics such as caching are in [Chapter 4](/ccar-p/read/pro-notes/04-context-tokens-and-reuse). Credentials and whose identity a call carries are in [Chapter 7](/ccar-p/read/pro-notes/07-identity-latency-and-observability).

## Capability bloat costs accuracy, tokens and blast radius at the same time

*Objective D3.1: Evaluate tool/agent configuration for capability bloat.*

### The decision

An architect reviews an agent's configuration and decides, for each tool, server, subagent and credential, whether it should exist for this agent at all. Capability bloat is reach the task does not need. It is easy to miss because each extra tool looks harmless and the agent still works most of the time.

Bloat has three separate costs, and a good answer names the one the stem is about.

| Cost | What happens | Evidence in the pages |
|---|---|---|
| **Tokens and latency** | Every definition is sent on every request | A five-server setup (GitHub, Slack, Sentry, Grafana, Splunk) uses about 55K tokens of definitions before any work, and Anthropic has seen definitions reach 134K tokens<sup>[1]</sup> |
| **Selection accuracy** | Claude picks the wrong tool or wrong parameters, most often between similar names | Selection accuracy degrades once an agent has more than 30–50 tools available<sup>[2]</sup>. Wrong tool selection and incorrect parameters are the most common failures, for example `notification-send-user` versus `notification-send-channel`<sup>[1]</sup> |
| **Blast radius** | Injected or mistaken instructions can only use tools that exist | Anthropic's Managed Agents guidance lists "smallest tool set" as the first control against untrusted input, with the example of a ticket telling the agent to cancel every open order<sup>[9]</sup> |

Anthropic's context-engineering article calls **bloated tool sets** one of the most common failure modes, and gives a test worth quoting in an answer: if a human engineer cannot say which tool fits a situation, the agent cannot be expected to do better. The fix it names is a **minimal viable set of tools**.<sup>[4]</sup> The tool-writing article adds that more tools do not always lead to better outcomes, and warns against tools that merely wrap every API endpoint. It recommends a few thoughtful tools aimed at high-impact workflows, consolidating frequently chained steps into one tool, and namespacing by service and resource.<sup>[5]</sup>

### Hiding, denying, deferring and approving are four different things

Most bloat items turn on this table. Only some mechanisms shrink what the agent can do. Others shrink what it sees, or only change whether a human is asked.

| Mechanism | Does Claude see the tool? | Can the call happen? | Security boundary? |
|---|---|---|---|
| Agent SDK `disallowed_tools=["Bash"]` (bare name) | No, the definition is removed | No | Yes<sup>[6]</sup> |
| Agent SDK `disallowed_tools=["Bash(rm *)"]` (scoped) | Yes, Bash stays | Matching calls are denied in every mode, including `bypassPermissions` | Yes, for calls that match the pattern as written<sup>[6]</sup> |
| Subagent `disallowedTools: Bash(git push *)` (scoped, in the agent definition) | No, the whole tool is removed from that subagent | No | Yes. To keep Bash and block one command, use a `permissions.deny` rule instead<sup>[20]</sup> |
| Agent SDK `allowed_tools=["Read"]` | Yes, and so are unlisted tools | Listed tools are auto-approved; unlisted tools fall through to the permission mode | No. With `bypassPermissions`, unlisted tools are still approved<sup>[6]</sup> |
| MCP connector toolset with `enabled: false` | No | No | Yes, for that request<sup>[7]</sup> |
| `defer_loading: true` (tool search) | Not until a search returns it | Yes, once discovered | **No.** It controls context, not reach<sup>[2]</sup> |
| `allowed_callers` (programmatic tool calling) | Yes | Claude is guided, not blocked | **No.** The page says not to rely on it as a security boundary<sup>[17]</sup> |

The two "No" rows are the traps. Deferring a destructive tool behind tool search does not stop Claude from finding and calling it. It only stops the definition costing tokens until then. If a stem says an agent "must never" do something, the answer removes the tool or denies the call. It does not defer it.

### Options ranked by constraint

| Dominant constraint | Best move | Why the others lose |
|---|---|---|
| **Risk** (a destructive or privileged action is reachable from untrusted input) | Remove the tool from this agent. Put the action in a separate, narrowly scoped agent or workflow behind approval | Logging, a confirmation prompt or "tell the model not to" are compensating controls. Deferral is not a control |
| **Accuracy** (wrong tool picked among similar ones) | Consolidate overlapping tools, namespace them, then add tool search if the count is still large | A bigger model does not fix ambiguous tool boundaries. A human could not choose either<sup>[4]</sup> |
| **Cost and latency** (definitions dominate input tokens) | Tool search for large catalogs, prompt caching for stable ones<sup>[3]</sup> | Deleting tools the task needs breaks a requirement |
| **Maintainability** (one agent accumulating every team's servers) | Split by role: specialized agents, each declaring only its servers | One generalist agent with every server makes ownership and review harder |
| **Credential scope** | Limit the key's permissions at the service that issued it<sup>[9]</sup> | Harness settings do not narrow what a credential itself allows |

### Bloat hides in delegation, not only in tool lists

A subagent with no `tools` field inherits a full tool set (Foundations Chapter 2). Managed Agents has a similar trap at the server level. **MCP servers are agent-scoped**: each agent definition declares its own. But an **inline agent** (one the orchestrator defines on the fly) has no definition, so it uses the MCP servers and tools of the agent that the session runs. You cannot narrow an inline agent's servers. To allow only the agents you list, you disable `inline_agents` under both `subagents` and `workflows`. Vault credentials are **session-scoped** and apply to every thread.<sup>[8]</sup> So an orchestrator that holds a powerful server effectively lends it to every inline helper it spawns.

The design that removes this: the orchestrator declares no powerful servers, each predefined specialist declares only the servers its role needs, and inline agents are off. The pages also limit delegation to one level, and each `predefined_agents` list to 20 agents.<sup>[8]</sup>

### Reading the evidence

| Symptom in the stem | Likely cause |
|---|---|
| Agent calls a near-duplicate tool, or mixes parameters between similar tools | Overlapping tools or weak names. Consolidate and namespace<sup>[5]</sup> |
| Input tokens are high before the user says anything | Definitions loaded upfront. Tool search or caching<sup>[3]</sup> |
| A destructive action ran after the agent read external content | The tool should not have been reachable from this agent. Remove it |
| `allowed_tools` is short, yet the agent ran a shell command | `allowed_tools` approves; it does not restrict. Check the permission mode<sup>[6]</sup> |
| A helper agent used a server its role never needed | Inline agent inherited the orchestrator's servers<sup>[8]</sup> |

### Numbers worth knowing

- Tool selection accuracy degrades past **30–50** tools.<sup>[2]</sup>
- Five-server example: **~55K** tokens of definitions; Anthropic has seen **134K**.<sup>[1]</sup>
- Claude Code limits tool responses to **25,000** tokens by default.<sup>[5]</sup>
- Managed Agents: delegation is **one level** deep, up to **20** agents per `predefined_agents` list.<sup>[8]</sup>

## The integration mechanism follows where the system lives and who else needs the connection

*Objective D3.7: Evaluate connection protocols and select the appropriate integration mechanism (MCP, API/CLI, agent-to-agent).*

### The decision

For each external system, the architect picks how the agent reaches it. The realistic options are a **custom tool** your application implements against the system's API, an existing **CLI** the agent runs, an **MCP server** (local over stdio, or remote over Streamable HTTP, reached by your own client or by the Messages API's MCP connector), or **another agent** that owns the system.

MCP in one sentence: a host such as Claude Code creates one MCP client per server, and servers expose **tools**, **resources** and **prompts** over JSON-RPC. Stdio servers run locally and usually serve one client. Streamable HTTP servers run remotely and usually serve many, and MCP recommends OAuth for their tokens.<sup>[10]</sup> MCP's value is reuse: implement the integration once and every MCP host can use it.<sup>[16]</sup>

### What each mechanism is good at

| Mechanism | Wins when | Costs and limits |
|---|---|---|
| **Custom tool in your app** (client tool) | One application owns the integration; you need full control over validation, auth and output shape | You maintain it; no reuse across hosts |
| **CLI** (`gh`, `aws`, `gcloud`) | The agent has a shell and the system already has a good CLI | Needs a shell and the CLI's own auth on the machine. Claude Code's docs say a CLI is usually the easiest way in, and more context-efficient than MCP because it adds no per-tool listing<sup>[11][12]</sup> |
| **Local MCP server (stdio)** | Several hosts on a developer machine need the same integration; credentials come from the local environment | Runs with local privileges; one client per server |
| **Remote MCP server (Streamable HTTP)** | Many users and hosts share one governed integration with per-user OAuth | You operate it, or trust a vendor's |
| **MCP connector** (`mcp_servers` on the Messages API) | A server-side app wants remote MCP tools without writing an MCP client | Tools only (no resources or prompts); server must be public over HTTP, so no stdio; you obtain and refresh the OAuth token yourself; in beta; not covered by ZDR<sup>[7]</sup> |
| **Another agent** | The other side owns its own reasoning, state and data, and you should not hold its tools | Non-deterministic contract; see the general-practice section below |

Two connector details matter in production. The connector can **allowlist or denylist** tools per server and **defer** them for tool search.<sup>[7]</sup> And because a server can change its tools at any time, a beta header lets you **pin a server's tool list**, so a server that changes its tools does not change what Claude receives partway through a conversation.<sup>[7]</sup> When the client-side helpers are the better fit (local servers, prompts, resources), the connector page says so directly.<sup>[7]</sup>

### Where the agent loop runs is a separate choice

The mechanism for each system sits inside a larger choice about who runs the loop. The Agent SDK page lays out four options: the **Agent SDK** (Claude Code's loop and tools as a library, in a process you operate), the **Claude Code CLI**, the **Client SDK** (you write the tool loop, or use the beta tool runner), and **Managed Agents** (Anthropic hosts the harness, with sessions in an Anthropic-managed or self-hosted sandbox).<sup>[13]</sup> Managed Agents fits long-running and asynchronous work, persistent sessions and scheduled runs, but it is in beta and, because sessions are stateful, it is **not eligible for ZDR or HIPAA BAA coverage**.<sup>[14]</sup> If a stem's constraint is zero data retention, that rules it out before any other trade-off.

### Options ranked by constraint

| Dominant constraint | Prefer | Avoid |
|---|---|---|
| **Context cost** in a coding agent | An existing CLI | Wrapping the same CLI as a large MCP server |
| **Reuse across many hosts and teams** | A remote MCP server with OAuth | Copy-pasted custom tools in each app |
| **Fine control, one app** | A custom tool | Standing up an MCP server nobody else will use |
| **No client code, remote server, tools only** | MCP connector | The connector for stdio servers, resources or prompts (unsupported) |
| **ZDR required** | Messages API with features that are ZDR-eligible | MCP connector and Managed Agents (not ZDR-eligible)<sup>[7][14]</sup> |
| **Bedrock deployment needing tool search** | InvokeModel | Converse, where server-side tool search is not available<sup>[2]</sup> |

### Agent-to-agent is a trust boundary, not a faster function call

*General practice, not from Anthropic documentation.*

The official pages cover multi-agent work **inside** one system: subagents in the Agent SDK and Claude Code, and Managed Agents' subagents, dynamic workflows and advisor, all sharing one sandbox and one set of vault credentials.<sup>[8]</sup> They do not document a protocol for agents run by **different owners** to call each other. The guidance below is established distributed-systems practice, not Anthropic's.

- **Choose agent-to-agent only when the other side should keep its own judgment and data.** A partner's pricing agent that applies rules you cannot see is a fit. A database you could query yourself is not; expose it as a tool or MCP server instead.
- **Treat the remote agent's reply as untrusted input.** It can be wrong, injected or over-confident. Validate it against a schema before acting, the same way you would validate any external API response.
- **Authenticate the caller and authorize the task, not the session.** The remote agent should know which principal it is acting for (Chapter 7).
- **Design for slow and partial answers.** Long-running delegation needs a task handle, status polling, timeouts and idempotent retries, because the remote side may take minutes.
- **Keep the contract narrow.** A typed request and response with explicit scope is reviewable. "Do whatever my agent asks" is capability bloat across an organizational boundary.

### Reading the evidence

| Symptom | Likely cause |
|---|---|
| Connector request rejected for a local server | The MCP connector needs a public HTTP server; stdio is not supported<sup>[7]</sup> |
| MCP tools change behavior mid-conversation after a server deploy | The server changed its tool list. Pin the list<sup>[7]</sup> |
| Coding agent's context fills with one vendor's MCP definitions | A CLI would have been cheaper; or enable tool search<sup>[11]</sup> |
| Compliance review blocks a Managed Agents design | ZDR or HIPAA BAA required; Managed Agents is not eligible<sup>[14]</sup> |

## Progressive discovery wins once definitions crowd the context and loses on small, hot toolsets

*Objective D3.8: Evaluate progressive discovery vs. monolithic context strategy.*

### The decision

A **monolithic** strategy loads every tool definition, instruction and reference document upfront. A **progressive** strategy loads a small catalog and pulls in detail when the task needs it. The MCP client guidance separates two levers: **progressive discovery** controls *when* definitions enter context, and **programmatic tool calling** controls *how* tools are invoked and how much of their output reaches the model.<sup>[15]</sup> Stems often describe only one of the two problems. Match the lever to the problem.

Anthropic's context-engineering article frames the general principle as **just-in-time** context: keep lightweight references (paths, queries, links) and load data at runtime with tools. It is honest about the cost. Runtime exploration is **slower** than retrieving pre-computed data, and needs good tools and heuristics. It recommends a **hybrid** in many settings, as Claude Code does: CLAUDE.md is loaded upfront, while glob and grep fetch files on demand.<sup>[4]</sup>

### The progressive mechanisms and what each one cuts

| Mechanism | What it keeps out of context | Fits | Does not fit |
|---|---|---|---|
| **Tool search** (`defer_loading`) | Tool definitions until searched | 10+ tools, definitions over 10K tokens, several MCP servers, a growing catalog<sup>[2]</sup> | Under 10 tools, every tool used every request, or definitions under 100 tokens total<sup>[2]</sup> |
| **Agent Skills** | Instructions and resources until a skill triggers | Procedures and reference material reused across conversations | Rules that must apply on every turn (those belong upfront) |
| **Code execution with MCP** (tools as files) | Definitions until the agent reads that file; intermediate data | Very large tool catalogs, data that should not pass through the model | Teams that cannot run a secure sandbox<sup>[16]</sup> |
| **Programmatic tool calling** | Intermediate tool results | Fan-out across many items, large results to filter, agentic search<sup>[17]</sup> | Strictly sequential calls that each need Claude's reasoning; a few small calls<sup>[17]</sup> |
| **Dynamic server management** | Whole servers until needed | General-purpose agents whose intent is unknown upfront<sup>[15]</sup> | Agents that use the same servers every turn |

**Skills** are the clearest progressive design. Level 1 metadata (name and description) is always loaded at about 100 tokens per skill. Level 2 instructions (the `SKILL.md` body, under 5K tokens) load when triggered. Level 3 resources cost nothing until read, and scripts run with only their output entering context.<sup>[18]</sup> The catch is trust. A skill can direct Claude to call tools or run code that does not match its stated purpose, so the page says to use skills only from trusted sources and audit everything bundled.<sup>[18]</sup> Progressive loading is not a reason to install more skills you have not reviewed.

**Code execution with MCP** presents servers as code on a filesystem. In Anthropic's example, loading only the needed tool files cut usage from 150,000 tokens to 2,000. Intermediate results stay in the execution environment, so sensitive data can move between systems without entering the model's context. The article is explicit that this adds sandboxing, resource limits and monitoring that direct tool calls avoid.<sup>[16]</sup> The MCP client guidance adds the security rules for a sandbox broker: the sandbox has no network, the host holds the credentials, and **approving a script does not approve every tool call it makes**. The same per-call confirmation policy applies to sandbox-originated calls.<sup>[15]</sup>

### When to switch

The pages give several thresholds. They agree in shape, not in number, so cite the one that fits the stem.

- Tool search page: use it at 10+ tools or over 10K tokens of definitions.<sup>[2]</sup>
- Manage tool context page: add tool search past roughly 20 tools.<sup>[3]</sup>
- MCP client guidance: switch when definitions pass a threshold such as 1–5% of the context window.<sup>[15]</sup>

Tool search is not free. It adds a search step, a small amount of latency for one extra turn.<sup>[3]</sup> Anthropic's advice is to keep the **3–5 most-used tools non-deferred**, write descriptive names and descriptions (search matches against them), and namespace tools so one search finds a group.<sup>[2]</sup>

### Progressive discovery and prompt caching must be designed together

The cache follows `tools` → `system` → `messages`, and **modifying tool definitions invalidates the entire cache**.<sup>[19]</sup> Anthropic's built-in tool search is designed around this: deferred tools are excluded from the initial prompt, so the cacheable prefix stays stable.<sup>[1]</sup> One API rule follows: a tool with `defer_loading: true` cannot carry `cache_control`; put the breakpoint on a non-deferred tool.<sup>[2]</sup>

A custom discovery layer can break caching by accident. The MCP guidance warns that adding or removing definitions mid-conversation can cost more tokens in cache misses than the definitions you removed. Append new definitions after the breakpoint instead of re-sorting the array, or route every call through one stable `call_tool` meta-tool, and treat server disconnection as a conversation-boundary event.<sup>[15]</sup>

### Programmatic tool calling, by the numbers

Programmatic tool calling lets Claude write code in the code execution container that calls your tools; only the final output enters context.<sup>[17]</sup> The page reports a 75-tool project-management benchmark with about **38%** fewer billed input tokens and no accuracy change, and typical savings of **20–40%** for requests with 10–49 tools. It also reports the counter-case: on τ²-bench, where each turn makes one or two sequential calls, scores were unchanged and cost was about **8% higher**.<sup>[17]</sup> That is a ready-made distractor: PTC "always saves tokens" is false.

Operational limits to know: tools from the **MCP connector cannot be called programmatically**; `strict: true` tools are not supported; a pending call times out after about **4 minutes**, and idle containers are reclaimed after about **5 minutes**.<sup>[17]</sup> Results returned to programmatic calls do not count toward input or output token usage; only the final code result and Claude's response do.<sup>[17]</sup>

### Options ranked by constraint

| Dominant constraint | Prefer | Why |
|---|---|---|
| **Latency** on a small toolset used every turn | Monolithic, cached | Search adds a turn; caching cuts repeat cost<sup>[3]</sup> |
| **Accuracy** with a large catalog | Tool search with 3–5 hot tools loaded | Fewer, relevant definitions in view<sup>[2]</sup> |
| **Cost** from large intermediate results | Programmatic tool calling | Intermediate results never reach context<sup>[17]</sup> |
| **Privacy** of data moving between systems | Code execution with tokenization in the harness | Data flows without entering the model<sup>[16]</sup> |
| **Rules that must always apply** | Upfront (system prompt, CLAUDE.md) | A rule that loads on demand may not load |

### Reading the evidence

| Symptom | Likely cause |
|---|---|
| Cache hit rate collapsed after adding dynamic tool loading | Tools array changes mid-conversation invalidate the cache<sup>[15][19]</sup> |
| 400 error after marking tools deferred | All tools deferred, or `cache_control` on a deferred tool<sup>[2]</sup> |
| Claude does not find a deferred tool it needs | Vague name or description; no system-prompt hint about tool categories<sup>[2]</sup> |
| PTC raised cost on a chat workload | Sequential single-call turns; PTC overhead without savings<sup>[17]</sup> |
| A skill never triggers | Its `description` does not say when to use it<sup>[18]</sup> |

### Numbers worth knowing

- Tool search: up to **10,000** deferred tools per request; **5** results per search by default; regex patterns up to **200** characters, BM25 queries up to **500**.<sup>[2]</sup>
- Tool search typically cuts definition tokens by **over 85%**.<sup>[2]</sup>
- Skills: about **100** tokens of metadata per skill; instructions **under 5K** tokens.<sup>[18]</sup>
- Code execution with MCP example: **150,000 → 2,000** tokens.<sup>[16]</sup>
- Cache writes carry a **25%** markup over base input price.<sup>[3]</sup>

## Worked design review: the operations assistant that refunded a customer

**The system.** A support-operations assistant runs on the Messages API. It connects through the MCP connector to six servers: GitHub, Slack, Jira, Grafana, Sentry and an internal billing admin server. Together they expose about 140 tools, all loaded upfront. Support engineers use it interactively.

**What went wrong.** Baseline input is about 60K tokens per turn. Claude often posts to the wrong Slack target when two tools have near-identical names. Last week a customer ticket contained text asking for a refund, and the agent called the billing server's `issue_refund` tool.

**The constraint that decides.** Refunds must never be triggered from ticket content. The assistant must stay interactive.

**The better design.**

1. **Remove the reach.** In the billing toolset, set `enabled: false` by default and enable only read tools such as invoice lookup.<sup>[7]</sup> Refunds move to a separate workflow with its own narrowly scoped credential and a human approval step. The billing service limits that credential's permissions at the source.<sup>[9]</sup>
2. **Fix the ambiguity.** Consolidate near-duplicate Slack tools and namespace the rest by service and resource.<sup>[5]</sup>
3. **Defer the long tail.** Add tool search, keep the three to five most-used tools non-deferred, and add one system-prompt line naming the tool categories.<sup>[2]</sup>
4. **Keep caching intact.** Put the cache breakpoint on a non-deferred tool.<sup>[2]</sup>
5. **Fan-out work.** For "check error rates across 30 services," the Grafana and Sentry tools are MCP connector tools, so they cannot be called programmatically.<sup>[17]</sup> If that fan-out matters, expose those queries as your own client tools with `allowed_callers` instead.

**Why each tempting alternative loses.**

- **"Defer the refund tool behind tool search."** Deferral controls context, not reach. Claude can still find and call it.
- **"Add audit logging and a confirmation prompt on refunds."** A compensating control. The tool should not exist in an agent that reads untrusted tickets.
- **"Switch to the largest model to fix tool selection."** Wrong knob. The tools are ambiguous to a human too.
- **"Cut to ten tools total."** A blunt fix that breaks the engineers' stated need for the other systems.
- **"Tell the model in the system prompt never to issue refunds."** Guidance, not enforcement.

## How wrong answers are built

- **"Mark the dangerous tool `defer_loading: true` so the agent rarely sees it."** Family 1. It is still callable once found. Remove or deny it.
- **"Use `allowed_callers` to stop direct calls to the payment tool."** Family 1. The page says it is not a security boundary.
- **"Restrict the agent with `allowed_tools`."** Family 1. It approves listed tools; unlisted ones fall through to the permission mode, and `bypassPermissions` approves them.
- **"Use a larger model so it chooses among 200 tools reliably."** Family 3. Selection degrades with tool count and overlap; fix the catalog.
- **"Remove all but the five most common tools to save tokens."** Family 2. Tool search keeps access to the rest at a fraction of the cost.
- **"Enable programmatic tool calling on every workload to cut cost."** Family 3. Sequential single-call turns cost about 8% more.
- **"Wrap `gh` in an MCP server for the coding agent."** Family 3. The CLI is already more context-efficient.
- **"Use the MCP connector for the local stdio server."** It only reaches public HTTP servers.
- **"Load all tool definitions dynamically and reorder them each turn."** Family 4 in a diagnosis stem: the cache misses started when the tools array started changing.

## What to remember

- Bloat costs tokens, selection accuracy and blast radius. Name which one the stem is about.
- Removing a tool or denying its call is a boundary. Deferring it, approving others or setting `allowed_callers` is not.
- Inline agents in Managed Agents inherit the orchestrator's MCP servers. Vault credentials are session-wide.
- CLI first when one exists and a shell is available; MCP for shared, governed integrations; custom tools for one app with tight control.
- MCP connector: tools only, public HTTP only, your OAuth token, beta, not ZDR. Managed Agents: not ZDR or HIPAA BAA.
- Agent-to-agent across owners is not documented by Anthropic. Treat it as an untrusted service with a narrow contract.
- Tool search for 10+ tools or 10K+ tokens; keep 3–5 hot tools loaded; it adds one search turn.
- Changing the tools array mid-conversation breaks the cache. Deferred tools are designed not to.
- PTC helps fan-out and large results, hurts strictly sequential turns, and cannot call MCP connector tools.

## Endnotes for this chapter

1. The five-server 55K-token example, the 134K observation, wrong tool selection as the most common failure, deferred loading preserving prompt caching, and when tool search is worth its latency. Anthropic, "Introducing advanced tool use on the Claude Developer Platform" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/research/advanced-tool-use
2. Selection accuracy degrading past 30–50 tools, the 85% reduction, usage thresholds, limits, the `defer_loading` and `cache_control` rule, the Bedrock Converse restriction and optimization tips. Anthropic, "Tool search tool" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool
3. The four approaches to tool context, tool search's extra-turn latency, the roughly 20-tool threshold and the 25% cache-write markup. Anthropic, "Manage tool context" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/agents-and-tools/tool-use/manage-tool-context
4. Bloated tool sets as a common failure, the minimal viable tool set, just-in-time context, its latency cost and the hybrid strategy. Anthropic, "Effective context engineering for AI agents" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/research/effective-context-engineering-for-ai-agents
5. More tools do not always help, consolidation, namespacing, and Claude Code's 25,000-token default limit on tool responses. Anthropic, "Writing effective tools for agents — with agents" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/research/writing-tools-for-agents
6. The permission evaluation order and the effects of `allowed_tools` and `disallowed_tools`, including the `bypassPermissions` warning. Anthropic, "Configure permissions" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/agent-sdk/permissions
7. MCP connector allowlists and denylists, per-tool `defer_loading`, tools-only and public-HTTP limits, caller-managed OAuth tokens, tool-list pinning, beta status and ZDR ineligibility. Anthropic, "MCP connector" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/agents-and-tools/mcp-connector
8. Agent-scoped MCP servers, inline agents using the session agent's servers, session-scoped vault credentials, one delegation level and the 20-agent list limit. Anthropic, "Multiagent orchestration" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/managed-agents/multiagent-orchestration
9. Smallest tool set as a control against untrusted input, and limiting a key's permissions at the issuing service. Anthropic, "Security risks and sandbox boundaries" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/managed-agents/secure-deployment-risks
10. MCP hosts, clients and servers, primitives, stdio and Streamable HTTP transports, and OAuth as the recommended token source. MCP, "Architecture overview" (MCP docs, accessed 2026-11-02), https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture
11. CLI tools are more context-efficient than MCP servers because they add no per-tool listing. Anthropic, "Manage costs effectively" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/costs
12. A CLI is usually the easiest way to connect a system; MCP is for systems without one. Anthropic, "Best practices for Claude Code" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/best-practices
13. The comparison of the Agent SDK, Claude Code CLI, Client SDK and Managed Agents. Anthropic, "Agent SDK overview" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/agent-sdk/overview
14. When Managed Agents fits, its beta status, and its ineligibility for ZDR and HIPAA BAA coverage. Anthropic, "Claude Managed Agents overview" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/managed-agents/overview
15. Progressive discovery versus programmatic tool calling, switching thresholds, discovery strategies, dynamic server management, prompt-caching interaction and sandbox broker security. MCP, "Client Best Practices" (MCP docs, accessed 2026-11-02), https://modelcontextprotocol.io/docs/2026-07-28/develop/clients/client-best-practices
16. Presenting MCP servers as code, the 150,000-to-2,000-token example, privacy-preserving data flow, reuse across hosts and the operational cost of sandboxing. Anthropic, "Code execution with MCP: Building more efficient agents" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/research/code-execution-with-mcp
17. Programmatic tool calling: `allowed_callers` not being a security boundary, strong and weak fits, benchmark results, MCP connector and `strict` restrictions, timeouts and token accounting. Anthropic, "Programmatic tool calling" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/agents-and-tools/tool-use/programmatic-tool-calling
18. Skill loading levels and token costs, the role of `description`, and the security guidance on trusted sources. Anthropic, "Agent Skills" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
19. The cache hierarchy and the rule that modifying tool definitions invalidates the entire cache. Anthropic, "Prompt caching" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/prompt-caching
20. In subagent frontmatter, a `disallowedTools` entry with a specifier still removes the whole tool from the subagent; to block specific commands, add a deny rule to `permissions.deny`. Anthropic, "Create custom subagents" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/sub-agents
