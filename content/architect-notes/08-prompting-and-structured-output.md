# Chapter 8: Prompting and Structured Output

**Summary**: *Reliable output comes from three layers. The prompt states exactly what good looks like, with criteria and examples. A schema guarantees the output's shape. Validation in code checks what a schema cannot: whether the values are actually true. Each layer catches a different failure, and the exam often asks which layer a given failure belongs to.*

## Explicit criteria beat adjectives

Anthropic's prompting guide suggests treating Claude like a **brilliant but new employee** who does not know your norms. The more precisely you explain what you want, the better the result.<sup>[1]</sup> Explaining **why** a rule exists also helps, because Claude can then apply it sensibly to cases the rule did not list.<sup>[1]</sup>

For judgment tasks such as review, grading or classification, this means **replacing adjectives with criteria**.

| Vague | Explicit |
|---|---|
| "Flag important issues" | "Flag issues that cause incorrect results, data loss or security exposure. Do not flag naming or formatting" |
| "Rate the answer's quality" | "Score 1–5 on factual accuracy against the provided source. A 5 has no unsupported claims" |
| "Be conservative" | "Report a finding only if you can quote the line that causes it" |

The evaluation guide asks for the same thing in success criteria: **specific** ("accurate sentiment classification", not "good performance") and **measurable**.<sup>[2]</sup> Explicit **inclusion and exclusion** lists are also the most direct fix for false positives. A reviewer that reports style issues has usually not been told that style is out of scope.

## Few-shot examples teach judgment that rules cannot

The prompting guide calls examples **one of the most reliable ways to steer format, tone and structure**. It recommends **3 to 5** examples that are:<sup>[1]</sup>

- **Relevant** to the real task.
- **Diverse**, covering edge cases and varied enough that Claude does not copy an accidental pattern, such as every example having exactly two findings.
- **Clearly marked**, wrapped in `<example>` tags (inside `<examples>`) so they are not mistaken for instructions.

Examples are strongest where rules are fuzzy. "Is this ticket a billing problem or an account problem?" is easier to teach with three borderline tickets and their labels than with a paragraph of definitions. The context-engineering article makes the same point. Rather than a long list of edge-case rules, curate a set of diverse, canonical examples.<sup>[3]</sup> For consistency across runs, Anthropic also notes that examples of the desired output work better than abstract instructions.<sup>[4]</sup>

With extended thinking, worked examples also shape how Claude reasons. Show each one as problem, method and answer.<sup>[1]</sup>

## Schemas guarantee shape, so choose the right mechanism

There are four ways to get structured output. They differ in how much they guarantee.

| Method | Guarantee | Notes |
|---|---|---|
| **Instructions only** ("respond in JSON") | None | Newer models follow complex formats well when asked, but nothing enforces it<sup>[1]</sup> |
| **Structured outputs** (`output_config.format` with a JSON schema) | The response **parses and matches the schema** | Uses constrained decoding. Best for a final structured answer<sup>[5]</sup> |
| **Strict tool use** (`strict: true` on a tool) | Tool **inputs** match the schema | Best when the structure is an action or the extraction is a "tool call"<sup>[6]</sup> |
| **Prefilling the assistant turn** | Was a format nudge | **Returns a 400 on Claude 4.6 models and later**, and on Mythos Preview<sup>[1]</sup> |

The prefill row deserves attention. Some older guidance shows prefilling the assistant turn (for example with `{`) to force JSON.<sup>[4]</sup> Anthropic's current prompting guide says that starting with the Claude 4.6 models, **prefilled responses on the last assistant turn are no longer supported** and return a 400. Its migration advice for formatting is to use **structured outputs**, or simply to ask for the format, since newer models follow schemas reliably when told to.<sup>[1]</sup>

### Tool use plus `tool_choice` makes extraction a forced call

The classic extraction pattern defines one tool whose `input_schema` **is** the record you want, such as `record_invoice`. You then make sure Claude calls it.

- On models that support forcing, `tool_choice: {"type": "tool", "name": "record_invoice"}` guarantees the call, and adding `strict: true` guarantees the input matches the schema.<sup>[7]</sup>
- On **Opus 5.5, Sonnet 5.5, Fable 5.1 and Mythos 5.1**, forced choice returns a 400. Use `tool_choice: auto` with `strict: true` and a clear instruction, or use **structured outputs** if no action is involved.<sup>[7]</sup>

Strict tool use and structured outputs **work together**. Strict tools make each action's parameters valid, and structured outputs make the final answer valid.<sup>[5]</sup> Changing `output_config.format` invalidates the prompt cache for that conversation. The first request with a new schema has extra latency while its grammar compiles, and compiled grammars are cached for 24 hours.<sup>[5]</sup>

## Extraction schemas must allow "not found"

A schema that **requires** every field forces the model to fill every field, even when the document does not contain the value. That is how a schema causes **fabrication**. Design the schema so that absence can be expressed.<sup>[5][8]</sup>

- **Optional or nullable fields** for values that may be missing. A `null` for "no due date stated" is honest. A guessed date is not.
- **Enums** for closed categories, so free-text drift ("Billing", "billing issue", "payments") cannot happen. Add an **`"other"`** value with a companion `other_detail` string, so new cases are recorded rather than forced into the wrong bucket.
- **An `"unclear"` or `"not_stated"` value** where a person needs to see that the source was ambiguous, not empty.
- **Separate fields for the value and its evidence**, such as the quoted source text, so a reviewer can check it.

The SDK structured-output guide says the same: if the task might not have all the information the schema asks for, **make those fields optional**.<sup>[8]</sup>

Know the schema limits too. Enums can hold only strings, numbers, booleans or null, not complex types. Required properties come first in the output, then optional ones.<sup>[5]</sup> A field that asks for the model's step-by-step reasoning can trigger a `reasoning_extraction` refusal, so ask for a short **explanation** instead.<sup>[5]</sup> Structured outputs **cannot be combined with citations** on the same request. That returns a 400.<sup>[5]</sup>

## A valid schema is not a correct answer

Constrained decoding guarantees **syntax**: valid JSON, the right types, required fields present. It does not guarantee **semantics**: that the total equals the sum of the line items, that a date falls in the right range, or that a cited clause exists. Those checks belong in your code.

The loop is **validate, then retry with specific feedback**.

1. Validate the parsed object against business rules.
2. If a rule fails, send the specific error back, for example: "line_items sum to 1,240.00 but total is 1,420.00. Re-read the totals section and correct whichever value is wrong."
3. Cap the retries. After the cap, route the record to human review rather than looping.

The Agent SDK applies the same idea to schema failures. When the agent's structured output does not match the schema, the SDK returns an error result and the agent tries again. If it still cannot produce valid output, the run ends with `error_max_structured_output_retries`.<sup>[8]</sup> Generic feedback such as "that was wrong, try again" gives Claude nothing to fix. Retrying without feedback mostly repeats the error.

Also handle the stop reasons. A **`refusal`** can produce output that does not match the schema, because the refusal takes precedence. A **`max_tokens`** stop truncates the JSON.<sup>[5]</sup>

## Truncation is usually a sign the job is too big for one call

When a long structured output is cut off, the structured-outputs page says to retry with a higher `max_tokens`.<sup>[5]</sup> That works for an occasional overrun. But if a request routinely produces hundreds of records, a larger cap only moves the limit. The more robust design **splits the work**: extract per section or per page, or process items in chunks, then merge in code. Smaller requests also fail independently, so one bad chunk does not cost the whole job, and they suit batch processing.

## Batch processing fits work that can wait

The **Message Batches API** processes many Messages requests **asynchronously at 50% of standard prices**.<sup>[9]</sup>

| Property | Value |
|---|---|
| Size limit | 100,000 requests or 256 MB per batch, whichever comes first |
| Completion | Most within 1 hour. Requests not finished within **24 hours expire** |
| Results | Available for **29 days** after creation |
| Ordering | Results **may not match input order**. Match them by **`custom_id`** |
| Result types | `succeeded`, `errored`, `canceled`, `expired` |

Use batches for **large evaluations, nightly extraction and bulk classification**, anything where nobody is waiting on the answer.<sup>[9]</sup> Do not use them for interactive requests, or for agent loops where each step depends on the last tool result. A batch has no conversation in which to return tool results mid-request. Plan for **partial failure**: retry only the `errored` and `expired` requests, identified by `custom_id`.<sup>[9]</sup> Prompt caching works with batches on a best-effort basis.<sup>[9]</sup>

## Generator and reviewer should be separate passes

A model reviewing its own output in the same context tends to agree with itself. Anthropic's evaluator-optimizer pattern uses **one call to generate and another to evaluate**. It works best when there are **clear evaluation criteria** and feedback measurably improves the result.<sup>[10]</sup> The same reasoning drives Claude Code's advice to review in a fresh subagent or second session (Chapter 6). The independent reviewer should receive:

- The **artifact** and the **criteria or spec**, not the generator's reasoning.
- An explicit **output format** for findings.
- Permission to say "no issues found," so it does not invent problems to fill space.

## Worked example: invoice extraction that invents due dates

A pipeline extracts invoices with a tool whose schema requires `due_date`, `vendor`, `total` and `category` (free text). It sends 20,000 invoices one at a time overnight. Problems: about 8% of records show plausible but wrong due dates, categories come in 40 spellings, totals sometimes disagree with line items, and long invoices get truncated.

| Problem | Layer | Fix |
|---|---|---|
| Invented due dates | Schema | Make `due_date` nullable. Add `due_date_evidence` for the quoted text |
| 40 category spellings | Schema | An enum plus `"other"` and `other_detail` |
| Totals do not add up | Validation | Check in code. Retry with the specific mismatch, then send to human review |
| Truncated long invoices | Task design | Extract line items per page and merge in code |
| Slow and expensive | Workload | Message Batches at 50% cost, matched by `custom_id` |
| Inconsistent edge cases | Prompt | 3 to 5 diverse examples, including one with no due date |

## How wrong answers are built

- **"Make every field required so nothing is missed."** That forces fabrication. Allow null or "not stated".
- **"Prefill `{` to force JSON."** Current models return a 400. Use structured outputs.
- **"Structured outputs guarantee correct data."** They guarantee shape. Validate the values.
- **"Retry with 'try again'."** Send the specific validation error.
- **"Raise `max_tokens`" for routinely huge outputs.** Split the task.
- **"Use batches for the chat assistant."** Batches are asynchronous with up to 24 hours of latency.
- **"Assume batch results are in input order."** Match by `custom_id`.
- **"Ask the generator to double-check itself."** Use a separate reviewer pass with criteria.
- **"Ask for step-by-step reasoning in a schema field."** It risks a refusal. Ask for a short explanation.

## What to remember

- State explicit, measurable criteria, with inclusion and exclusion lists. Explain why.
- Use 3 to 5 relevant, diverse examples in `<example>` tags.
- Structured outputs constrain the response. Strict tools constrain tool inputs. Prefill is gone on 4.6 and later.
- Forced `tool_choice` works only on supporting models. Otherwise use `auto` plus `strict`, or structured outputs.
- Nullable fields, enums with "other", and evidence fields prevent fabrication.
- Schemas guarantee syntax, not truth. Validate in code and retry with specific feedback, with a cap.
- Batches: 50% cost, 24-hour window, 29-day results, match by `custom_id`.
- Generate and review in separate passes.

## Endnotes for this chapter

1. The prompting guide recommends clear, explicit instructions with context, 3 to 5 diverse examples in tags, and worked examples with thinking, and says prefilled final assistant turns return a 400 from Claude 4.6 models onward. Anthropic, "Prompting best practices" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
2. Good success criteria are specific and measurable. Anthropic, "Define success criteria and build evaluations" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/test-and-evaluate/develop-tests
3. Anthropic recommends a curated set of diverse, canonical examples over a long list of edge-case rules. Anthropic, "Effective context engineering for AI agents" (Anthropic Engineering, accessed 2026-11-01), https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
4. The consistency guide recommends precise output formats and examples, and still describes prefilling as a technique. Anthropic, "Increase output consistency" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/increase-consistency
5. Structured outputs use constrained decoding to guarantee schema-valid responses, have schema limits and ordering rules, cannot be combined with citations, and can still be cut off by refusals or `max_tokens`. Anthropic, "Structured outputs" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/build-with-claude/structured-outputs
6. Setting `strict: true` constrains tool inputs to the schema so types and required fields are always correct. Anthropic, "Strict tool use" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use
7. Forced `tool_choice` guarantees a call on supporting models, while the newest models reject it and should use `auto` with strict tools or structured outputs. Anthropic, "Define tools" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools
8. The SDK retries structured output after schema errors, ends with a dedicated subtype when retries run out, and advises optional fields when information may be missing. Anthropic, "Get structured output from agents" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/agent-sdk/structured-outputs
9. Message Batches cost half the standard price, have size, expiry and retention limits, return results in any order keyed by `custom_id`, and report four result types. Anthropic, "Batch processing" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/build-with-claude/batch-processing
10. The evaluator-optimizer pattern pairs a generating call with an evaluating call and works best with clear evaluation criteria. Anthropic, "Building effective agents" (Anthropic Engineering, accessed 2026-11-01), https://www.anthropic.com/engineering/building-effective-agents
