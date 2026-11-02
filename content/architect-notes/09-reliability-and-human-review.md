# Chapter 9: Reliability and Human Review

**Summary**: *A reliable system does not assume every answer is right. It places critical facts where the model will use them, makes uncertainty and failure visible in its outputs, keeps track of where each fact came from, and sends the cases most likely to be wrong to a person. Human review should be targeted by risk signals, not spread evenly at random.*

## Where a fact sits in the prompt changes whether it is used

Long contexts have a recall problem. A fact buried deep inside a very long input is easier to miss, and recall falls as context grows (Chapter 4).<sup>[1]</sup> The usual name for the failure is "lost in the middle". The documented fixes are about where you put things and how you mark them. Anthropic's prompting guide gives concrete placement advice for long inputs.<sup>[2]</sup>

- **Put long documents at the top**, above the instructions, examples and question. **Put the question at the end.** Anthropic reports that queries at the end improved response quality by up to 30% in tests, especially with complex, multi-document inputs.
- **Wrap each document in tags** with its metadata, for example `<document>` holding `<source>` and `<document_content>`.
- **Ask for relevant quotes first.** For long-document tasks, have Claude extract the passages that matter before answering, so it works from the relevant text instead of the whole input.

For agents, the same idea means **restating key facts near the point of use**. A rule from turn 3 is easy to lose by turn 60. Put persistent rules in CLAUDE.md or the system prompt, which are re-sent on every request, rather than in a message that compaction may summarize. Keep a short "case facts" block that the harness updates and re-sends, instead of relying on the model to dig the facts out of history.

## Ambiguity and policy gaps should stop the agent, not be guessed through

An agent that meets a case its instructions do not cover has two options: guess, or escalate. Anthropic's description of agents includes **pausing for human feedback at checkpoints or when it hits a blocker**.<sup>[3]</sup> In customer support, Anthropic's evaluation guidance tracks **escalation accuracy**, meaning the share of conversations that needed a human and actually got one, with a suggested target of 95% or higher.<sup>[4]</sup>

Make escalation a first-class action.

- **Give the agent an escalation tool** with a structured reason: `policy_gap`, `ambiguous_request`, `conflicting_sources`, `out_of_scope`, `customer_request`.
- **State explicit triggers** in the prompt: amounts above a limit, requests the policy does not mention, conflicting customer statements.
- **Enforce the hard limits in code.** A refund above the limit should be blocked by a hook or by the tool itself, not left to the prompt (Chapter 5).
- **Ask, do not assume**, when a request has two reasonable readings and acting on the wrong one would be costly.

Anthropic's hallucination guidance adds that you should **explicitly allow Claude to say "I don't know"**. Giving that permission can sharply reduce false information.<sup>[5]</sup>

## Errors and partial results should travel as data

In a multi-step or multi-agent system, one failure should not erase the work that succeeded, and it should not be hidden either.

- Anthropic's research system **resumes from the point of failure** and **tells the agent when a tool fails** so it can adapt.<sup>[6]</sup>
- MCP reports tool execution failures as results with `isError: true` so the model can respond to them (Chapter 7).<sup>[7]</sup>
- The SDK returns **partial output** when a subagent reaches `maxTurns`, and labels each run's outcome with a result subtype such as `error_max_turns` or `error_during_execution`.<sup>[8][9]</sup>

A subagent's return value should therefore carry **status alongside content**: what was completed, what failed and why, what was not attempted, and whether a retry makes sense. A coordinator that gets "searched 14 of 20 sources; 6 timed out (retryable)" can retry or report a coverage gap. A coordinator that gets only a confident summary of 14 sources will present it as complete.

The common bad patterns are **swallowing errors** (returning an empty list, which looks like "no results"), **failing the whole job** on one item, and **flattening uncertainty** when results are merged. If a subagent reported "probably 2019, source unclear," the coordinator's summary must not turn that into "2019."

## Route to human review by risk, not at random

Random sampling (say, review 5% of outputs) is useful for **auditing** overall quality. It is a poor way to **catch errors**, because it spends most reviewer time on easy cases and misses most of the risky ones. Targeted routing sends a case to a person when there is a concrete reason to doubt it.

| Signal | Example | Source of the signal |
|---|---|---|
| **Field-level validation failure** | Totals do not match line items. A date is outside the contract period | Code checks after extraction (Chapter 8) |
| **Missing or "unclear" fields** | `due_date: null`, `category: "other"` | Schema designed to express absence |
| **Unsupported claims** | A claim with no supporting quote | Quote verification. Anthropic suggests having Claude find a supporting quote for each claim and **retract** any it cannot support<sup>[5]</sup> |
| **Inconsistency across runs** | Two runs on the same input disagree | **Best-of-N** comparison. Anthropic notes that inconsistent outputs can indicate hallucination<sup>[5]</sup> |
| **Document type or stakes** | Contracts above a value, medical or legal content, a new vendor | Business rules by document or field type |
| **Model-reported confidence** | A low self-rated score | Useful only after checking it against labeled data |

### Calibrate before trusting a confidence number

A confidence field in a schema is easy to add. Structured-output examples routinely include one.<sup>[10]</sup> But a number the model writes is a **prediction**, not a measurement. Before using it to skip review, check it against **labeled cases**. Do outputs rated 0.9 really turn out correct about 90% of the time on your data? Set the review threshold from that evidence, and recheck it whenever the prompt, model or input mix changes.

Anthropic's ticket-routing guide shows the kind of evaluation set that supports this. It suggests measuring accuracy on a **dedicated set of edge cases** (aiming for at least 80%), **classification consistency** on standard inputs over time (95% or higher), and accuracy across languages.<sup>[11]</sup> The evaluation guide's general advice applies: define specific, measurable criteria, mirror the real task distribution, and include edge cases.<sup>[12]</sup>

Anthropic's research team also found that **human testers catch what automated evaluations miss**. In one case, people noticed that early agents favored SEO-heavy content farms over authoritative sources, and **source-quality heuristics** in the prompt fixed it.<sup>[6]</sup>

## Provenance, conflicts, dates and content types must be tracked

When an answer combines several sources, keep the link from each claim back to its source.

- **Citations.** The Claude API's citations feature returns cited passages that are **guaranteed to point to the provided documents**. Plain-text citations use character ranges, PDFs use page ranges, and custom content uses block indexes.<sup>[13]</sup> Citations cannot be combined with structured outputs on the same request, so for structured extraction, include an evidence field for each value.<sup>[14]</sup>
- **Conflicts.** When two sources disagree, **record both** with their sources and dates and mark the conflict. Do not silently pick one. Let a rule (newest effective date, most authoritative source) or a person decide, and log which rule was applied.
- **Dates.** Store **when** each fact was true (effective date, publication date, retrieval date). "The policy limit is $500" is incomplete without "as of the March revision."
- **Content types.** Keep track of what kind of source each fact came from, such as signed contract, email, forum post or model inference, and weight them accordingly. The research team's source-quality fix is an example.<sup>[6]</sup>
- **Restrict to provided sources** when grounding matters. Tell Claude to use only the supplied documents, not its general knowledge.<sup>[5]</sup>

## Worked example: a contract-terms extractor

A legal operations team extracts renewal terms from 3,000 vendor contracts. Their current design reviews a random 5% sample. Errors keep reaching production. They are concentrated in amended contracts, where the amendment overrides the original.

- **Placement.** Put the contract and its amendments at the top in separate `<document>` tags with `<source>` and an effective date. Put the extraction instructions and question at the end, and ask for supporting quotes first.
- **Schema.** Each term gets `value`, `source_document`, `effective_date` and a quoted `evidence` field. `value` is nullable, and a `conflict` flag is set when the original and amendment disagree.
- **Routing.** Send to review any contract where a conflict flag is set, a required term is null, the quote check fails, two runs disagree, or the contract value is above a threshold. Keep a small random sample only to **audit** the auto-approved group.
- **Calibration.** Label 200 contracts, including amendments. Measure accuracy at each confidence level before letting any confidence threshold skip review.

## How wrong answers are built

- **"Increase the random sample to 20%."** That is more cost for the same blind spot. Route by risk signals.
- **"Trust the model's confidence score."** Calibrate it against labeled data first.
- **"Put the instructions first and the documents after."** For long inputs, documents go at the top and the question at the end.
- **"Have the agent pick the most likely policy reading."** A policy gap should be escalated with a structured reason.
- **"Return an empty list when the source times out."** That hides the failure. Return status, partial results and whether to retry.
- **"Keep the newest source and drop the other."** Record both, flag the conflict, and apply an explicit rule.
- **"Add citations and structured outputs together."** That returns a 400. Use evidence fields in the schema.

## What to remember

- Long documents go at the top, the query at the end. Tag documents with metadata. Extract quotes first.
- Escalate policy gaps and ambiguity with a structured reason. Enforce hard limits in code. Allow "I don't know."
- Carry status, partial results and retry hints with every subagent result. Do not flatten uncertainty.
- Route review by validation failures, missing fields, unsupported claims, run-to-run disagreement and stakes.
- Random sampling audits quality. It does not catch most errors.
- Calibrate confidence against labeled edge cases before using it as a threshold.
- Track source, date, content type and conflicts for every extracted fact.

## Endnotes for this chapter

1. Context rot reduces recall as tokens accumulate, so context should be treated as a finite resource. Anthropic, "Effective context engineering for AI agents" (Anthropic Engineering, accessed 2026-11-01), https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
2. Long documents belong at the top of the prompt with the query at the end, which improved quality by up to 30% in tests; documents should be tagged with metadata and quotes extracted first. Anthropic, "Prompting best practices" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
3. Agents can pause for human feedback at checkpoints or when they reach a blocker. Anthropic, "Building effective agents" (Anthropic Engineering, accessed 2026-11-01), https://www.anthropic.com/engineering/building-effective-agents
4. Support-agent evaluation tracks escalation accuracy, with a suggested target of 95% or higher. Anthropic, "Customer support agent" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/about-claude/use-case-guides/customer-support-chat
5. Hallucinations drop when Claude may say it does not know, grounds answers in quotes, retracts claims it cannot support, is compared across several runs, and is limited to provided documents. Anthropic, "Reduce hallucinations" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
6. The research system resumes from failures, informs agents of tool errors, and relied on human testers who found a bias toward low-quality sources that prompt heuristics fixed. Anthropic, "How we built our multi-agent research system" (Anthropic Engineering, accessed 2026-11-01), https://www.anthropic.com/research/multi-agent-research-system
7. MCP tool execution errors are returned in the result with `isError` so the model can respond. Anthropic, "Tools" (MCP Specification, accessed 2026-11-01), https://modelcontextprotocol.io/specification/2026-07-28/server/tools
8. A subagent that reaches `maxTurns` returns its partial output. Anthropic, "Subagents in the SDK" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/agent-sdk/subagents
9. Agent runs end with result subtypes such as success, `error_max_turns` and `error_during_execution`. Anthropic, "How the agent loop works" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/agent-sdk/agent-loop
10. The structured-outputs examples include a numeric confidence field in an extraction schema. Anthropic, "Structured outputs" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/build-with-claude/structured-outputs
11. The ticket-routing guide suggests measuring edge-case accuracy, classification consistency and multilingual accuracy against set targets. Anthropic, "Ticket routing" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/about-claude/use-case-guides/ticket-routing
12. Evaluations should use specific, measurable criteria, mirror the real task distribution and include edge cases. Anthropic, "Define success criteria and build evaluations" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/test-and-evaluate/develop-tests
13. Citations are guaranteed to point to provided documents and use character, page or block ranges by document type. Anthropic, "Citations" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/build-with-claude/citations
14. Structured outputs return a 400 when combined with citations. Anthropic, "Structured outputs" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/build-with-claude/structured-outputs
