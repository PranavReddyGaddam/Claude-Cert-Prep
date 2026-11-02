# Chapter 1: The Agent Loop

**Summary**: *An agent is a loop that your code drives: send a request, read `stop_reason`, run whatever tools Claude asked for, and send the results back. Most exam items in this area test the details of that loop, such as how several tool calls in one turn must be answered, how `tool_choice` forces a call, and how to stop a dependent tool from running before its prerequisite.*

## The stop reason decides what your code does next

Claude never runs a client tool itself. It returns a `tool_use` block with an `id`, a `name` and an `input` object, and your application runs the operation and reports back.<sup>[1]</sup> The signal that a tool is waiting is **`stop_reason: "tool_use"`**. A basic loop keeps going while that is the stop reason, and exits on any other value.<sup>[2]</sup>

| `stop_reason` | What it means | What the loop should do |
|---|---|---|
| `tool_use` | One or more tool calls are waiting | Run them and send every result back |
| `end_turn` | Claude finished its answer | Exit and use the response |
| `max_tokens` | The output hit your token cap | If a `tool_use` block was cut off, retry with a higher cap. Otherwise decide whether to continue |
| `pause_turn` | A server tool loop reached its iteration limit | Send the conversation back unchanged so Claude can continue |
| `refusal` | Claude declined | Handle it as a normal HTTP 200 response, not an exception |
| `model_context_window_exceeded` | The context window filled up | Reduce context before continuing |

Two details from the stop-reasons guide are worth knowing. A response can end with **`end_turn` and no text** when you put text blocks after tool results in the user message. And a **`max_tokens` stop that cuts through a `tool_use` block** leaves an incomplete call, so the fix is to retry with a higher `max_tokens`.<sup>[3]</sup> Server-executed tools behave differently from your own tools. They loop on Anthropic's side and return `pause_turn` when they hit the iteration cap (10 by default), and you resend to let them continue.<sup>[2]</sup>

## A tool result has strict placement rules

A `tool_result` block carries the `tool_use_id` it answers, optional `content`, and an optional **`is_error`** flag. The results must sit in the user message that **immediately follows** the assistant turn that made the calls. They come **first** in that message's content, before any text, with no other messages in between.<sup>[4]</sup>

When a tool fails, the content of the error result should help Claude recover. Say what went wrong and what to do next, for example that a rate limit was hit and when to retry. A bare error code gives Claude nothing to act on.<sup>[4]</sup> If Claude sends a call with missing or invalid parameters, it usually retries two or three times after an error result. Setting **`strict: true`** on the tool definition removes invalid calls altogether, because the inputs are then constrained to the schema.<sup>[4]</sup>

## Several calls in one turn must be answered in one message

Recent Claude models make **parallel tool calls** by default. A single assistant turn with `stop_reason: "tool_use"` can hold several `tool_use` blocks.<sup>[5]</sup> The API does not say what order to run them in. That choice belongs to your code.

- Run **independent, read-only** calls concurrently. Two lookups of unrelated records are a good example.
- Run calls with **side effects or ordering needs** one after another.<sup>[5]</sup>

The rule that catches people is about the reply. Every `tool_use` block needs a matching `tool_result`, matched by `tool_use_id`, and **all of them go in one user message**. Splitting the results across several user messages is not just untidy. The parallel-tool-use guide says it teaches Claude to stop making parallel calls in later turns.<sup>[5]</sup>

If you choose not to run one of the calls, you still owe it a result. Send a `tool_result` for it with `is_error: true` and a short explanation, so the turn is complete.<sup>[5]</sup>

### Turning parallel calls off is a `tool_choice` setting

Some workloads need strictly one call at a time. The switch is **`disable_parallel_tool_use: true`**, and it lives **inside the `tool_choice` object**, not as a top-level request field. With `tool_choice` set to `auto` it means *at most one* call. With `any` or `tool` it means *exactly one*.<sup>[5]</sup>

You can also push the other way. A system prompt instruction can raise parallel calling to nearly every opportunity. The prompting guide notes that Claude Fable 5.1 may make fewer parallel calls in long agent loops, and recommends repeating the instruction as a turn-scoped system message after each round of results.<sup>[6]</sup>

## `tool_choice` controls whether a tool must be called

`tool_choice` has four settings.<sup>[7]</sup>

| Setting | Behavior |
|---|---|
| `auto` | Claude decides whether to call a tool. This is the default when tools are present |
| `any` | Claude must call some tool, and picks which one |
| `tool` | Claude must call the named tool |
| `none` | Claude may not call tools. This is the default when no tools are sent |

With `any` or `tool`, the API pre-fills the assistant turn so that it starts with a tool call. Claude therefore writes **no explanatory text before the call**, and extended thinking does not run for that turn. Changing `tool_choice` between requests also invalidates cached message blocks.<sup>[7]</sup> On models that support forcing, combining `any` with strict tool use guarantees a call whose input matches the schema.<sup>[7]</sup>

### The newest models reject forced tool choice

This detail matters for current designs. The define-tools page says **Claude Opus 5.5, Sonnet 5.5, Fable 5.1 and Mythos 5.1 return a 400 error** for `tool_choice` of `any` or `tool`. The documented alternative is `auto` with **strict tool use**, or **structured outputs** when what you want is a schema-valid response rather than an action. Clear instructions still steer which tool Claude picks under `auto`.<sup>[7]</sup> Forced choice is also rejected when manual extended thinking is enabled with `thinking: {type: "enabled"}`.<sup>[7]</sup>

So an exam answer of "force the tool with `tool_choice`" is correct only for a model that supports it. Read the scenario for the model and for whether thinking is on.

## Prerequisites belong in code, not in hope

**Sequencing** questions follow a pattern. One tool needs data that another tool produces, such as `issue_refund` needing a verified order from `lookup_order`. A prompt line that says "always look up the order first" makes the right order likely but not certain.

There are three stronger approaches, from lightest to heaviest.

1. **Let the error teach.** If Claude calls the dependent tool too early in a parallel batch, return an `is_error` result that says the prerequisite has not run. Claude reissues the call in the next turn, after the prerequisite result is in.<sup>[5]</sup>
2. **Make the dependency visible in the schema.** If `issue_refund` requires an `order_verification_id` that only `lookup_order` returns, the dependent call cannot be well formed until the lookup has happened.
3. **Enforce it outside the model.** In the Agent SDK and Claude Code, a `PreToolUse` hook can deny a tool call until a condition holds, whatever the model decides (Chapter 5 covers hooks).

When the very first step must be a particular tool on a model that supports forcing, `tool_choice: {"type": "tool", "name": ...}` guarantees it. Forcing is a per-request setting, though. It does not sequence a multi-step chain by itself.

## Worked example: a claims assistant that double-pays

A claims assistant has three tools: `get_policy`, `get_claim_history` and `pay_claim`. In logs, Claude sometimes emits all three in one turn. The harness runs them in order and sends each result back in its own user message. Two things go wrong. Claude stops batching the read-only lookups in later turns. And occasionally `pay_claim` runs before the history check finishes, so a duplicate claim gets paid.

Here is the diagnosis, step by step.

- **The separate messages are the cause of lost parallelism.** All results for one assistant turn belong in one user message.<sup>[5]</sup>
- **`pay_claim` has side effects, so the harness should not run it at the same time as the checks.** Run the two reads concurrently. Hold the write.
- **The duplicate payment is a missing prerequisite.** Return `pay_claim` as `is_error: true` with a message like "Claim history not yet checked. Call get_claim_history first." Then enforce the same rule with a pre-execution check that blocks payment until a history result exists for that claim.
- **Disabling parallel calls is the wrong fix.** It would make the safe reads slow without enforcing the rule that matters.

## How wrong answers are built

- **"Return results as they finish, one message each."** This sounds responsive. It breaks the one-message rule and trains away parallel calls.
- **"Set `disable_parallel_tool_use` at the top level of the request."** The field belongs inside `tool_choice`.
- **"Skip the result for a call you chose not to run."** Every `tool_use` needs a `tool_result`. Send an error result instead.
- **"Raise `max_tokens` for every `max_tokens` stop."** That is the fix only when a tool call was cut off. For long generated output, the better fix is often to split the work into smaller requests (Chapter 8).
- **"Force the call with `tool_choice: any`" on Opus 5.5 or Sonnet 5.5.** Those models return a 400. Use `auto` with strict tools, or structured outputs.
- **"Add 'ALWAYS call X first' to the prompt."** It is guidance, not enforcement. Prefer a schema dependency, an error result, or a hook.
- **"Parse Claude's text with a regex to find the decision."** The tool-use guide notes that if you find yourself writing a regex to pull a decision out of prose, that decision should have been a tool call.<sup>[2]</sup>

## What to remember

- The loop runs while `stop_reason` is `tool_use`. Know what `end_turn`, `max_tokens`, `pause_turn` and `refusal` each require.
- Tool results go in the very next user message, first in its content, matched by `tool_use_id`.
- Answer every parallel call in **one** user message. A call you skip still gets an `is_error` result.
- Run independent reads concurrently. Run writes and ordered steps sequentially.
- `disable_parallel_tool_use` sits inside `tool_choice`. Under `auto` it means at most one call. Under `any` or `tool` it means exactly one.
- `any` and `tool` skip preamble text and thinking. Opus 5.5, Sonnet 5.5, Fable 5.1 and Mythos 5.1 reject them, so use `auto` plus strict, or structured outputs.
- Enforce prerequisites with schema dependencies, error results and hooks, not prompt wording alone.

## Endnotes for this chapter

1. Claude emits a structured tool request containing an id, a name and an input, and the application executes it and returns the outcome. Anthropic, "Handle tool calls" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls
2. The client loop continues while the stop reason is `tool_use`, server tools pause with `pause_turn` at their iteration limit, and decisions that need regex extraction should be tool calls. Anthropic, "How tool use works" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works
3. The stop-reasons guide explains empty `end_turn` responses, truncated tool calls under `max_tokens`, refusals and context-window stops. Anthropic, "Stop reasons and fallback" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons
4. Tool results must immediately follow the call, come first in the message, can set `is_error`, and work best with instructive error text; strict mode removes invalid calls. Anthropic, "Handle tool calls" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls
5. Parallel calls must all be answered in a single user message, skipped calls still need error results, and `disable_parallel_tool_use` is set inside `tool_choice`. Anthropic, "Parallel tool use" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use
6. Parallel calling can be strengthened with prompting, and on Fable 5.1 the instruction should be repeated after each round of tool results in long loops. Anthropic, "Prompting best practices" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
7. The `tool_choice` options, their effect on preamble text and thinking, cache invalidation, and the 400 error from the newest models for forced choice are documented on the define-tools page. Anthropic, "Define tools" (Claude Platform Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools
