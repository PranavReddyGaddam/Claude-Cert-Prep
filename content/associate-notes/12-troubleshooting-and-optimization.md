# Chapter 12: Troubleshooting and Optimization

**Summary**: *When Claude underperforms, diagnose before you retry. Most poor outputs trace to a short list of causes: missing context, an unclear or overloaded request, the wrong feature or setting, a source Claude cannot reach, or a product limit. Fix the cause with the smallest change, change one thing at a time, and make a fix that works permanent where it belongs. Optimizing means getting the same quality for less effort, time and usage, or better quality for the same, and you judge it by finished, usable work, not by messages sent or tokens saved.*

This chapter covers objectives 7.1 (diagnose and resolve underperforming prompts and poor outputs), 7.2 (adjust approach based on feedback and results) and 7.3 (optimize workflows). Writing the prompt in the first place is [Chapter 1](/ccao-f/read/notes/01-prompts-that-define-the-job). Model and effort choice is [Chapter 3](/ccao-f/read/notes/03-choosing-the-model). Context limits and memory are [Chapter 4](/ccao-f/read/notes/04-context-and-memory). Project knowledge problems are [Chapter 5](/ccao-f/read/notes/05-projects-knowledge-and-connectors).

## 7.1 Diagnosing and resolving poor outputs

### Diagnose first

"Try again" is not a diagnosis. Re-sending the same request usually reproduces the same problem, because the cause has not changed. Anthropic's Help Center gives four principles for a prompt that is not giving a helpful answer: explain the ask simply and clearly; include as much context as possible, as if for someone with no background; break complex requests into substeps; and give Claude feedback, clarifications or a request to rewrite.<sup>[1]</sup> Each maps to a cause.

| Symptom | Likely cause | Fix |
|---|---|---|
| Generic, could-apply-to-anyone answer | Missing context: audience, purpose, constraints, examples | Add the context Claude lacked<sup>[1]</sup> |
| Answer to a different question | Ambiguous or overloaded request | Restate the single ask clearly; split the rest into steps<sup>[1]</sup> |
| Long task done well at the start, badly at the end | Too many jobs in one request | Break into substeps; check each before the next<sup>[1][2]</sup> |
| Response too brief or stops partway | The request did not set scope; long output in one go | Retool the prompt; give Claude the previous prompt and response so it picks up where it left off<sup>[3]</sup> |
| Different format every run | Format not defined | Specify the exact format and show an example<sup>[2]</sup> |
| Invented facts or figures | No grounding; no permission to say "I don't know" | Supply sources, restrict to them, allow uncertainty<sup>[4]</sup> |
| Wrong about recent events | Training cutoff | Turn on web search or supply a current source<sup>[5]</sup> |
| "I've sent the email" but nothing arrived; dead links | Capability hallucination | Confirm in the real system; Claude cannot use tools that are not integrated<sup>[6]</sup> |
| Ignores a document you thought it had | The document is not in this chat or project | Check what is attached; see [Chapter 5](/ccao-f/read/notes/05-projects-knowledge-and-connectors) |
| Research gives a quick answer, not a deep one | Research not actually used | Steer explicitly: "please use the research tool to…"<sup>[7]</sup> |
| Research ignores your connectors | Started in Claude Mobile, which searches only the web, with no error shown | Start research on the web or in Claude Desktop<sup>[7]</sup> |
| Thinking stops with "the rest is not available" | Safety systems flagged content in the reasoning | Reframe the request from a different angle<sup>[8]</sup> |
| An artifact shows an error | A bug in what Claude built | Use "Try fixing with Claude"; success is not guaranteed<sup>[9]</sup> |

### Product messages are not prompt problems

Some failures have nothing to do with the prompt. Recognizing them saves you from rewriting a prompt that was fine. As of November 2026, Anthropic describes these messages:<sup>[10]</sup>

| Message | What it means | What to do |
|---|---|---|
| "Due to unexpected capacity constraints, Claude is unable to respond…" | High demand system-wide. **Not an outage**, and it does not appear on the status page | Try again in a few minutes |
| Service incident | A real disruption for most users | Check status.claude.com |
| "Your message will exceed the length limit for this chat…" | This message is too long for the context window | Send fewer or smaller files, split the content, extract the relevant parts first, or start a new conversation |
| "Approaching session limit" / "5-hour limit reached" / weekly limit | Usage limits | Wait for the reset, use usage credits if enabled, or upgrade; see 7.3 for using less |

Length limits and usage limits are different things: usage limits control how much you use Claude over time; length limits control how long a single conversation can be.<sup>[11]</sup>

### Fix the cause, one change at a time

Good troubleshooting is controlled (General practice). Change one variable, re-run on the same input, and compare. If you add context, switch model and rewrite the format at once, you will not know which change helped, and you cannot reuse the lesson. Keep the failing example: it becomes the test case for the fix.

### Example

A training coordinator at a hospital trust asks Claude to turn a 60-page policy into a quiz for new porters. The questions come back generic and some test things the policy does not say. She diagnoses two causes. First, she uploaded the whole policy but never said which sections apply to porters, so Claude spread across everything. Second, she never told it to use only the document. She re-runs with the four relevant sections named, an instruction to base every question only on those sections and cite the paragraph, and permission to say a topic is not covered.<sup>[4]</sup> The questions are now on target. She keeps the old output to compare against.

### The traps

- **Retrying unchanged.** Same input, same cause, similar output.
- **Cosmetic fixes (family 2).** "Ask Claude to be more detailed" for an answer that is generic because it lacked context. "Add a persona" for an answer that is wrong because the source was missing.
- **Switching to the most capable model first (family 4).** A model upgrade cannot supply a document Claude never received or define a format you never stated. Check inputs and instructions before reaching for a bigger model.
- **Treating a capacity message as a prompt failure.** Rewriting the prompt when the system is busy wastes time; wait and retry.
- **Trusting "I fixed it".** After a fix, check the output again against the requirement, not against Claude's statement that the issue is resolved.

## 7.2 Adjusting approach based on feedback and results

### Three kinds of feedback

Feedback comes from three places, and each goes somewhere different (General practice, with features cited):

1. **Your own review of the output.** Within the conversation, tell Claude specifically what was wrong and why. Anthropic lists follow-up instructions, clarifications and requests to rewrite as normal parts of getting a good answer.<sup>[1]</sup>
2. **The people who receive it.** A manager who always cuts the background section, a client who keeps asking for the cost line first. Recurring corrections are information about the reader. Turn them into standing instructions so you stop making the same edit every week.
3. **Anthropic.** The thumbs-down button tells Anthropic a response was unhelpful.<sup>[12]</sup> It helps Anthropic improve; it does not change your next output. Use it, and still fix your own workflow.

### Make a working fix persistent, at the right level

A fix that lives only in one chat has to be rediscovered next time. Put it where it applies:

| Scope of the fix | Where it goes |
|---|---|
| This conversation only | A follow-up message |
| Every chat in one body of work | Project instructions (and the right project knowledge)<sup>[13]</sup> |
| All of your conversations | Profile instructions<sup>[13]</sup> |
| A repeatable format or tone you switch on when needed | A skill<sup>[13]</sup> |

Anthropic suggests a useful trick when you are not sure how to describe what you want: ask Claude to review conversations you were happy with and draft instructions for itself based on them.<sup>[14]</sup>

### When the results say the approach is wrong

Sometimes tuning the prompt is the wrong move because the approach does not fit the task. Signals and switches (General practice, features cited):

- **One answer is not enough breadth.** Several searches building on each other: switch from a plain chat to research.<sup>[7]</sup>
- **A long conversation drifts.** In very long chats, starting a new conversation with a short summary of decisions so far is often better than more corrections. Long chats that trigger automatic context management also use more of your usage limit.<sup>[11]</sup>
- **The same output is needed every week.** Stop re-creating it by hand; set up a project or a scheduled task (see 7.3 below).
- **Prose keeps failing a downstream check.** Switch to a structured format with an example ([Chapter 8](/ccao-f/read/notes/08-shaping-output-for-the-reader)).
- **Errors keep reaching people.** Add a review step proportionate to the risk ([Chapter 7](/ccao-f/read/notes/07-when-a-human-must-review)).
- **The fix needs automation, an API or a system integration.** That is beyond what an Associate should build in chat. Escalate to a developer or architect with a clear description of the problem and examples.

### When the model changes

Models are deprecated and replaced. Anthropic says it has historically deprecated most models around a year after release, and recommends trying newer models as soon as a deprecation is announced, running side-by-side comparisons on the prompts that matter most to you. Memory, chat search, project instructions and profile instructions help a new model adapt to your preferences; if a new model is more or less talkative or has a different tone, shape it with those same tools.<sup>[14]</sup>

### Example

A marketing lead has a project that drafts weekly social posts. Her director keeps rewriting the same things: removing exclamation marks, replacing "solutions" with the product name, adding a link to the event page. Rather than correcting each week, she adds three lines to the project instructions and uploads two posts the director approved as examples. The rewrite rate drops. When the team switches to a newer model after a deprecation notice, she runs last month's five briefs through both models and compares against the director's approved versions before switching the project over.

### The traps

- **Correcting the same thing every time.** If the feedback recurs, the fix belongs in instructions, not in your weekly edits.
- **Putting a one-off correction in profile instructions.** A fix for one client's style applied to every conversation causes new problems elsewhere.
- **The thumbs-down as the fix (family 3).** It sends feedback to Anthropic; it changes nothing in your workflow.
- **Abandoning a task after one bad round (family 4).** Diagnose; the task may need a different feature or more context, not a different tool.

## 7.3 Optimizing workflows

### Efficiency and effectiveness are different

**Efficiency** is less time, fewer messages, less usage for the same result. **Effectiveness** is a better result. The exam often offers an option that saves usage and quietly lowers quality; that is not optimization. Judge any change by **cost per finished, usable piece of work**, including the rework it causes. Anthropic's platform guidance makes the same point in API terms: compare options on cost per completed task, not per unit, because a cheaper attempt that fails still costs the attempt plus the retry.<sup>[15]</sup>

### Levers inside the Claude app

Anthropic lists what drives usage: message length, attachment size, conversation length, tool use such as research and web search, model choice, effort level, artifacts, and multi-step tasks like running code or creating files.<sup>[16]</sup> The matching levers, as of November 2026:

- **Plan the conversation.** Decide what you need, combine related questions into one message, and give background up front to cut back-and-forth.<sup>[16]</sup>
- **Batch similar requests.** Send related tasks in one message rather than one at a time.<sup>[16]</sup>
- **Use projects for material you reuse.** Project content is cached and counts less against your limits when reused; caches expire after inactivity, so the first message after a long break counts the content in full again.<sup>[16]</sup>
- **Keep project instructions short and remove unused files.** Put general context and role in project instructions and task-specific instructions in the chat.<sup>[11]</sup>
- **Turn off what you do not need.** Tools and connectors are token-intensive; turn off connected apps a conversation does not need, and ask Claude not to search the web when you do not need current information.<sup>[11]</sup>
- **Match effort to the task.** Low and Medium suit routine tasks and stretch usage; High is the best overall balance; Max is for the deepest reasoning. Higher effort is more thorough but slower and uses more of your limits.<sup>[8]</sup> On models with a thinking toggle, turn thinking off when you do not need it; where thinking is always on, choose a lower effort instead.<sup>[11]</sup>
- **Start fresh when a chat gets long.** Longer conversations that trigger automatic context management consume more usage; start a new conversation if you are approaching your limit.<sup>[11]</sup>
- **Be strategic with research and long links.** Research can use limits faster because it retrieves many sources.<sup>[7]</sup> Pasting a link to a long article pulls the whole article into context.<sup>[5]</sup>
- **Watch your usage.** Settings > Usage shows session and weekly progress on paid plans.<sup>[16]</sup>

### Automate what recurs

When the same task runs on a cadence (a Monday briefing from Slack and email, a weekly report from Drive files), describe it once as a **scheduled task**. Scheduled tasks are available on paid plans in Cowork and the new Claude experience; they run remotely on the cadence you choose, even when your computer is asleep, using your connectors, and you review each run's results when ready.<sup>[17]</sup> Automating the run does not remove the need to check the output before others rely on it.

### Spend capability where it pays

Not every task needs the most capable model or the highest effort ([Chapter 3](/ccao-f/read/notes/03-choosing-the-model)). A pattern Anthropic measured on the platform transfers well to chat work: where outputs are easy to check, run at a lower setting first and step up only for the cases that fail the check.<sup>[15]</sup> For an Associate, that might mean drafting 40 routine product descriptions with a faster model at default effort, checking them against the spec sheet, and redoing only the few that fail with a more capable model or higher effort. It does **not** apply where you cannot tell a good output from a bad one cheaply.

### Know the limit tools, and what they are not

Paid plans can enable usage credits so work continues at pay-as-you-go rates after a limit is reached; occasional limit resets set a session or weekly limit back to full when you choose to use one.<sup>[10][18]</sup> These buy more capacity. They do not make a wasteful workflow efficient, and an exam option that answers "our team keeps hitting limits" with "buy more credits" alone usually misses the cheaper fix of using projects, batching and the right effort level.

### Example

An operations analyst spends Monday mornings building a supplier-performance summary: she uploads the same three reference documents to a new chat, pastes this week's CSV, and asks a series of follow-ups at Max effort with every connector on. She restructures. The reference documents go into a project with short instructions describing the summary format. Her request becomes one message listing everything she needs. She drops effort to the default for this routine summary and turns off connectors the task never uses. When she wants a deeper root-cause analysis on one supplier, she raises effort for that chat only. Quality is unchanged; she stops hitting her session limit on Mondays.

### The traps

- **Cheapest setting everywhere.** Lowest effort on work that then needs two rounds of correction is not cheaper.
- **Most capable model everywhere (family 4).** Routine tasks do not need maximum capability, and it uses your limits faster.
- **Optimizing before the output is right.** Make it correct first, then make it efficient.
- **Automating without a check.** A scheduled report that nobody reviews spreads errors on a schedule.
- **Credits instead of fixes.** More capacity does not repair a wasteful workflow.

## On the exam

- Diagnose the cause before retrying. Map the symptom to missing context, unclear ask, missing source, wrong feature or setting, or a product limit.
- Capacity messages are not outages and not prompt problems: wait and retry. Incidents are on the status page.
- A length-limit error means the message or chat is too long: split, extract, or start a new chat.
- Change one thing at a time and keep the failing example as the test.
- Recurring feedback becomes instructions at the right scope: chat, project, profile or skill.
- Thumbs-down helps Anthropic, not your next output.
- Optimize for cost per usable result: projects for reused material, batched requests, effort matched to the task, unused tools off, fresh chats for long threads, scheduled tasks for recurring work, with a check still in place.
- When the fix needs automation or integration beyond the Claude app, escalate.

## Notes

1. Explain the ask clearly, include as much context as possible, break complex requests into substeps, and give Claude feedback. Anthropic, "My prompt isn't giving me a helpful answer." (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/7996857-my-prompt-isn-t-giving-me-a-helpful-answer
2. Specify the format, constrain with examples, and chain prompts for complex tasks. Anthropic, "Increase output consistency" (Claude Docs, accessed 2026-11-05), https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/increase-consistency
3. Brief or partial responses: retool the prompt and give Claude the previous prompt and response to continue. Anthropic, "Claude's response to my prompt is too brief." (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/8114518-claude-s-response-to-my-prompt-is-too-brief
4. Allow "I don't know", restrict to provided documents, use quotes and citations. Anthropic, "Reduce hallucinations" (Claude Docs, accessed 2026-11-05), https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
5. Web search for current information; long links pull the whole article into context. Anthropic, "Enable and use web search" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/10684626-enable-and-use-web-search
6. Claude can hallucinate capabilities, produce dead links and falsely claim to have sent emails. Anthropic, "Claude is producing links that don't work and falsely claiming that it has sent emails or produced external documents. What's going on?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/8241188-claude-is-producing-links-that-don-t-work-and-falsely-claiming-that-it-has-sent-emails-or-produced-external-documents-what-s-going-on
7. Steering Claude to use research, research on mobile skipping connectors without an error, and research using limits faster. Anthropic, "Use research on Claude" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/11088861-use-research-on-claude
8. Effort levels and when to use them, thinking, and incomplete thought processes. Anthropic, "Change the model, effort, and thinking settings" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings
9. "Try fixing with Claude" for artifact errors. Anthropic, "What are artifacts and how do I use them?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them
10. Usage limit warnings, usage credits, length limit errors, capacity constraints versus incidents. Anthropic, "Troubleshoot Claude error messages" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12466728-troubleshoot-claude-error-messages
11. Usage versus length limits, automatic context management and its usage cost, and strategies (concise project instructions, remove unused files, thinking and effort, turning off tools). Anthropic, "How do usage and length limits work?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work
12. Thumbs-down feedback to Anthropic. Anthropic, "Claude is providing incorrect or misleading responses. What's going on?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/8525154-claude-is-providing-incorrect-or-misleading-responses-what-s-going-on
13. Profile instructions, project instructions and skills, and when to use each. Anthropic, "Understanding Claude's personalization features" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/10185728-understanding-claude-s-personalization-features
14. Model deprecation strategies: test early with side-by-side comparisons, use memory and projects, ask Claude to draft instructions from conversations you valued; most models deprecated around a year after release. Anthropic, "Adapt to new model personas after deprecations" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12738598-adapt-to-new-model-personas-after-deprecations
15. Compare on cost per completed task; run at a lower setting and re-run failures higher when outputs are checkable. Anthropic, "Optimizing for cost and intelligence" (Claude Docs, accessed 2026-11-05), https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence
16. Factors that affect usage, planning conversations, batching, project caching and cache expiry, Settings > Usage. Anthropic, "Usage limit best practices" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/9797557-usage-limit-best-practices
17. Scheduled tasks: availability, running remotely on a cadence, connectors, reviewing results. Anthropic, "Schedule recurring tasks in Claude Cowork" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork
18. Limit resets set a session or weekly limit back to full. Anthropic, "What is a limit reset?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/17007452-what-is-a-limit-reset
