# Chapter 9: Governance, Safety and Risk

**Summary**: *Model behavior is not a security control. A Pro architect assumes that some injection will succeed, some output will be wrong and some reviewer will click "approve" without reading. Each "must never" requirement then goes into a layer that does not depend on the model: a missing capability, a deny rule, a sandbox, a data-handling arrangement, a platform choice. Prompts, screens and human review sit on top of those layers. They are not a substitute for them.*

This chapter assumes Foundations [Chapter 5](/ccar-f/read/notes/05-claude-code-configuration) (hooks, permissions, managed settings) and [Chapter 9](/ccar-f/read/notes/09-reliability-and-human-review) (review routing). Token scoping is in [Pro Chapter 7](/ccar-p/read/pro-notes/07-identity-latency-and-observability).

## Guardrails are layers, and only the deterministic layers can carry a "never"

### The decision

The architect decides which layer enforces each rule. Anthropic says Claude is inherently resilient to prompt injection, but **"model behavior is not a security control"**; settings exist to **limit the effect if an attempt succeeds**.<sup>[1]</sup> The SDK deployment guide adds that if a malicious file tells the agent to send data out, network controls can block it entirely.<sup>[2]</sup> Sort every control into one of two kinds:

- **Probabilistic layers** lower how often something goes wrong: system-prompt policy, input screens, tool-output screens, output filters.
- **Deterministic layers** put a ceiling on how bad it can get: the tool list, deny rules, hooks, sandboxes, network allowlists, credential proxies, data-handling arrangements.

### The layer stack

| Layer | What Anthropic documents | What it stops | What it cannot stop |
|---|---|---|---|
| **Input screen** | A lightweight model (the page names Claude Haiku 5.5) classifies input with a structured boolean verdict. Treat `stop_reason: "refusal"` from the screen as harmful<sup>[3]</sup>. A **separate** screening instance tends to beat one call doing both jobs<sup>[4]</sup> | Direct jailbreaks, abusive input | Input that is harmless alone and dangerous with a tool |
| **System-prompt policy** | State that tool, document and search content is **untrusted data** that must never override the system prompt or the user's request<sup>[3]</sup> | Casual embedded instructions | A determined attacker. This layer is guidance only |
| **Untrusted-content channel** | Put third-party content **only in `tool_result` blocks**, say what it is and where it came from, and **JSON-encode** it so it cannot "break out" of its delimiters. Do not put your own instructions in tool results<sup>[3]</sup> | Confusing data with instructions | An injection that Claude still follows |
| **Tool-output screen** | A small classifier checks each raw tool result; flagged content becomes an error or stripped summary<sup>[3]</sup> | Known injection patterns | New phrasings. Adds latency per tool call |
| **Capability scope** | Smallest tool set. Keep **untrusted input away from powerful tools**. Approvals for risky actions<sup>[1]</sup> | Damage from a successful injection | Misuse of a tool you did grant |
| **Hooks and permission rules** | Evaluation order: **hooks → deny rules → ask rules → permission mode → allow rules → `canUseTool`**. A deny rule wins **even in `bypassPermissions` and even when a hook returned `allow`**<sup>[5]</sup> | Specific forbidden actions, every time | Actions you did not think to write a rule for |
| **Sandbox and network** | OS-enforced limits on files and hosts for shell commands. Agent containers with no internet gateway. Egress only through a proxy<sup>[6][2]</sup> | Exfiltration over the network, writes outside the working area | Data the agent puts in its own reply |
| **Credential proxy** | The proxy injects credentials outside the agent's boundary. **The agent never sees the secret**<sup>[2]</sup> | Key theft by code running in the sandbox | Misuse of the proxied API within its allowed scope |
| **Output filter and monitoring** | Post-process outputs for leaked content. Monitor for successful injections. Throttle or ban **repeat offenders**<sup>[3][7]</sup> | Leaks and abuse that the earlier layers missed | Harm that already happened |

Three details decide many hard items.

- **A hook `allow` is not a bypass.** Deny and ask rules are still checked. Among `PreToolUse` hooks, **`deny` beats `defer`, which beats `ask`, which beats `allow`**.<sup>[5][8]</sup> A PostToolUse hook can replace a tool's output before Claude sees it (`updatedToolOutput`), a natural place for redaction or an injection screen.<sup>[8]</sup>
- **The Claude Code sandbox covers shell commands only.** File tools, MCP servers and hooks run outside it. By default it can read **`~/.ssh` and `~/.aws/credentials`**; its domain allowlist **starts empty**.<sup>[6]</sup>
- **Server-managed settings are a client-side control, not a security boundary.** Unmanaged devices, third-party providers and a non-default `ANTHROPIC_BASE_URL` bypass them; MDM-delivered endpoint settings are stronger; `forceRemoteSettingsRefresh: true` makes startup fail closed.<sup>[9]</sup>

### Prompt leak: remove the secret, do not armor the prompt

Anthropic advises leak-resistant prompting **only when absolutely necessary**, because it can degrade performance, and suggests **monitoring first** (output screening, post-processing). Its strongest advice: **if Claude does not need a proprietary detail, leave it out**.<sup>[7]</sup> If disclosing something in the prompt would be a breach, move it behind a tool that returns only the derived answer.

### Streaming refusals are successful responses

When streaming classifiers step in, the stream ends with **`stop_reason: "refusal"`** and a `stop_details` object on the `message_delta` event.<sup>[10]</sup>

- **It arrives as HTTP 200**, and as a **succeeded** batch result, so error-rate monitoring misses it. Track it as its own signal.<sup>[10]</sup>
- **Text may already have streamed** (the documented example carries partial text), so a streaming UI needs a way to replace it.<sup>[10]</sup>
- **Recovery means changing something**: reset the context or retry on a different model. Resending to the same model usually refuses again. `category` and `explanation` can be `null`, so branch on `stop_reason`.<sup>[10]</sup>

### Options ranked by constraint

| When this dominates | Prefer | Avoid |
|---|---|---|
| **Risk** (irreversible or external side effects) | Removing the capability, a deny rule or hook, sandbox plus egress allowlist, credential proxy | Relying on a system-prompt instruction or a screen alone |
| **Latency** | One cheap input screen in parallel with the main call. Deterministic rules, which cost nothing at inference | A model-based screen on every tool result in a tight loop, unless the content is untrusted |
| **Cost** | Screens on a small model. Screens only on untrusted channels | Running a large model as the classifier |
| **Maintainability** | Few layers, each enforced in one place (managed settings, a shared hook library) | Guardrail prose copied into every prompt |

### Supply chain: skills and MCP servers are code you are installing

Anthropic rates **bundled scripts, instruction manipulation, MCP references, network calls and hardcoded credentials** in a skill as high risk, and says to weigh the **combined risk** of file-read plus network tools. Skill scanning for Claude Enterprise **does not cover skills uploaded through the Claude API**, so API deployments rely on review and version pinning.<sup>[11]</sup> For local MCP servers, clients must show the exact startup command and get consent, and should run servers sandboxed.<sup>[12]</sup>

## Each LLM failure mode has a mechanism that bounds it

### The decision

"The model might do something bad" is not a risk analysis. Name the failure, its path into production and the layer that bounds it.

### Failure modes and their bounding mechanism

| Failure mode | How it reaches production | What bounds it |
|---|---|---|
| **Hallucination** | Fluent, unsourced answers, especially on long inputs | Allow "I don't know"; quotes first on documents over 20k tokens; cite, then **retract** unsupported claims; best-of-N; restrict to provided documents. These reduce but **do not eliminate** it<sup>[13]</sup> |
| **Direct injection or jailbreak** | The user is the adversary | Input screen, refusal policy, repeat-offender throttling<sup>[3]</sup> |
| **Indirect injection** | The user is trusted. A web page, email, OCR text or tool result carries the instructions<sup>[3]</sup> | Tool-result channel, provenance labels, JSON encoding, tool-output screen, **least privilege**<sup>[3]</sup> |
| **Excessive agency** | Claude takes an unexpected step, such as using a tool or credential it can reach, while pursuing your goal<sup>[1]</sup> | Smallest tool set, approvals, and key permissions limited **at the issuing service**, which sandbox settings do not do<sup>[1]</sup> |
| **Exfiltration over the network** | A command posts a file to an outside host<sup>[1]</sup> | Limited networking, domain lists, egress through a proxy<sup>[1][2]</sup> |
| **Leakage through the reply** | The agent writes data it may read into its answer or a tool output | Not stopped by the sandbox: **do not put data in the sandbox that must never leave it**<sup>[1]</sup>. Scope what it may read |
| **Confused deputy or token passthrough** | An MCP server forwards a token that was not issued to it | MCP servers **MUST NOT** accept tokens not issued for them<sup>[12]</sup> |
| **Scope inflation** | Broad scopes such as `files:*` or `admin:*` are requested up front | Minimal starting scopes, step-up elevation, elevation events logged<sup>[12]</sup> |

*General practice, not from Anthropic documentation:* the highest-risk shape is an agent with **untrusted content**, **sensitive data** and an **outbound channel** together. Removing any one ends that breach path, and removing the channel or the data is usually cheaper than making the content safe.

### Reading the evidence

| Symptom | Likely cause | Fix that follows the evidence |
|---|---|---|
| Agent took an action that a retrieved document "asked for" | Untrusted content treated as instructions, and a powerful tool within reach | Move the tool out of reach of that content, or gate it. Do not just add prompt text |
| Secret found in the transcript of a sandboxed agent | Secret was in the environment or a readable file. The sandbox does not stop a reply from carrying it | Credential proxy, `denyRead`, or mask credentials<sup>[6][2]</sup> |
| Policy blocks work on managed laptops but not on a contractor's machine | Server-managed settings on an unmanaged device, or a third-party provider env var | Endpoint-managed settings by MDM. Treat server-managed settings as policy, not a boundary<sup>[9]</sup> |
| User complaints about "blank answers", error dashboard green | Streaming refusals counted as 200s | Track `stop_reason: "refusal"` as a signal<sup>[10]</sup> |
| Hallucinations rise after the corpus is refreshed, model unchanged | Retrieval or grounding gap, not the model | Quote-first prompting and citation checks. Look at retrieval ([Pro Chapter 6](/ccar-p/read/pro-notes/06-retrieval-augmented-generation)) |

## The human gate goes where the irreversible effect happens

### The decision

Decide where review sits, what routes a case there and what the reviewer sees. The usual mistake is gating **generated text**, where everything looks plausible, instead of the **action**, where the effect is real. Requiring human approval for sensitive actions is a documented core use of hooks.<sup>[8]</sup>

### Mechanisms the docs give you

- **Client tools are your gate.** For a client tool, your application executes the call after Claude returns `tool_use`. Your code can pause, ask a person, or return an `is_error` result instead of running it.<sup>[14]</sup>
- **`canUseTool`** pauses execution until it returns. It supports approve, **approve with changes** (`updatedInput`), approve and remember, reject with a message Claude adapts to, and suggest an alternative.<sup>[15]</sup> An **`ask` rule** sends a call to the callback **even in `bypassPermissions` mode**.<sup>[5]</sup>
- **Long approvals.** The callback can stay pending indefinitely. If a person may take longer than your process can stay alive, have a `PreToolUse` hook return **`defer`**. The turn ends with `stop_reason: "tool_deferred"` and resumes later from the persisted session.<sup>[8][15]</sup>
- **External approval systems** connect through custom tools. `AskUserQuestion` is **not available in subagents**.<sup>[15]</sup> An offline transcript reviewer (Managed Agents) is **detection**, not prevention.<sup>[1]</sup>

### Options ranked by constraint

| Action profile | Gate | Why |
|---|---|---|
| Irreversible, external, high value (payments, customer email, deletes) | **Synchronous approval** showing the exact input | Afterward is too late |
| Reversible, internal, high volume (drafts, tags) | **No per-item gate.** Sample audits and rollback | Per-item gates here create fatigue |
| Uncertain extraction feeding a decision | **Risk-routed review** (Foundations Chapter 9) | Spends review where errors are |
| Long-running async agent | **`defer` and resume** | The process does not have to stay alive |
| Action that should never happen | **No gate: remove the capability** | An approval step for a forbidden action is a compensating control |

### Review fatigue is a design defect

Anthropic's eval guidance names **reviewer fatigue** as a limit on human review.<sup>[16]</sup> Claude Code designs against it with allowlists for safe commands and an **auto mode** whose classifier reviews actions to reduce prompt fatigue.<sup>[17][18]</sup>

*The rest of this subsection is general practice, not from Anthropic documentation.*

- **An approval rate near 100% means the gate is decorative.** Track overturn rate and seconds per decision, and **seed known-bad cases** to measure the catch rate.
- **Reduce volume before adding reviewers.** Remove capabilities that never need a human, auto-approve reversible classes, gate on risk signals.
- **Show evidence and allow edits.** The reviewer sees the exact input, the source quote and why it was routed, and can approve with changes (`updatedInput`).<sup>[15]</sup>

## Most compliance questions are decided by platform choice and data flow

### The decision

Items rarely turn on legal text. They turn on **which arrangement and platform** fit the data, and **which features fall outside** it.

### What Anthropic documents about its own offerings

| Control | What the pages say |
|---|---|
| **Zero data retention (ZDR)** | Prompts and responses are not stored at rest after the response returns. Enabled **per organization** through sales; new organizations are not covered automatically<sup>[19]</sup> |
| **ZDR exclusions** | The Console, **Managed Agents**, consumer plans, Teams and Enterprise interfaces (Claude Code on Enterprise has a separate offering), third-party integrations. **No CORS** under ZDR<sup>[19]</sup> |
| **ZDR and "No" features** | The API **does not block** features that are not ZDR-eligible. Using one is a **choice to step outside ZDR** for that data. Examples: Batch (29-day retention), Files API, code execution (container data up to 30 days), MCP connector, Agent Skills<sup>[19]</sup> |
| **HIPAA readiness** | A signed BAA plus a HIPAA-enabled organization; broader safeguards than ZDR, so **you do not also need ZDR**. **Per organization** and **permanent**. Ineligible features return a **400**<sup>[19]</sup> |
| **HIPAA scope** | Covers the Claude API and Claude in Microsoft Foundry (with a BAA plus the HIPAA configuration on the Azure subscription). **Not covered**: the Console, Claude Code, Claude Platform on AWS, beta features unless listed, and partner-operated platforms (Bedrock, Google Cloud's Agent Platform), which have their own compliance documentation<sup>[19]</sup> |
| **PHI in schemas** | Structured-output and `strict` tool schemas are cached separately and do not get PHI protections. **Do not put PHI in property names, `enum`, `const` or `pattern`**<sup>[19]</sup> |
| **Covered Models** | Named models require **30-day retention**, so not ZDR unless expressly authorized; a ZDR organization can enable Standard retention in a non-default workspace<sup>[19]</sup> |
| **CMEK** | On Claude Platform, CMEK needs a workspace with **Standard retention (30 days)** and cannot share a workspace with ZDR. After a key is attached, retention cannot be turned off for that workspace<sup>[20]</sup> |
| **Retention regardless of arrangement** | Content flagged by trust and safety systems may be kept **up to 2 years**, and data may be kept where required by law<sup>[19]</sup> |
| **Data residency** | `inference_geo` is `"global"` (default) or `"us"`, on Claude 4.6 and later models. US-only inference is **1.1x** standard pricing. Workspaces can enforce `allowed_inference_geos` and `default_inference_geo`. **Workspace geo** (storage at rest) is set at creation, cannot be changed, and is currently `"us"` only<sup>[21]</sup> |
| **Amazon Bedrock** | AWS-managed infrastructure with **zero operator access**, inside the AWS security boundary. Data handling is governed by Bedrock. Regional endpoints for data residency carry a **10% premium** over global. The Compliance API and Batches are not supported there<sup>[22]</sup> |
| **Microsoft Foundry** | Hosted on Azure or on Anthropic. For **Hosted on Azure**, prompts and completions stay within Azure. US Data Zone Standard is equivalent to `inference_geo: "us"`. No Compliance API<sup>[23][21]</sup> |
| **Google Cloud** | **Anthropic managed** (Claude API surface, Anthropic is the processor, ZDR on request) or **Google managed** (Agent Platform, Google is the processor)<sup>[24][19]</sup> |
| **Compliance API** | Per-event records for security, legal and compliance teams, retrieved after the fact (Activity Feed kept 6 years); **inference hooks** are the inline alternative<sup>[25][19]</sup>. Workspaces separate environments with their own keys and limits<sup>[26]</sup> |

### Numbers worth knowing

| Figure | Value |
|---|---|
| US-only inference (`inference_geo: "us"`, Claude 4.6+) | 1.1x standard token pricing<sup>[21]</sup> |
| Bedrock regional endpoint | 10% premium over global<sup>[22]</sup> |
| Standard retention required by CMEK and Covered Models | 30 days<sup>[20][19]</sup> |
| Batch retention / code execution container data | 29 days / up to 30 days<sup>[19]</sup> |
| Flagged content, any arrangement | Up to 2 years<sup>[19]</sup> |
| Compliance Activity Feed | 6 years<sup>[19]</sup> |

### Reasoning about GDPR, HIPAA and FedRAMP

*General practice, not from Anthropic documentation. This is architectural reasoning, not legal advice.*

- **Run on the platform that already holds the authorization.** If a workload needs a FedRAMP level, a BAA or a region, run Claude where that authorization already exists for the service you will use. These Anthropic pages do not state FedRAMP status for any offering, so check the provider's compliance documentation. On Bedrock and Google-managed Google Cloud, the cloud provider is the data processor.<sup>[19]</sup>
- **Minimize what you send.** GDPR's data-minimization and storage-limitation principles and HIPAA's minimum-necessary idea agree: strip or pseudonymize identifiers the task does not need. Data never sent raises no retention or residency question.
- **Map every feature to its retention.** A "ZDR system" that uses Batch, Files or code execution is not zero-retention for that data.<sup>[19]</sup>
- **Residency has two halves**: where inference runs and where data rests are separate settings, and each requirement must be met.<sup>[21][22]</sup>
- **Plan audit and deletion paths**: which retained records answer "who did what, when" (Compliance API, CloudTrail on Bedrock), and where every copy of personal data lives.<sup>[22][25]</sup>

### Options ranked by constraint

| Requirement | Strongest fit | Common trap |
|---|---|---|
| PHI on the Claude API | HIPAA-ready organization with a BAA. Only eligible features. No PHI in schemas | Adding ZDR "as well" (not needed), or running on Claude Platform on AWS (not HIPAA-ready)<sup>[19]</sup> |
| No retention of prompts | ZDR organization using only ZDR-eligible features | Using Batch or Files for cost and assuming ZDR still applies |
| Customer-held keys | CMEK on a Standard-retention workspace | Expecting CMEK and ZDR in the same Claude Platform workspace<sup>[20]</sup> |
| US-only inference | `allowed_inference_geos: ["us"]` enforced at the workspace | Relying on each developer to set the parameter on each request |
| Must stay inside an existing cloud boundary | Bedrock or Foundry Hosted on Azure | Assuming every first-party feature exists there (check the unsupported lists)<sup>[22][23]</sup> |
| Mixed regulated and unregulated workloads | **Separate organizations** for HIPAA, separate workspaces for retention overrides | One organization for everything<sup>[19]</sup> |

### Reading the evidence

| Error or symptom | Cause |
|---|---|
| `400` listing "features are not available for HIPAA-regulated organizations" | An ineligible feature, such as code execution, in a HIPAA organization. Remove it<sup>[19]</sup> |
| `400` "must have data retention enabled" | A Covered Model called from a ZDR organization or workspace<sup>[19]</sup> |
| `400` on `inference_geo` | A model older than Claude 4.6, or a geo outside the workspace's allowed list<sup>[21]</sup> |
| Browser calls fail after ZDR is enabled | CORS is not supported under ZDR. Add a backend proxy<sup>[19]</sup> |

## Fairness is tested by slices, and transparency is built from provenance

### The decision

Show that the system treats people consistently and can explain its outputs. Fairness is measured and transparency is engineered; neither comes from writing "be fair" in the prompt.

### Bias and fairness

*General practice, not from Anthropic documentation.*

- **Evaluate by slice.** Report accuracy, refusal and escalation rates per language, region, segment and protected group. A good average can hide a failing subgroup.
- **Counterfactual tests.** Change only a name, gender marker, dialect or address. Any change in outcome is a finding.
- **Do not send attributes the decision must not depend on.** Then fairness does not rest on what the model chooses to ignore.
- **Adverse decisions get a human and a contestable reason**, and fairness slices re-run on every model or prompt change ([Pro Chapter 8](/ccar-p/read/pro-notes/08-evaluation-testing-and-optimization)).

Anthropic documents a case of **source-selection bias**: human testers caught early research agents preferring **SEO-optimized content farms** over authoritative sources, which automated evals missed.<sup>[27]</sup> Bias lives in what an agent **retrieves and trusts**, not only in what it writes.

### Transparency and provenance

- **Citations** are **guaranteed to contain valid pointers** to the documents you provided, because the API extracts `cited_text` itself (which does not count toward output tokens). They are ZDR- and HIPAA-eligible but **cannot be combined with structured outputs** (400); for structured decisions use an evidence field per value.<sup>[28]</sup>
- **A valid pointer is not a correct claim.** Keep the quote-check-and-retract step for high-stakes outputs.<sup>[13]</sup>
- **Thinking is a summary, not a trace.** Thinking text is **never the raw chain of thought**, and on Claude 5 models it is hidden by default (`display: "omitted"`).<sup>[29]</sup> Useful for debugging; not the decision record. The record is the inputs, sources, tool calls and cited output.

## Worked design review: a claims-appeal assistant for a health insurer

**The system.** An agent reads appeal letters, medical records (PDF) and email threads, recommends uphold or overturn, updates the claim and emails the member. About 4,000 appeals a night. The data is PHI.

**The flawed design.**

It runs on Claude Platform on AWS "because we are an AWS shop", uses Batch for the nightly run and code execution to total billing spreadsheets, and has `send_email` (any recipient), `update_claim` and `search_records` (all members). The system prompt says "never email anyone but the member on file". Three nurses review every recommendation. The output schema's `enum` values are built from diagnosis descriptions.

**The constraint that decides.** PHI. Under Anthropic's documentation, that means HIPAA readiness with a BAA, and only eligible features. Claude Platform on AWS is not HIPAA-ready. Batch and code execution are not HIPAA-eligible, and a HIPAA organization's API rejects ineligible features with a 400.<sup>[19]</sup>

**The better design.**

- **Platform.** A HIPAA-ready Claude API organization with a BAA (Foundry with a BAA and HIPAA configuration is also eligible). If the company must stay inside AWS, Bedrock under AWS's own compliance terms is a decision to check against AWS's documentation.<sup>[19][22]</sup>
- **Throughput without Batch.** Standard Messages API calls with controlled concurrency and HIPAA-eligible prompt caching; totals computed in your own code.<sup>[19]</sup> Schemas use generic `enum` values (`uphold`, `overturn`, `needs_info`); diagnoses stay in message content.<sup>[19]</sup>
- **Injection.** Letters, records and emails go to Claude in `tool_result` blocks, labeled by source and JSON-encoded. A screen runs on the emails, which are the channel most open to outsiders.<sup>[3]</sup>
- **Capability removal.** `send_email` takes a `claim_id` and resolves the recipient from the claim record in code, so Claude cannot pick an address. `search_records` is scoped to the current member. The outbound path and the cross-member read path are gone, so a successful injection has nowhere to send data.
- **Human gate on the effect, routed by risk.** Upholds (adverse to the member) and overturns above a dollar threshold need a nurse to approve the **status change and the letter**, with cited passages shown. A `PreToolUse` hook returns `defer` for those calls so the queue can wait overnight.<sup>[8]</sup> Small overturns proceed with sampled audits; summaries are not gated.
- **Fairness and audit.** Overturn rates by region and language are tracked monthly. Counterfactual name-swap tests run in CI. Citations give the reviewer the evidence trail.<sup>[28]</sup>

**Why the tempting alternatives lose.**

- *"Keep the prompt rule and add audit logging of every email."* A compensating control. The recipient choice should not exist.
- *"Enable ZDR as well as HIPAA readiness to be safe."* Anthropic says HIPAA readiness is the arrangement for PHI and you do not also need ZDR. It also would not make Batch or code execution eligible.<sup>[19]</sup>
- *"Use a larger model so it follows the email rule reliably."* Wrong knob. The rule belongs in code.
- *"Hire more reviewers for every recommendation."* This treats review fatigue with more people. Gate on effects, and give reviewers evidence.
- *"Drop the medical records to avoid PHI."* A blunt fix that breaks the core requirement.

## How wrong answers are built

- **"Add a system-prompt instruction forbidding the action."** Guidance, not enforcement. For a "never", remove the tool or add a deny rule or hook (family 1 when paired with logging, family 3 when offered as the fix).
- **"Log every tool call so violations can be reviewed."** A compensating control. It records the breach instead of preventing it (family 1).
- **"The sandbox prevents data leakage."** It limits network and filesystem reach. It does not stop the agent putting readable data in its reply, and by default it can read credential files (family 3).
- **"A hook returns `allow`, so the command will run."** Deny and ask rules are still checked (family 3).
- **"Server-managed settings guarantee the policy on every device."** They are a client-side control. Unmanaged devices and third-party provider settings bypass them (family 3).
- **"ZDR covers the batch pipeline."** Batch is not ZDR-eligible, and the API does not block it (family 4: read which feature changed).
- **"Enable ZDR in addition to HIPAA readiness."** Not needed, and it does not change feature eligibility (family 3).
- **"Use one organization with a HIPAA workspace."** HIPAA readiness is per organization and permanent (family 2).
- **"Monitor 5xx rates to catch policy blocks."** Refusals are 200s with `stop_reason: "refusal"` (family 4).
- **"Harden the prompt against leaks."** Anthropic warns this can degrade performance. Leave the secret out and monitor outputs (family 2).
- **"Citations prove the answer is right."** They prove the pointer is valid, not that the passage supports the claim (family 3).
- **"Add fairness instructions to the prompt."** Fairness is shown by slice and counterfactual evaluation, not asserted in the prompt (family 3).

## What to remember

- Model behavior is not a security control. Bound the effect of a successful attack.
- Permission order: hooks → deny → ask → mode → allow → `canUseTool`. Deny wins even in `bypassPermissions` and over a hook `allow`. Among hooks: deny > defer > ask > allow.
- Untrusted content goes in `tool_result`, labeled and JSON-encoded. Your own instructions go in a user turn, not in tool results.
- The Claude Code sandbox covers shell commands only. Its default reads include `~/.ssh`. Its domain allowlist starts empty.
- Server-managed settings are policy, not a boundary. MDM-delivered endpoint settings are stronger.
- Streaming refusals: HTTP 200, `stop_reason: "refusal"`, reset or fall back, never just resend.
- Gate the action, not the text. `defer` for long approvals. `ask` rules reach `canUseTool` even in bypass mode.
- ZDR: per organization, does not block ineligible features (Batch, Files, code execution, MCP connector, Skills, Managed Agents).
- HIPAA readiness: BAA, per organization, permanent, blocks ineligible features with a 400, no PHI in schemas, not on Claude Code or Claude Platform on AWS.
- CMEK needs Standard (30-day) retention. US-only inference is 1.1x. Bedrock regional endpoints are +10%.
- On Bedrock and Google-managed Google Cloud, the cloud provider is the data processor. Citations guarantee valid pointers, not correct claims.

## Endnotes for this chapter

1. Model behavior is not a security control. The risk-to-control table, unexpected steps, offline review, the limits of sandbox settings (reply leakage, key permissions) and where each part runs. Anthropic, "Security risks and sandbox boundaries" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/managed-agents/secure-deployment-risks
2. Defense in depth, least privilege, isolation technologies, cloud egress through a proxy, and the credential-injecting proxy pattern. Anthropic, "Securely deploying AI agents" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/agent-sdk/secure-deployment
3. The two threat models, harmlessness screens with a lightweight model and structured outputs, refusal-as-harmful verdicts, putting untrusted content in tool results with provenance and JSON encoding, keeping your own instructions out of tool results, least privilege, tool-output screening, red-teaming and repeat-offender handling. Anthropic, "Mitigate jailbreaks and prompt injections" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks
4. A separate model instance screening queries tends to work better than one call handling both guardrails and the response. Anthropic, "Building effective agents" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/engineering/building-effective-agents
5. The permission evaluation order, deny rules winning over hook `allow` and `bypassPermissions`, and ask rules reaching `canUseTool` in bypass mode. Anthropic, "Configure permissions" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/agent-sdk/permissions
6. The sandbox covers shell commands only, its default read and write scope, the empty starting domain allowlist, and that file tools, MCP servers and hooks run outside it. Anthropic, "Configure the sandboxed Bash tool" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/sandboxing
7. Use leak-resistant prompting only when necessary, monitor first, post-process outputs, and leave out unneeded proprietary details. Anthropic, "Reduce prompt leak" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-prompt-leak
8. Hook uses including human approval, `permissionDecision` values including `defer`, decision priority among hooks, `updatedInput` and `updatedToolOutput`. Anthropic, "Intercept and control agent behavior with hooks" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/agent-sdk/hooks
9. Server-managed versus endpoint-managed settings, fail-closed startup, and the security considerations table, including bypass on unmanaged devices and with third-party providers. Anthropic, "Configure server-managed settings" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/server-managed-settings
10. Refusal stop reason and `stop_details`, context reset, fallback to another model, refusals as HTTP 200 and as succeeded batch results, and nullable category fields. Anthropic, "Handle streaming refusals" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/handle-streaming-refusals
11. Skill risk tiers, the review checklist, combined file-read and network risk, and the scope of skill scanning. Anthropic, "Skills for enterprise" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/agents-and-tools/agent-skills/enterprise
12. Confused deputy, the ban on token passthrough, local MCP server consent and sandboxing, and scope minimization. Model Context Protocol, "Security Best Practices" (MCP docs, accessed 2026-11-02), https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices
13. Allowing uncertainty, quote-first grounding for long documents, citation verification with retraction, best-of-N, restriction to provided documents, and that these reduce but do not eliminate hallucinations. Anthropic, "Reduce hallucinations" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
14. Client tool calls are executed by your application, and errors are returned with `is_error`. Anthropic, "Handle tool calls" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls
15. `canUseTool` approval responses, indefinite pending and `defer`, custom tools for external approval systems, and `AskUserQuestion` limits. Anthropic, "Handle approvals and user input" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/agent-sdk/user-input
16. Reviewer fatigue is listed as a limitation of manual review. Anthropic, "Demystifying evals for AI agents" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/research/demystifying-evals-for-ai-agents
17. Permission modes, including auto mode with a classifier for reducing prompt fatigue. Anthropic, "Choose a permission mode" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/permission-modes
18. Claude Code's built-in protections, including prompt-fatigue mitigation through allowlisting, and its prompt-injection safeguards. Anthropic, "Security" (Claude Code Docs, accessed 2026-11-02), https://code.claude.com/docs/en/security
19. ZDR scope and exclusions, HIPAA readiness scope and enforcement, PHI in schemas, Covered Models, feature eligibility, retention regardless of arrangement, and which party is the data processor on each platform. Anthropic, "API and data retention" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/manage-claude/api-and-data-retention
20. CMEK requires Standard retention and cannot share a Claude Platform workspace with ZDR. Anthropic, "CMEK, data retention, and ZDR" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/manage-claude/cmek-data-retention
21. Inference geo and workspace geo, workspace restrictions, model support, 1.1x pricing, and the Foundry US Data Zone equivalence. Anthropic, "Data residency" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/manage-claude/data-residency
22. Zero operator access, regional endpoints with a 10% premium, unsupported features including the Compliance API, data handling governed by Bedrock, and CloudTrail logging. Anthropic, "Claude in Amazon Bedrock (Opus 4.7 and later)" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/claude-in-amazon-bedrock
23. Hosting options, prompts staying in Azure for Azure-hosted deployments, and unsupported features. Anthropic, "Claude in Microsoft Foundry" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/claude-in-microsoft-foundry
24. The two Google Cloud offerings and how they differ. Anthropic, "Claude Models on Google Cloud" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/claude-models-on-google-cloud/overview
25. Compliance API scope, key types, and comparison with audit log export, analytics APIs, OpenTelemetry and inference hooks. Anthropic, "Compliance API" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/manage-claude/compliance-api
26. Workspaces separate projects, environments and teams, and prompt caches are isolated by workspace. Anthropic, "Workspaces" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/manage-claude/workspaces
27. Human testers caught a bias toward SEO content farms that automated evaluation missed. Anthropic, "How we built our multi-agent research system" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/research/multi-agent-research-system
28. Citations guarantee valid pointers, `cited_text` token handling, incompatibility with structured outputs, and data-handling eligibility. Anthropic, "Citations" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/citations
29. Thinking text is a summary, never the raw chain of thought, and display defaults. Anthropic, "Thinking" (Claude Docs, accessed 2026-11-02), https://platform.claude.com/docs/en/build-with-claude/thinking
