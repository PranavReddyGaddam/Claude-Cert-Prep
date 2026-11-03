# Chapter 11: Team Enablement and Operations

**Summary**: *Domain 7 asks how a whole organization runs Claude Code: how policy reaches every machine, how review and CI fit into the workflow, and how you find out why a session is slow, blocked or expensive. Most items come down to one question. Is the control enforced by something the developer cannot edit, and does it reach the session in question?*

Foundations [Chapter 5](/ccar-f/read/notes/05-claude-code-configuration) covers CLAUDE.md, rules, skills, hooks and permissions on one machine. [Chapter 6](/ccar-f/read/notes/06-claude-code-in-review-and-ci) covers headless mode and CI mechanics. This chapter assumes both and works at fleet scale.

## Team configuration is a policy-delivery problem, so pick the channel your threat model requires

### The decision

Rolling out Claude Code means making three choices. You choose the **API provider**, the **delivery channel** for managed policy, and **what to enforce**.<sup>[1]</sup>

| Provider | Choose it when | Catch |
|---|---|---|
| Claude for Teams / Enterprise | You want one per-seat subscription and no infrastructure. This is the default recommendation | Server-managed settings need this plan<sup>[2]</sup> |
| Claude Console | You are API-first and want pay-as-you-go billing | Console keys belong to a separate organization from claude.ai<sup>[2]</sup> |
| Amazon Bedrock, Google Cloud's Agent Platform, Microsoft Foundry | You want to inherit existing cloud compliance controls and billing | Code Review, cloud sessions, Remote Control and the Chrome extension need a claude.ai account<sup>[1]</sup> |

Managed policy can reach a machine through four sources. Claude Code checks them in priority order.<sup>[1]</sup>

| Channel | Priority | Strength |
|---|---|---|
| Server-managed (claude.ai admin console) | Highest | No device infrastructure needed. Fetched at startup and refreshed hourly |
| macOS plist / Windows HKLM registry | High | Writing requires admin rights, so it resists tampering |
| File-based `managed-settings.json` | Medium | Works on every platform. Only as strong as the file's permissions |
| Windows HKCU registry | Lowest | Users can write it. A convenience default, not enforcement |

### Server-managed settings have edges an exam will probe

- **They are a client-side control, not a security boundary.** On an unmanaged device, a user can tamper with the cache or run a modified binary. Anthropic recommends endpoint-managed settings through MDM when you need stronger guarantees.<sup>[2]</sup>
- **A provider switch bypasses them.** If a user sets `CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CODE_USE_VERTEX`, `CLAUDE_CODE_USE_FOUNDRY` or a non-default `ANTHROPIC_BASE_URL`, the settings fetch is skipped. A server-delivered `env` block can't undo that, because it arrives through the fetch that was skipped.<sup>[2]</sup>
- **The credential decides the organization.** A CI job that authenticates with a Console API key belongs to the Console organization, so claude.ai admin settings never reach it. The fixes are a `CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token`, authorized for the Teams or Enterprise organization, or a managed settings file deployed on the runner.<sup>[2]</sup>
- **By default, they fail open.** If the fetch fails, the client uses its cached settings, or starts without server policy if it has no cache. Set `forceRemoteSettingsRefresh: true` to make startup exit instead.<sup>[2]</sup>
- **Shell-executing settings need user approval.** Hooks, `apiKeyHelper`, some sandbox settings and proxy-type `env` variables show a security dialog. If the user rejects it, Claude Code exits.<sup>[2]</sup>
- **No per-group policy yet.** Server-managed settings apply to everyone in the organization the same way.<sup>[2]</sup>

For a mixed fleet, the documented pattern is server-managed settings for claude.ai users plus a file-based or plist/registry fallback for everyone else. Gateway-based remote delivery is the third-party-cloud equivalent.<sup>[1]</sup>

### Precedence and merging

From highest to lowest: **managed, then `--settings` on the command line, then project local, then shared project, then user**.<sup>[3]</sup> Array settings such as `permissions.allow` and `permissions.deny` **merge** across sources. Developers can add entries to a managed list but cannot remove any.<sup>[1]</sup> Model-list keys such as `availableModels` are an exception: a managed value replaces the lower ones.<sup>[1]</sup> A managed `model` is only a starting default. The lock is `availableModels`.<sup>[3]</sup> A few security keys go the other way, and a stricter value from a lower scope wins. For `maxEffortLevel`, for example, the lowest cap from any scope applies.<sup>[3]</sup>

Two consequences come up often. A key committed in `.claude/settings.json` may not reach teammates. Some keys are ignored in repository files, and `permissions.allow` rules wait until each person trusts the folder, while deny rules apply at once.<sup>[3]</sup> Telemetry exporter variables are also ignored in repository settings, so a repository can't turn telemetry on or redirect it.<sup>[13]</sup>

### What to enforce, and the gap between layers

Managed settings can lock permission rules (`allowManagedPermissionRulesOnly`), disable bypass mode, sandbox Bash with a network domain allowlist, restrict MCP servers and plugin marketplaces, allow only managed hooks, enforce a login method or organization, restrict which providers a machine may use (`allowedProviders`), and set a version floor.<sup>[1]</sup> The admin page names the gap to remember: **denying WebFetch does not stop `curl`** if Bash is allowed. The sandbox's OS-level domain allowlist closes it.<sup>[1]</sup> A **managed CLAUDE.md** is guidance, not a client-enforced rule.<sup>[1]</sup>

### Gateways and devcontainers

An **LLM gateway** centralizes credentials, per-developer usage attribution, budgets and rate limits, and audit logging. It can also let you switch providers without touching developer machines.<sup>[5]</sup> The cost is that you now operate it, and a gateway that doesn't forward newer Claude Code capabilities breaks those features.<sup>[5]</sup> To make the gateway the only destination a machine can use, set `allowedProviders: ["customEndpoint"]` and pin `ANTHROPIC_BASE_URL` in managed settings.<sup>[5]</sup> Sessions through a gateway are **not eligible for the HIPAA configuration**.<sup>[1]</sup> On cloud providers, pin model versions with the `ANTHROPIC_DEFAULT_*_MODEL` variables, so the team, not Claude Code's built-in default, decides when users move to a new model.<sup>[4]</sup>

A **dev container** gives everyone the same isolated environment. With `--dangerously-skip-permissions`, though, it does not stop a malicious project from exfiltrating anything inside the container, including Claude Code's own credentials.<sup>[6]</sup> The documented pairing is to run as a non-root user (the CLI rejects the flag as root), restrict network egress, avoid mounting host secrets such as `~/.ssh`, and use only trusted repositories.<sup>[6]</sup> A `managed-settings.json` copied in by the repository's Dockerfile can be removed by anyone with write access. For policy engineers can't bypass, use server-managed settings or MDM.<sup>[6]</sup>

## Workflow improvement means giving Claude what it can't see, a check to run, and enforcement only for the rules that can't bend

### The decision

The best-practices guide sorts most session problems into four causes, each with its own fix:<sup>[7]</sup>

- Claude lacks information it can't get from the repository. Tell it.
- Claude had no way to check its work. Give it a check that returns pass or fail.
- Claude broke a must-never rule. Move the rule into a hook, deny rule or managed setting.
- The default cost too much. Change the default.

It also warns against over-enforcing. Every hook and deny rule will sometimes fire when it shouldn't, so keep the enforced set small.<sup>[7]</sup> A reviewer asked to find problems always finds something, so a spec-based review prompt should say "skip style."<sup>[7]</sup>

At team scale, put a short CLAUDE.md and the test command in the repository, procedures in skills, and non-negotiables in managed settings. Vet third-party skills as you would software for production. Scripts, network calls and MCP references are high-risk indicators.<sup>[14]</sup>

### Choosing the review and automation mechanism

| Need | Mechanism | Key facts |
|---|---|---|
| Automatic review on every PR, no workflow to maintain | **Code Review** | Team/Enterprise only. Runs on Anthropic infrastructure with read-only repo access. Never approves or blocks. Reads `REVIEW.md` from the base branch, never from the PR. Levels are Quick, Standard (default) and Deep. Not available with ZDR, the HIPAA configuration or CMEK<sup>[8]</sup> |
| Review in your own pipeline or on your own runners | **GitHub Actions** (`claude-code-action`) | Any API key or cloud credentials. You pay for Actions minutes plus tokens<sup>[9]</sup> |
| A developer's pre-push check | `/code-review` | Any plan. Runs in a fresh subagent<sup>[7][8]</sup> |

For an organization-wide Actions rollout, store the secret at the organization level as a **Console API key, not an OAuth token**, because an OAuth token is tied to the subscription of whoever generated it.<sup>[9]</sup> Better still, use **workload identity federation**, which exchanges GitHub's OIDC token for API access so no long-lived secret is stored.<sup>[9]</sup> The official GitHub App's permission set is all-or-nothing. If policy demands least privilege, build a custom app with only Contents, Issues and Pull requests. That app serves only the Action, since Code Review still needs the official one.<sup>[9]</sup> Runs check that the triggering user has write access and reject bot actors unless they are listed in `allowed_bots`.<sup>[9]</sup> Control cost with `--max-turns`, workflow timeouts and concurrency limits.<sup>[9]</sup>

### Measuring whether it helped

The Teams/Enterprise analytics dashboard shows usage, contribution metrics (merged PRs and lines written with Claude Code, through the GitHub app) and a leaderboard.<sup>[10]</sup> Contribution metrics are deliberately conservative underestimates. They attribute sessions from 21 days before to 2 days after a PR merges. They are not available with ZDR, and they cover only users in the claude.ai organization, so Console and third-party-cloud usage is excluded.<sup>[10]</sup> The page suggests reading them alongside DORA metrics.<sup>[10]</sup> Cloud-provider usage never reaches Anthropic's dashboards, so per-user attribution there needs OpenTelemetry or a gateway.<sup>[12]</sup>

## Operational debugging starts by classifying the symptom, before touching any knob

### Diagnostic tools

- `/doctor` runs a check of installation, settings, extensions and context. Use `claude doctor` from the shell when `claude` won't start.<sup>[11]</sup>
- `/status` shows which settings sources loaded and which managed source won.<sup>[1][3]</sup>
- `/context` shows what fills the window.<sup>[11]</sup>
- `claude --safe-mode` disables all customizations, to test whether a plugin, MCP server or hook is the cause.<sup>[11]</sup>
- `--debug-file <path>` writes a debug log. OpenTelemetry exporter failures appear there tagged `[3P telemetry]`.<sup>[13]</sup>

### Monitoring with OpenTelemetry

OpenTelemetry is the only option that streams per-user token and cost metrics into your own stack in near real time on every provider.<sup>[12]</sup> The settings that matter:<sup>[13]</sup>

- `CLAUDE_CODE_ENABLE_TELEMETRY=1` is required. Choose exporters with `OTEL_METRICS_EXPORTER` and `OTEL_LOGS_EXPORTER`, and point them at an endpoint.
- Deploy these through **managed settings**. A managed `OTEL_EXPORTER_OTLP_ENDPOINT` removes any per-signal endpoints a developer set, so nobody can redirect a signal. Exporter selectors follow normal precedence, so lock them too if they must stay on.
- Prompt text, tool details and raw API bodies are **off by default** (`OTEL_LOG_USER_PROMPTS`, `OTEL_LOG_TOOL_DETAILS`, `OTEL_LOG_RAW_API_BODIES`). Turning one on is a data-handling decision.
- `OTEL_RESOURCE_ATTRIBUTES` such as `team.id` or `cost_center` lets you cut dashboards and alerts by team.
- Key metrics: `claude_code.session.count`, `cost.usage`, `token.usage` (by input, output, cacheRead and cacheCreation), `lines_of_code.count`, `code_edit_tool.decision` and `active_time.total`.
- `OTEL_*` variables are **not passed to subprocesses** such as Bash, hooks or MCP servers.

Cost figures are **estimates at list price**. To make them match contracted rates, set the `modelPricing` managed setting, which Claude Code ignores in user and project files.<sup>[12]</sup>

### Cost management

Anthropic reports that enterprise deployments average about **$13 per developer per active day** and **$150–250 per developer per month**. For 90% of users, costs stay below $30 per active day. The guidance is to pilot first and set a baseline.<sup>[12]</sup> On the Console, Claude Code traffic runs in an auto-created "Claude Code" workspace. That traffic counts toward organization rate limits, so set a workspace limit to protect production workloads.<sup>[12]</sup> Recommended per-user rate limits fall as team size grows, because fewer people use it at the same time. For 100–500 users, the guidance is 15k–20k TPM per user.<sup>[12]</sup>

Unexpectedly high spend usually comes from long sessions that were never cleared, or from Opus left as the default model.<sup>[12]</sup> The other levers are `/clear` between tasks, Sonnet for most coding, `model: haiku` for simple subagents, moving workflow instructions from CLAUDE.md into skills, lowering effort, and hooks that filter verbose output.<sup>[12]</sup> Agent teams use roughly 7x the tokens of a standard session when teammates run in plan mode.<sup>[12]</sup>

### Reading the evidence

| Symptom | Likely cause |
|---|---|
| A developer on Bedrock ignores org policy | A provider variable skips the server-managed fetch. Deliver policy by MDM or file<sup>[2]</sup> |
| CI ignores the admin console's deny rules | The job authenticates with a Console API key from another organization<sup>[2]</sup> |
| Claude `curl`s a blocked domain | Only WebFetch was denied. Bash needs the sandbox network allowlist<sup>[1]</sup> |
| The team's committed allow rule doesn't apply for a new hire | The folder hasn't been trusted yet<sup>[3]</sup> |
| OTel cost doesn't match the invoice | List-price estimates. Set managed `modelPricing`<sup>[12]</sup> |
| `Autocompact is thrashing` | A large file or tool output keeps refilling the context. Read it in chunks, or delegate to a subagent<sup>[11]</sup> |
| Session limit message, and switching models doesn't help | A seat-based usage window shared across models<sup>[12]</sup> |
| CI doesn't run on Claude's commits | They were pushed with the default `GITHUB_TOKEN`, which doesn't trigger workflows<sup>[9]</sup> |

## Worked design review: a 400-developer rollout with mixed providers

**The flawed design.** A platform team commits `.claude/settings.json` with deny rules and OpenTelemetry exporter variables. Half the developers use Enterprise seats and half use Bedrock. CI runs Claude Code with the company Console API key. Security requires that no session reaches unapproved domains. Finance wants cost per team.

**What breaks.** The repository's telemetry variables are ignored.<sup>[13]</sup> Bedrock users skip server-managed settings.<sup>[2]</sup> The CI job's Console key never gets claude.ai policy.<sup>[2]</sup> A WebFetch deny rule leaves `curl` open.<sup>[1]</sup> Analytics dashboards don't cover Bedrock usage.<sup>[12]</sup>

**The constraint that decides.** Security's "no unapproved domains" has to hold on every session, whichever provider it uses.

**The better design.** Use server-managed settings for Enterprise users, and MDM plist/HKLM policy or a protected `managed-settings.json` for everyone else and for CI runners.<sup>[1][2]</sup> In managed policy, enable the sandbox with a domain allowlist, set `allowedProviders`, disable bypass mode and allow only managed permission rules.<sup>[1]</sup> Configure OpenTelemetry in managed settings with `OTEL_RESOURCE_ATTRIBUTES` for team and cost center, plus `modelPricing`.<sup>[12][13]</sup> Optionally, add a gateway for Bedrock attribution and budgets, accepting that you will have to operate it.<sup>[5]</sup>

**Why the tempting alternatives lose.**

- **"Write the domain rule in CLAUDE.md."** That is guidance. A must-never rule needs enforcement.<sup>[7]</sup>
- **"Server-managed settings for everyone."** They don't reach Bedrock sessions or Console-key CI.<sup>[2]</sup>
- **"Audit the logs weekly for unapproved domains."** That is a compensating control. It detects the violation instead of preventing it.
- **"Use the analytics dashboard for per-team cost."** It doesn't cover cloud-provider usage.<sup>[12]</sup>

## How wrong answers are built

- **"Commit the policy to `.claude/settings.json` so everyone gets it."** Repository writers can change it, some keys are ignored there, and allow rules wait on trust. Policy belongs in managed settings (wrong mechanism).
- **"Deny WebFetch to stop exfiltration."** Bash still reaches the network. This is a partial control where the capability should be removed (family 1).
- **"Use `--dangerously-skip-permissions` in a dev container. The container makes it safe."** The container doesn't stop exfiltration of what is inside it, credentials included (family 1).
- **"Turn off telemetry content capture and analytics to save cost."** This drops observability the stem needs (family 2).
- **"Upgrade everyone to Opus to cut rework."** A bigger model is a wrong knob when the cause is uncleared sessions or a missing check (family 3).
- **"Server-managed settings must be broken."** When the stem mentions Bedrock users, a custom base URL or a Console key, follow that evidence instead (family 4).

## What to remember

- The precedence order is managed, `--settings`, local, project, user. Arrays merge. Managed `availableModels` replaces.
- Server-managed settings need a Teams/Enterprise plan, refresh hourly and fail open unless you set `forceRemoteSettingsRefresh`. They are client-side, not a security boundary.
- Provider variables, a custom base URL or a Console API key all keep server-managed settings from reaching a session.
- HKLM and plist resist tampering. HKCU does not.
- Deny rules work on tools. The sandbox enforces network limits at the OS level.
- Code Review never approves or blocks, reads `REVIEW.md` from the base branch, and is unavailable with ZDR, the HIPAA configuration or CMEK.
- For org-wide Actions, use a Console API key or OIDC federation, not a personal OAuth token.
- OpenTelemetry needs `CLAUDE_CODE_ENABLE_TELEMETRY=1`, works on every provider, redacts content by default, and reports estimated cost at list price.
- Average enterprise cost is about $13 per developer per active day, or $150–250 per month.

## Endnotes for this chapter

1. The admin decision map covers provider choice, the four managed-settings channels and their priority, array merging and model-key replacement, enforcement controls (permission lockdown, sandbox, MCP, hooks, `allowedProviders`), the WebFetch-versus-`curl` gap, gateway sessions being ineligible for the HIPAA configuration, and `/status` verification. Anthropic, "Set up Claude Code for your organization" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/admin-setup
2. The page covers server-managed settings requirements, hourly refresh, fail-open caching and `forceRemoteSettingsRefresh`, security approval dialogs, the lack of per-group configuration, bypass through provider variables or a custom base URL, Console-key sessions belonging to another organization, and its status as a client-side control rather than a security boundary. Anthropic, "Configure server-managed settings" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/server-managed-settings
3. The page gives the settings precedence order, list merging and model-list exceptions, managed `model` as a default rather than a lock, trust-gated allow rules, and exceptions where a stricter lower-scope value wins (including `maxEffortLevel`). Anthropic, "Settings files and precedence" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/settings
4. The page compares deployment options, distinguishes proxies from LLM gateways, and recommends pinning model versions on cloud providers with the `ANTHROPIC_DEFAULT_*_MODEL` variables. Anthropic, "Enterprise deployment overview" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/third-party-integrations
5. Gateways centralize credentials, usage tracking, cost controls, audit logging and provider switching. The trade-off is that you operate the gateway and must keep it forwarding new features. `allowedProviders: ["customEndpoint"]` pins the destination. Anthropic, "Other LLM gateways" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/llm-gateway
6. Dev containers don't prevent exfiltration under `--dangerously-skip-permissions`. The page says to avoid mounting host secrets, notes the CLI rejects the flag as root, recommends egress restriction, and warns that Dockerfile-delivered managed settings can be removed by repository writers. Anthropic, "Development containers" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/devcontainer
7. The guide separates deterministic from non-deterministic instructions, advises giving Claude a pass/fail check, enforcing must-never rules with hooks, deny rules or managed settings, keeping the enforced set small, and telling spec reviews to skip style. Anthropic, "Best practices for Claude Code" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/best-practices
8. Code Review is for Team/Enterprise, runs on Anthropic infrastructure with read-only access, never approves or blocks, reads `REVIEW.md` from the base branch, offers Quick, Standard and Deep levels, and is unavailable with ZDR, the HIPAA configuration or CMEK. Anthropic, "Code Review" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/code-review
9. The page covers org rollout with a Console API key or OIDC workload identity federation, the all-or-nothing GitHub App permissions and the custom-app alternative, write-access and bot checks, cost controls, and `GITHUB_TOKEN` commits not triggering CI. Anthropic, "Claude Code GitHub Actions" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/github-actions
10. Contribution metrics are conservative and need the GitHub app. They are unavailable with ZDR, use a 21-day/2-day attribution window, exclude Console and third-party usage, and are suggested for use alongside DORA metrics. Anthropic, "Track team usage with analytics" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/analytics
11. The page covers `/doctor`, `claude doctor`, `/context`, `--safe-mode`, and recovering from auto-compaction thrashing. Anthropic, "Troubleshooting" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/troubleshooting
12. The page gives average enterprise cost figures, spend controls by setup, OpenTelemetry as the per-user stream on every provider, `modelPricing` for contracted rates, the Claude Code workspace and per-user rate-limit recommendations, limit-message meanings, common causes of high spend, token-reduction levers, and agent-team token use. Anthropic, "Manage costs effectively" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/costs
13. The page covers telemetry enablement and exporters, managed settings locking the OTLP destination, repository settings being ignored for exporter variables, content-logging gates being off by default, `OTEL_RESOURCE_ATTRIBUTES`, the metric list, non-propagation to subprocesses, and `[3P telemetry]` debug lines. Anthropic, "Monitoring" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/monitoring-usage
14. Enterprise skill vetting treats code execution, instruction manipulation, MCP references, network calls and hardcoded credentials as high-risk indicators. Anthropic, "Skills for enterprise" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/agents-and-tools/agent-skills/enterprise
