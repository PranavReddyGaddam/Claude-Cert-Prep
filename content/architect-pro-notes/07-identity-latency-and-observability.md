# Chapter 7: Identity, Latency and Observability

**Summary**: *These three objectives are operational. An agent system is only as secure as the identity each hop carries, only as fast as the slowest part of the request you actually tuned, and only as observable as the signal you chose for the question being asked. Pro items reward naming the exact hop, the exact latency component, and the exact signal.*

Tool-scope decisions (which tools exist at all) are in [Chapter 5](/ccar-p/read/pro-notes/05-integration-mechanisms-and-scope). Evaluation metrics and dashboards for quality are in [Chapter 8](/ccar-p/read/pro-notes/08-evaluation-testing-and-optimization). Guardrails and human review are in [Chapter 9](/ccar-p/read/pro-notes/09-governance-safety-and-risk).

## Most agent security gaps are identity gaps: who the call acts as, and what the token is good for

*Objective D3.2: Analyze authentication and authorization requirements to identify security gaps.*

### The decision

An agent system has several hops, and each one carries a credential. The architect decides, hop by hop, **which principal** the call acts as and **how narrow** the credential is. A gap is a hop where the answer is "a shared, long-lived, broad secret" or "nobody checked."

| Hop | Credential | Typical gap | Control |
|---|---|---|---|
| App → Claude API | API key, Workload Identity Federation token, or App Attest token<sup>[1]</sup> | Static key in CI; legacy workspace key with no owner | Service account plus WIF; identity-backed keys |
| Agent harness → its own tools | Permission rules, modes and hooks<sup>[7]</sup> | `bypassPermissions` with an allow list believed to restrict | Deny rules, removed tools, `dontAsk`, hooks |
| Agent → MCP server | OAuth access token<sup>[4]</sup> | Broad scopes granted upfront; token accepted for the wrong audience | Audience validation, least-privilege scopes, step-up |
| MCP server → downstream API | The server's own credential | **Token passthrough**: forwarding the client's token<sup>[6]</sup> | Server obtains its own token for the downstream API |
| Agent sandbox → external services | Injected secret | Agent can read the secret and exfiltrate it | Proxy or vault outside the sandbox<sup>[8]</sup> |

### The Claude API side: identity-backed keys and federation

The Claude API supports API keys, Workload Identity Federation (WIF) and App Attest. API keys and WIF grant the same API access; the difference is lifetime and ownership.<sup>[1]</sup>

- **Personal keys** act as you, with your roles. A shared personal key acts as one person and breaks when they leave.<sup>[1]</sup>
- **Service account keys** act as a non-human identity the organization manages. Use them for CI and production services.<sup>[1]</sup>
- **Workspace keys** are legacy: they belong to the workspace and act as **no one**, so they survive their creator leaving. Anthropic recommends identity-backed keys or WIF instead.<sup>[1]</sup> The Usage and Cost Analytics API shows the consequence: a workspace key's requests are attributed to the key itself, not to a person or service account.<sup>[21]</sup>
- **WIF** exchanges a short-lived JWT from an identity provider you already run (AWS IAM, Google Cloud, GitHub Actions, Kubernetes, Entra ID, Okta and others) for a short-lived Claude API token bound to a service account. Token lifetime defaults to 3,600 seconds and is configurable from 60 to 86,400, and never outlives the upstream JWT by more than a small margin.<sup>[2]</sup>
- **App Attest** is for iOS and macOS apps that call the API directly from the device. Tokens expire after 1 hour and authorize only Messages API calls.<sup>[1]</sup>

Two WIF facts produce good distractors. First, WIF is **only as strong as your identity provider**; a static cloud credential that can mint IdP tokens one step earlier still undermines it.<sup>[1][2]</sup> Second, SDK **credential precedence** puts `ANTHROPIC_API_KEY` above the federation variables. A team that configures federation but leaves the old key injected is still using the static key. The migration steps are: configure federation in parallel, confirm which credential wins, unset the key everywhere, then delete it.<sup>[2]</sup>

**Workspaces** are the blast-radius unit on the API side. Every request runs in exactly one workspace and can only reach that workspace's files, batches and skills. Workspaces carry their own spend and rate limits, which can be lower but not higher than the organization's.<sup>[3]</sup> Separate workspaces for development, staging and production mean a leaked dev key cannot read production batch results. Every response carries an `anthropic-workspace-id` header, so you can confirm which workspace a request actually counted against.<sup>[3]</sup>

### The MCP side: OAuth with audience binding

MCP authorization is **optional**, but strongly recommended when a server touches user data, needs per-user audit or rate limits, or runs in an enterprise.<sup>[5]</sup> HTTP servers **should** follow the OAuth-based spec. Stdio servers **should not**; they take credentials from the environment instead.<sup>[4]</sup>

The flow, in short: the server answers `401` with a pointer to its Protected Resource Metadata; the client discovers the authorization server, registers (pre-registered or dynamic), runs authorization code with PKCE, and sends the access token on each request.<sup>[5]</sup> The rules that matter for gap analysis:

- **Audience binding.** Clients must send a resource indicator for the specific MCP server, and servers **must** validate that a token was issued for them. Servers **must not** accept or transit other tokens.<sup>[4]</sup>
- **No token passthrough.** A server that forwards the client's token to a downstream API breaks audit trails, bypasses the downstream service's controls and can create a confused-deputy problem. The spec forbids it.<sup>[6]</sup>
- **Scope minimization.** Start with a minimal scope set and elevate with targeted `WWW-Authenticate` scope challenges when a privileged operation is first attempted. Wildcard or omnibus scopes are a listed mistake, as is treating the scopes in a token as sufficient without server-side authorization logic.<sup>[6]</sup>
- **Hygiene.** Short-lived access tokens, never log `Authorization` headers or tokens, separate app and resource-server credentials, and never tie authorization to `Mcp-Session-Id`.<sup>[5]</sup>

On the Messages API's MCP connector, **you** run the OAuth flow, pass the token as `authorization_token`, and refresh it.<sup>[9]</sup> That makes per-user delegation your application's job: one user's request should carry that user's token, not a shared one.

### Whose identity is the agent acting as?

This is the question behind most D3.2 stems. There are two legitimate answers, and the gap is usually mixing them.

| Pattern | The call acts as | Right for | Risk if misused |
|---|---|---|---|
| **Delegated** | The end user, through their OAuth token | Reading and changing that user's data | A shared token makes every user act as one user |
| **Service identity** | A service account the agent owns | Back-office work no single user owns | If the service account is broad, any user can reach anything through the agent |

Three details from the pages sharpen this.

- **Managed Agents vault credentials are session-scoped.** Every thread in a session, including subagents, gets the same credentials.<sup>[10]</sup> The settings do not narrow what a key allows; limit the key's permissions at the service that issued it.<sup>[11]</sup>
- **Telemetry identity is the service's, not the user's.** The Agent SDK attaches identity attributes based on the credential it uses to call Anthropic. In a multi-user deployment, those identify your service, not the end user. Inject end-user identity as resource attributes on each `query()` call if you need a per-user audit trail.<sup>[12]</sup>
- **Third-party products cannot reuse claude.ai login.** Unless previously approved, Anthropic does not allow third-party developers to offer claude.ai login or its rate limits in products built on the Agent SDK; they use API key authentication.<sup>[13]</sup>

### Agent permissions: what the harness lets the agent do

In the Agent SDK, a tool call is checked in order: hooks, deny rules, ask rules, permission mode, allow rules, then the `canUseTool` callback.<sup>[7]</sup> The gap analysis follows from the order.

- A deny rule wins even in `bypassPermissions` and even after a hook returned `allow`.<sup>[7]</sup>
- `allowed_tools` does **not** constrain `bypassPermissions`. `allowed_tools=["Read"]` with `bypassPermissions` still approves Bash, Write and Edit.<sup>[7]</sup>
- Auto-approved calls **never reach `canUseTool`**, so checks placed there are silently skipped. For a check that must run on every call, use a `PreToolUse` hook.<sup>[7]</sup>
- A subagent inherits `bypassPermissions` from the main session.<sup>[7]</sup>
- For a locked-down agent, pair `allowedTools` with `dontAsk`, which denies anything that would otherwise prompt.<sup>[7]</sup>

For credentials the agent needs but should never see, Anthropic's recommended pattern is a **proxy outside the agent's security boundary** that injects credentials into outgoing requests, enforces an endpoint allowlist and logs every request.<sup>[8]</sup>

### Reading the evidence

| Symptom | Likely gap |
|---|---|
| Downstream API logs show requests "from" the MCP client's identity | Token passthrough<sup>[6]</sup> |
| A stolen token reached tools unrelated to the user's task | Omnibus scopes granted upfront<sup>[6]</sup> |
| Federation configured, but rotation of the old key broke production | `ANTHROPIC_API_KEY` was still winning precedence<sup>[2]</sup> |
| An integration kept working after its author left | Legacy workspace key, owned by no one<sup>[1]</sup> |
| Every user's actions appear under one identity in the SIEM | Shared service credential; no end-user attributes<sup>[12]</sup> |
| A permission check in `canUseTool` never fired | The call was auto-approved earlier in the order<sup>[7]</sup> |

### Numbers worth knowing

- WIF token lifetime: default **3,600 s**, range **60–86,400 s**.<sup>[2]</sup>
- App Attest tokens: **1 hour**, Messages API only.<sup>[1]</sup>
- Console key expiration presets: **3 hours, 1 day, 7 days, 30 days**, custom, or Never.<sup>[1]</sup>
- **100** workspaces per organization by default.<sup>[3]</sup>

## Latency is a budget, and the right knob depends on which part of the latency is too slow

*Objective D3.3: Evaluate accuracy-latency trade-offs and justify configuration decisions.*

### The decision

"Too slow" has components. **Time to first token (TTFT)** is how long the user waits before anything appears. **Output speed** is tokens per second after that. **Total latency** is the end-to-end time, which for an agent includes every model round trip and tool call. **Throughput** is how much work finishes per hour. Each knob moves a different component, and most cost accuracy, money or both.

Anthropic's latency guide sets the order of work: first engineer a prompt that works without latency constraints, then reduce latency. Optimizing too early hides what top performance looks like.<sup>[14]</sup>

### The knobs and what each one moves

| Knob | Moves | Accuracy cost | Price effect | Watch for |
|---|---|---|---|---|
| **Model choice** | Everything | Real, on hard tasks | Large | Haiku 5.5 is the fastest current model; Fable 5.1 is listed as slower<sup>[20]</sup> |
| **Effort** | Output tokens, thinking, number of tool calls | Some at lower levels | Fewer tokens | Often a better lever than switching models<sup>[20]</sup> |
| **Fast mode** | Output speed, up to 2.5x | None (same model) | Premium | Not TTFT; Opus 5.5 is generally available, Opus 5 and 4.8 in research preview<sup>[15]</sup> |
| **Streaming** | Perceived latency | None | None | Required by the SDK for large `max_tokens` to avoid HTTP timeouts<sup>[17]</sup> |
| **Prompt caching** | TTFT on long, repeated prefixes | None | Cheaper repeats | Pre-warming removes the first-request miss<sup>[18]</sup> |
| **Shorter prompt and output** | All components | Risk if needed content is cut | Cheaper | `max_tokens` cuts mid-sentence; ask for brevity instead<sup>[14]</sup> |
| **Programmatic tool calling** | Agent total latency on fan-out | None to slight gain | Usually cheaper on fan-out | No gain on strictly sequential calls<sup>[26]</sup> |
| **Batch API** | Nothing for interactive use; raises throughput | None | 50% off | Most batches finish within 1 hour; up to 24 hours<sup>[19]</sup> |

**Effort** deserves the most attention because it is the first knob the pages recommend. It affects all output tokens, including tool calls and thinking. Lower effort makes fewer and terser tool calls.<sup>[16]</sup> Defaults differ by model: `high` on most, but `medium` on Opus 5.5 and Haiku 5.5. Anthropic tells teams to run a fresh effort sweep on their own evals after a model change rather than carry settings over, and notes that Sonnet 5.5's levels are recalibrated relative to Sonnet 5.<sup>[16]</sup> Haiku 5.5 at `low` may skip a search, stop early or skip a check in long agent prompts; that is the accuracy cost to name.<sup>[16]</sup>

**Fast mode** runs the same model on a faster inference configuration, with no change to intelligence. Its gain is output tokens per second, **not TTFT**.<sup>[15]</sup> On Opus 5.5 it costs $8 input and $40 output per million tokens, against a standard $4 and $20, so about double.<sup>[15][25]</sup> It has its own rate limit, returns `429` with `retry-after` when exceeded, and is not available with the Batch API or with a Priority Tier commitment. The response's `usage.speed` says which speed actually ran.<sup>[15]</sup>

**Service tiers** are a trap for memorized answers. A Priority Tier commitment is **no longer sold**, and Priority Tier is not supported on the newest models, including Opus 5.5, Sonnet 5.5 and Haiku 5.5.<sup>[24]</sup> Standard tier is best-effort. Priority Tier, for existing commitments, targets 99.5% uptime and falls back to standard beyond committed capacity.<sup>[24]</sup> So "buy Priority Tier" is not a current answer to a latency problem on a current model.

### Knob changes interact with caching

Changing `output_config.effort` between requests always invalidates cached message blocks, and on some models the tool and system caches too. Switching between fast and standard speed invalidates system and message caches.<sup>[18]</sup> A design that flips effort or speed per request can lose more to cache misses than it gains. On models that support it, **per-message effort** (beta) changes the level mid-conversation while preserving the cache.<sup>[16]</sup>

### Options ranked by constraint

| Dominant constraint | Prefer | Avoid |
|---|---|---|
| **Interactive chat, first-token wait** | Streaming plus caching of the static prefix; a faster model at tuned effort | Fast mode alone (it does not move TTFT) |
| **Long generated answers too slow to finish** | Fast mode on a supported model; ask for shorter output | A hard `max_tokens` cut that truncates |
| **Agent takes too many round trips** | Lower effort for routine steps; programmatic tool calling for fan-out; parallel tool calls | A bigger model |
| **Cost ceiling, latency tolerant** | Batch API at 50% off<sup>[19]</sup> | Fast mode |
| **Accuracy cannot drop** | Keep model and effort; buy speed with fast mode, caching and streaming | Down-shifting model or effort without an eval |

### Reading the evidence

| Symptom | Likely cause |
|---|---|
| Fast mode enabled, users still wait long for the first word | Fast mode improves output speed, not TTFT<sup>[15]</sup> |
| Latency and output length changed after a model upgrade with no other change | Different default effort, or recalibrated levels; set effort explicitly<sup>[16]</sup> |
| Cache hit rate fell after "adaptive" effort routing per request | Top-level effort changes invalidate the cache<sup>[18]</sup> |
| Intermittent `429` only on fast requests | Fast mode's separate rate limit; fall back to standard speed<sup>[15]</sup> |
| Long non-streaming requests time out in the SDK | Large `max_tokens` needs streaming<sup>[17]</sup> |
| Batch job "slow" at 3 hours | Within the 24-hour window; Batch is not for interactive latency<sup>[19]</sup> |

### Numbers worth knowing

- Fast mode: up to **2.5x** output speed; Opus 5.5 **$8 / $40** per MTok against standard **$4 / $20**.<sup>[15][25]</sup>
- Batch: **50%** discount; most batches within **1 hour**; results by **24 hours**.<sup>[19][25]</sup>
- Default effort: `medium` on Opus 5.5 and Haiku 5.5; `high` on Fable 5.1, Sonnet 5.5 and most others.<sup>[16][20]</sup>
- Priority Tier target: **99.5%** uptime, existing commitments only.<sup>[24]</sup>

## At scale, observability means joining live traces to reconciled cost data, without exporting what you may not store

*Objective D3.4: Analyze observability challenges and select monitoring strategies at scale.*

### The decision

Different questions need different signals. "Why did this run fail?" needs a trace. "Which team spent the most last month?" needs reconciled usage data. "Is spend spiking right now?" needs a near-real-time metric. Picking the wrong source is the most common wrong answer in this objective.

| Source | Granularity | Freshness | Authoritative for billing? | Best for |
|---|---|---|---|---|
| **Agent SDK / Claude Code OpenTelemetry** (metrics, log events, traces) | Per request, per tool call | Exported every 60 s (metrics) and 5 s (logs, traces) by default<sup>[12]</sup> | No; cost metrics are approximations<sup>[22]</sup> | Debugging runs, live alerting, per-user audit |
| **SDK result message** `total_cost_usd` | Per `query()` | Immediate | No; a client-side estimate<sup>[23]</sup> | Development insight, rough budgets |
| **Usage and Cost Analytics API** | Organization, by model, workspace, key, actor, tier, speed | Refreshes within about 4 hours, up to 24; revised until about 7 days after month end<sup>[21]</sup> | Yes, after reconciliation | Chargeback, finance, top consumers |
| **LLM gateway** | Every request through it | Real time | Its own records | Central budgets, audit logs, per-developer attribution<sup>[27]</sup> |

The Analytics API is in beta. It groups by up to five dimensions, including `actor` (a user, service account, federated cloud identity, or the key itself), and a single request spans at most 31 days.<sup>[21]</sup> The SDK cost-tracking page is blunt: do not bill end users or trigger financial decisions from `total_cost_usd`.<sup>[23]</sup>

### Traces: the delegation chain as one tree

The Agent SDK runs the Claude Code CLI as a child process, and the CLI exports the telemetry. Telemetry is off until `CLAUDE_CODE_ENABLE_TELEMETRY=1` and an exporter are set. Traces are in beta and need `CLAUDE_CODE_ENHANCED_TELEMETRY_BETA=1`.<sup>[12]</sup> The span tree is what makes multi-agent systems debuggable:

- `claude_code.interaction` wraps one turn; `claude_code.llm_request` wraps each API call with model, latency and token counts; `claude_code.tool` wraps each tool call, with a child span for the permission wait.<sup>[12]</sup>
- A **subagent's spans nest under the parent's `claude_code.tool` span**, so a whole delegation chain is one trace.<sup>[12]</sup>
- The SDK propagates **W3C trace context** into the CLI, so the agent's spans become children of your application's active span instead of a disconnected root.<sup>[12]</sup>
- In Claude Code events, `prompt.id` ties every API request and tool result back to the prompt that caused it.<sup>[22]</sup>

### Problems that appear only at scale

| Problem | Cause | Fix from the pages |
|---|---|---|
| Telemetry silently missing | Export errors fail silently by default | `CLAUDE_CODE_OTEL_DIAG_STDERR=1` and read stderr<sup>[12]</sup> |
| Spans lost from short jobs | Batched export; killed processes lose the buffer | Shorter export intervals<sup>[12]</sup> |
| SDK message stream corrupted | `console` exporter writes to stdout, the SDK's channel | Never use `console` with the SDK<sup>[12]</sup> |
| All agents look like one service | Default `service.name` is `claude-code` | Override service name and resource attributes<sup>[12]</sup> |
| Metrics backend cost exploding | Custom resource attributes become labels on every series | `OTEL_METRICS_INCLUDE_RESOURCE_ATTRIBUTES=false`<sup>[22]</sup> |
| Developers redirect telemetry | Per-developer exporter settings | Managed settings lock the OTLP endpoint; repo settings cannot enable exporters<sup>[22]</sup> |

### Content capture is opt-in, and should stay that way unless approved

Telemetry is **structural by default**: durations, model and tool names, token counts. Prompt text, tool arguments, tool output and raw API bodies are each behind an opt-in variable (`OTEL_LOG_USER_PROMPTS`, `OTEL_LOG_TOOL_DETAILS`, `OTEL_LOG_TOOL_CONTENT`, `OTEL_LOG_RAW_API_BODIES`). The page says to leave them unset unless your pipeline is approved to store the data the agent handles.<sup>[12]</sup> Raw file contents are not in metrics or events; with OAuth, `user.email` is included and goes only to your configured endpoint.<sup>[22]</sup> A stem that asks for "full prompt logging for debugging" in a regulated workload is testing this: the better answer scopes content capture to an approved pipeline or keeps it off and debugs from structure.

### Reading the evidence

| Symptom | Likely cause |
|---|---|
| Finance totals disagree with the in-app cost dashboard | The dashboard used client estimates; reconcile with the Analytics API<sup>[23]</sup> |
| Spend alert built on the Analytics API fires hours late | Data refreshes within about 4 hours, up to 24<sup>[21]</sup> |
| Subagent work invisible in traces | Tracing beta not enabled, or the trace was not propagated<sup>[12]</sup> |
| Usage for an integration shows the key as the "actor" | Legacy workspace key with no linked identity<sup>[21]</sup> |
| Per-user audit shows only the service | Identity attributes reflect the service credential<sup>[12]</sup> |

### Numbers worth knowing

- Default export intervals: metrics **60 s**, traces and logs **5 s**.<sup>[12]</sup>
- Analytics API: refresh within about **4 h** (up to **24 h**); **31-day** maximum span; up to **5** `group_by` dimensions; data from **January 1, 2026**.<sup>[21]</sup>
- Content capture truncation: **60 KB** by default for tool output and inline raw bodies.<sup>[12]</sup>

## Worked design review: a multi-tenant support agent with one key, one token and no traces

**The system.** A SaaS company runs a customer-support agent on the Agent SDK in Kubernetes. It serves 40 tenant companies. It reaches the Claude API with a legacy workspace key stored as a CI secret. It reaches the CRM through an MCP server using one OAuth token with full scopes, shared by all tenants. The MCP server forwards that token to the CRM's API. Finance bills tenants from `total_cost_usd`. Users complain that answers take too long to start appearing.

**The constraint that decides.** Tenant A's conversations must never be able to read tenant B's CRM records, and every tool call must be attributable to a tenant and a user.

**The flawed fixes on the table.**

- "Add a system-prompt rule that the agent may only access the current tenant's records."
- "Enable audit logging of all prompts and tool output."
- "Turn on fast mode to fix the slow responses."
- "Switch the dashboard to the Analytics API so billing is real time."

**The better design.**

1. **Per-user delegated tokens to the CRM.** Each user authorizes the CRM through OAuth; the MCP server validates the token's audience and obtains its own token for the CRM instead of passing the user's through.<sup>[4][6]</sup> Scopes start minimal and step up for write actions.<sup>[6]</sup> The CRM then enforces tenant boundaries, because each call carries a user who belongs to one tenant.
2. **Workload identity for the Claude API.** A service account per environment, federated from the Kubernetes service-account token, with the old key unset everywhere and deleted.<sup>[2]</sup> Separate workspaces for staging and production, each with a spend limit.<sup>[3]</sup>
3. **Traces with tenant and user attributes.** Enable OTel export and tracing beta, set `service.name`, and inject tenant and user as resource attributes on each `query()`.<sup>[12]</sup> Keep content capture off; the structural events (`tool_decision`, `tool_result`, `safety_event`) give the audit trail.<sup>[12]</sup> Keep the tenant ID out of metric labels if cardinality is a problem.<sup>[22]</sup>
4. **Bill from reconciled data.** Monthly tenant billing comes from the Analytics API grouped by actor or workspace, not from client estimates.<sup>[21][23]</sup>
5. **Fix the latency component that is slow.** The complaint is time to first token. Stream the response and cache the long static system prompt and tool definitions, pre-warming the cache if needed.<sup>[17][18]</sup> Then tune effort on evals.<sup>[16]</sup>

**Why each tempting alternative loses.**

- **The system-prompt rule** is guidance, not enforcement. The shared full-scope token still reaches every tenant.
- **Logging all prompts and tool output** is a compensating control that also exports customer data to a pipeline nobody approved.
- **Fast mode** speeds output after the first token, not the wait before it, at about double the price.
- **The Analytics API is not real time**; it refreshes within hours. It is the right source for billing precisely because it is reconciled, not because it is live.

## How wrong answers are built

- **"Add a confirmation prompt before CRM writes."** Family 1. The cross-tenant reach should not exist; fix the token.
- **"Pass the user's token through the MCP server to the downstream API."** This is token passthrough, which the spec forbids.
- **"Migrate to WIF; the static key can stay as a fallback."** Family 4. Precedence means the key keeps winning.
- **"`allowed_tools` limits a `bypassPermissions` agent to the listed tools."** It does not; unlisted tools are approved too.
- **"Enable fast mode to cut time to first token."** Family 3. It raises output speed, not TTFT.
- **"Buy Priority Tier for the new model."** Family 3. Commitments are no longer sold, and current models are not supported.
- **"Set a low `max_tokens` to speed up answers."** Family 2. It truncates mid-sentence.
- **"Drop to the smallest model to fix slow agent runs."** Family 2. Without an eval, it trades away accuracy the stem required; effort and round-trip reduction come first.
- **"Bill customers from the SDK's cost field."** Family 3. It is a client-side estimate.
- **"Alert on spend spikes from the Analytics API."** Family 3. Its data lags by hours; use live OTel cost metrics for alerting.
- **"Log full prompts and tool output for observability."** Family 1, and a data-handling risk.

## What to remember

- Name the hop: app to API, harness to tools, agent to MCP, MCP to downstream, sandbox to secrets.
- Prefer service accounts and WIF over static keys; unset the old key, because it wins precedence.
- MCP servers validate token audience and never pass tokens through. Scopes start minimal and step up.
- Delegated identity for user data, service identity for back-office work. Do not let a shared token make everyone one user.
- Deny rules and hooks enforce. `allowed_tools` approves. `bypassPermissions` approves the rest.
- Match the latency knob to the component: streaming and caching for TTFT, fast mode for output speed, effort and PTC for agent round trips, Batch for throughput.
- Set effort explicitly and re-sweep after a model change. Changing it per request can break the cache.
- OTel for live debugging and alerts, the Analytics API for reconciled cost, never client estimates for billing.
- Telemetry content capture is opt-in. Keep it off unless the pipeline is approved.

## Endnotes for this chapter

1. API key types and who each acts as, workspace selection, key expiration, WIF's limits, and App Attest token scope and lifetime. Anthropic, "Authentication" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/manage-claude/authentication
2. Service accounts, federation issuers and rules, token lifetime bounds, credential precedence and the migration steps from API keys. Anthropic, "Workload Identity Federation" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/manage-claude/workload-identity-federation
3. Workspace scoping of requests and resources, workspace limits, roles, the 100-workspace default and the `anthropic-workspace-id` header. Anthropic, "Workspaces" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/manage-claude/workspaces
4. Authorization is optional; HTTP versus stdio requirements; resource indicators; audience validation; servers must not accept or transit other tokens. MCP, "Authorization" (MCP specification, accessed 2026-11-02), https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/index
5. When to use authorization, the step-by-step OAuth flow, and common pitfalls such as long-lived tokens, logging credentials and session-ID authorization. MCP, "Understanding Authorization in MCP" (MCP docs, accessed 2026-11-02), https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/authorization
6. Token passthrough, confused deputy and scope minimization, including step-up authorization and common scope mistakes. MCP, "Security Best Practices" (MCP docs, accessed 2026-11-02), https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices
7. The permission evaluation order, `allowed_tools` versus `bypassPermissions`, auto-approved calls skipping `canUseTool`, `dontAsk`, and subagent mode inheritance. Anthropic, "Configure permissions" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/agent-sdk/permissions
8. Security boundaries, least privilege, and the proxy pattern for injecting credentials outside the agent's boundary. Anthropic, "Securely deploying AI agents" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/agent-sdk/secure-deployment
9. The MCP connector's `authorization_token`, with the caller responsible for obtaining and refreshing it. Anthropic, "MCP connector" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/agents-and-tools/mcp-connector
10. Session-scoped vault credentials shared by every thread in a Managed Agents session. Anthropic, "Multiagent orchestration" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/managed-agents/multiagent-orchestration
11. Limiting a key's permissions at the service that issued it, since sandbox settings do not. Anthropic, "Security risks and sandbox boundaries" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/managed-agents/secure-deployment-risks
12. How the SDK exports telemetry, span names and nesting, trace-context propagation, export intervals and failure modes, service tagging, end-user attribution and opt-in content capture. Anthropic, "Observability with OpenTelemetry" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/agent-sdk/observability
13. Third-party developers may not offer claude.ai login or rate limits in Agent SDK products without approval. Anthropic, "Agent SDK overview" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/agent-sdk/overview
14. Engineer for quality before latency, TTFT and baseline latency, prompt and output length, `max_tokens` truncation and streaming. Anthropic, "Reducing latency" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-latency
15. Fast mode's output-speed gain, unchanged intelligence, separate rate limits, `usage.speed`, Batch and Priority Tier exclusions, pricing and model availability. Anthropic, "Fast mode" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/fast-mode
16. Effort levels, per-model defaults and recommendations, effect on tool calls, and per-message effort preserving the cache. Anthropic, "Effort" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/effort
17. The SDK requires streaming for large `max_tokens` to avoid HTTP timeouts. Anthropic, "Streaming messages" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/streaming
18. What invalidates the cache (tools, effort, speed), TTFT gains and cache pre-warming. Anthropic, "Prompt caching" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/prompt-caching
19. Batch processing completion times and the 24-hour window. Anthropic, "Batch processing" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/batch-processing
20. Comparative latency and default effort for current models, and effort as often a better lever than switching models. Anthropic, "Models overview" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/models/overview; and Anthropic, "Choosing the right model" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/models/choosing-a-model
21. The Usage and Cost Analytics API's endpoints, dimensions, actors, date-range limits, beta status and data freshness. Anthropic, "Usage and Cost Analytics API" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/manage-claude/usage-cost-analytics-api
22. Claude Code's managed-settings lock on OTLP destinations, cardinality controls, `prompt.id` correlation, cost metrics as approximations, and privacy defaults. Anthropic, "Monitoring" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/monitoring-usage
23. `total_cost_usd` is a client-side estimate and must not drive billing. Anthropic, "Track cost and usage" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/agent-sdk/cost-tracking
24. The three service tiers, Priority Tier's uptime target and fallback, unsupported models, and commitments no longer being sold. Anthropic, "Service tiers" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/api/service-tiers
25. Standard and fast-mode prices for Claude Opus 5.5 and the 50% Batch discount. Anthropic, "Pricing" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/about-claude/pricing
26. Programmatic tool calling removes model round trips between tool calls, with no benefit for strictly sequential workflows. Anthropic, "Programmatic tool calling" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/agents-and-tools/tool-use/programmatic-tool-calling
27. What an LLM gateway centralizes (credentials, usage attribution, budgets, audit logging) and the cost of operating one. Anthropic, "Other LLM gateways" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/llm-gateway
