# Chapter 3: Choosing the Model

**Summary**: *Claude comes in tiers. Haiku is the fastest and cheapest, Sonnet balances speed and intelligence for everyday work, Opus handles complex, long-running work, and Fable is the most capable tier for the hardest jobs. On top of the model you choose an effort level, which is often a better lever than switching models. A good choice starts from what the task needs (quality bar, speed, volume, how much of your usage it can spend), is tested on real examples, and is not "always the biggest" or "always the cheapest". Specific model names and plan rules change often, so learn the tiers and check the current lineup.*

This chapter covers objectives 3.2, "Differentiate between Claude model types (Haiku, Sonnet, Opus)", and 3.3, "Align model selection with task requirements (cost, speed, quality)". Which feature to use is in [Chapter 2](/ccao-f/read/notes/02-choosing-the-feature). Context windows and usage limits, which model choice affects, are in [Chapter 4](/ccao-f/read/notes/04-context-and-memory).

## Learn the tiers, then check the lineup

The exam guide names three families: Haiku, Sonnet and Opus. As of November 2026 Anthropic's lineup also includes a fourth, more capable tier, Fable. The current generation in Anthropic's own comparison table is:<sup>[1]</sup>

| Tier | Current model (Nov 2026) | Anthropic's description | Comparative latency |
|---|---|---|---|
| Fable | Claude Fable 5.1 | For demanding reasoning and long-horizon agentic work | Slower |
| Opus | Claude Opus 5.5 | For long-running agentic coding and knowledge work | Moderate |
| Sonnet | Claude Sonnet 5.5 | The best combination of speed and intelligence | Fast |
| Haiku | Claude Haiku 5.5 | For high-volume, latency-sensitive tasks such as classification, extraction and routing | Fastest |

The same page lists prices that fall steeply from Fable to Haiku.<sup>[1]</sup> You don't need the numbers for this exam (they are API prices per token, which is developer territory). You need the shape: **more capable tiers are slower and cost more, and lighter tiers are faster and cheaper.** On a Claude subscription, "cost" shows up as how fast you use your plan's limits, covered below.

Anthropic's model-selection guide gives each tier a typical job:<sup>[2]</sup>

- **Haiku**: real-time applications, high-volume processing, cost-sensitive work. In business terms: tagging 500 survey comments, pulling fields from a pile of forms, routing requests.
- **Sonnet**: everyday work that needs both speed and capability: data analysis, content creation, visual understanding.
- **Opus**: complex agentic and enterprise work: long multi-step tasks, complex analysis, vision-heavy work. Anthropic's guide says most workloads start with Opus 5.5.<sup>[2]</sup>
- **Fable**: the highest available capability: agent sessions that run for hours, multistep deep research, analysis carried through to a finished document, spreadsheet or deck.<sup>[2]</sup>

### Names and availability move; know where to look

Three recent changes show why you should learn tiers rather than memorize names:

- **Haiku 4.5 left the picker.** On October 29, 2026, Anthropic removed Claude Haiku 4.5 from the model selector in chat, Cowork and Claude Design on Free, Pro and Max plans, and replaced it with Haiku 5.5. It remains on Team and Enterprise plans, in Claude Code and on the API. Existing Haiku 4.5 chats continue on Haiku 5.5.<sup>[3]</sup>
- **Fable depends on your plan.** Fable 5 and Fable 5.1 are on all paid plans, not Free. On Max and Ultra, and on premium seats on Team and seat-based Enterprise, they are part of the plan: you can spend up to 50% of your weekly limit on Fable, and Fable uses your limits faster than other models. On Pro and on standard Team and Enterprise seats, Fable runs on pay-as-you-go usage credits from the start (as of November 2026).<sup>[4]</sup>
- **Models are retired routinely.** Anthropic says that historically it has deprecated most models about a year after release, and recommends testing newer models side by side with your important prompts as soon as a deprecation is announced.<sup>[5]</sup>

Each model also has a training cutoff. As of November 2026, Haiku 5.5, Sonnet 5.5, Opus 5.5 and Fable 5.1 were trained on data up to June 2026.<sup>[6]</sup> Choosing a newer model doesn't make it know last week's news. For anything current, the fix is web search, not a bigger model.

## Effort and thinking: tuning inside a model

The model menu next to the send button controls three things: the model, the effort level and thinking.<sup>[7]</sup>

**Effort** sets how much thinking Claude applies to a response. Higher effort gives more thorough responses but takes longer and uses more of your usage limits.<sup>[7]</sup> The levels, in Anthropic's words:<sup>[7]</sup>

| Level | Use it for |
|---|---|
| Low, Medium | Routine tasks; stretches your usage further |
| High | The best overall balance of quality and speed |
| Extra high (xhigh) | Long-running coding and agentic tasks (Opus 4.7 and newer) |
| Max | The deepest reasoning, for the hardest, correctness-critical work; expect longer responses |

Each model has a recommended level marked "Default" in the menu.<sup>[7]</sup> Anthropic's developer guide makes a point that applies just as much in the app: **tuning effort is often a better lever than switching models.**<sup>[2]</sup>

**Thinking** lets Claude break down the problem and plan before answering, shown in an expandable section you can read.<sup>[7]</sup> Effort and thinking are separate settings. On the newest models (Haiku 5.5, Sonnet 5.5, Opus 5.5, Fable 5.1 and Opus 5), thinking can't be turned off in Claude, so the toggle doesn't appear. To make those models think less, lower the effort level.<sup>[7]</sup>

You can change the model, effort or thinking at any point in a conversation; the change applies from Claude's next response.<sup>[7]</sup> Anthropic's guidance on when to raise them: the defaults suit everyday tasks, and higher effort or thinking help most with calculations, comprehensive project planning, detailed document analysis and multi-step problems.<sup>[7]</sup>

### What a model change can't fix

Most of the exam's model questions have a distractor that switches model to fix a problem the model isn't causing.

| The problem | Does a bigger model fix it? | The real fix |
|---|---|---|
| Output is vague or misses requirements | Rarely | A better brief ([Chapter 1](/ccao-f/read/notes/01-prompts-that-define-the-job)) |
| Facts about recent events are wrong | No | Web search or a current source |
| Claude didn't use your document | No | Attach it, or put it in the Project |
| A complex multi-step analysis has reasoning errors | Possibly, after raising effort | Raise effort first, then test a more capable tier |
| Simple high-volume task is slow and eats usage | No, the reverse | A lighter tier or lower effort |
| Sensitive data shouldn't be processed | No | A data-handling control ([Chapter 11](/ccao-f/read/notes/11-responsible-use-privacy-and-policy)) |

Changing model never changes the data rules. A more capable model is not "more private", and a lighter one is not "safer for confidential data".

## Aligning the choice with cost, speed and quality

### Two ways to start, then test

Anthropic describes two starting strategies.<sup>[2]</sup>

- **Efficiency-first.** Start with a fast, cheaper model such as Haiku, test thoroughly, and upgrade only for specific capability gaps. Best for prototyping, tight speed needs, cost-sensitive work and high-volume, straightforward tasks.
- **Capability-first.** Start with the strongest suitable model, get it working, then lower effort or move to a lighter model as the workflow matures. Best for complex reasoning, nuanced understanding and work where accuracy outweighs cost.

Either way, Anthropic's guide is clear that the decision should rest on **tests with your actual prompts and data**, comparing accuracy, response quality and handling of edge cases, and then weighing performance against cost.<sup>[2]</sup> It calls a good evaluation set "the most important step".<sup>[2]</sup>

**General practice.** For an Associate, "evaluation set" can be modest: ten real examples from the work, including a few awkward ones, and a written definition of acceptable. Run them on two candidate set-ups (say, Sonnet at default effort and Haiku at default effort) and compare. If the lighter set-up passes every case, it is the better choice for that task. If it fails the awkward ones, either use the stronger tier for everything or split the work, using the lighter model for routine cases and the stronger one for the exceptions.

### What cost means on a subscription

On a Claude plan you don't see per-message prices, but the same trade-off appears as usage. Your usage depends on conversation length and complexity, the features you use, the model, and the effort level.<sup>[8]</sup> Paid plans have a five-hour session limit and weekly limits, and some plans have a separate weekly limit for Fable.<sup>[8]</sup> Usage across claude.ai, Claude Desktop and Claude Code counts toward the same limit.<sup>[8]</sup> Anthropic's tips for stretching it include lower effort for routine work and choosing a lower effort level on always-thinking models.<sup>[8]</sup> So a team that runs every routine rewrite on the most capable model at Max effort is spending its limit on work that doesn't need it.

### Admins can shape the menu

On Enterprise plans, admins can enable or disable models for the organization or for custom roles, cap the maximum effort level, and set a default model and default effort for new conversations.<sup>[9]</sup><sup>[10]</sup> Haiku models are always available and can't be disabled, so members always have a model to fall back to.<sup>[9]</sup> If a model or effort level you expect is missing, or every chat starts on the same model, your administrator may have configured it that way; you can still change both within a chat, inside the caps.<sup>[7]</sup> The Associate move is to ask the admin, not to switch to a personal account to get the missing model.

## When Claude switches models on its own

The most capable models run automated safety checks on every request, including on content Claude reads from memory, connectors, web results and files. A narrow set of higher-risk requests (for example offensive cybersecurity techniques, some dual-use biology, attempts to extract the model's internal reasoning) either fall back to a less capable model or are blocked.<sup>[11]</sup><sup>[12]</sup><sup>[13]</sup> As of November 2026:

- Fable 5 and 5.1 fall back to an Opus model.<sup>[13]</sup>
- Opus 5.5 can fall back to Opus 5 or Opus 4.8, depending on the topic.<sup>[12]</sup>
- Sonnet 5.5 can fall back to Sonnet 5.<sup>[11]</sup>

Fallbacks are visible. You see a notice, the response is labelled with the model that answered, and the picker stays on the fallback model for the rest of the chat. Automatic switching is on by default, and you can turn it off in **Settings > Capabilities** ("Switch models when a message is flagged"), in which case a flagged request pauses the chat instead.<sup>[12]</sup> Switching back to the original model may trigger the same fallback if the flagged request is still in the conversation; editing the earlier message often helps.<sup>[12]</sup>

Exam relevance: if a stem says a response came from a different model than the one selected, this is the explanation. It is not a bug, and it is not evidence that the user's plan changed. And because the checks include content from files and connectors, a fallback can be triggered by something the user didn't type.<sup>[12]</sup>

## Worked example: three tasks at a recruitment agency

An agency's operations lead, Sam, sets up three recurring jobs.

1. **Tag 400 candidate survey comments** by theme each week. The task is simple and high-volume. Sam tests ten comments on Haiku 5.5 and Sonnet 5.5 at default effort. Both tag correctly; Haiku is faster and lighter on usage. Haiku wins.
2. **Draft personalized outreach emails** from a candidate profile and a role description. Haiku's drafts are accurate but flat on the tricky cases (career changers). Sonnet handles them well. Sonnet at default effort wins. Sam does not jump to Opus at Max effort, which would be slower and use more of the team's limits for no visible gain.
3. **Quarterly analysis** of placement data across regions with a written recommendation for directors. This is complex, multi-step and consequential. Sam starts on Opus 5.5 at its default effort, checks the analysis, and raises effort for the section with the most complex comparisons. A team member suggests Fable 5.1, but on their Pro plan it would run on usage credits, and Opus already meets the bar on Sam's test quarter.

What Sam did not do: pick one model "to keep things simple" for all three, or choose by reputation instead of by test.

## The traps

- **Always the most capable model.** It sounds safe. It is slower, uses limits faster, and doesn't fix vague prompts, missing sources or out-of-date knowledge.
- **Always the cheapest model.** Equally blunt. Fine for routine high-volume work, wrong for a complex analysis where an error is expensive.
- **Switching models to fix a context problem.** If Claude ignored the policy, the policy wasn't in the conversation. Changing model doesn't put it there.
- **Choosing by name or reputation instead of by test.** "Opus is the best" is not a selection method. Ten real examples are.
- **Maxing effort on everything.** Effort is a dial, and the default is the recommended starting point. Raise it for the hard parts.
- **Treating model choice as a privacy control.** No model setting changes how data is handled.
- **Memorizing a lineup.** Names, plan inclusion and retirements change. Check the picker and the Help Center.

## On the exam

- Haiku: fastest, lowest cost, high-volume and simple. Sonnet: balance of speed and intelligence for everyday work. Opus: complex, long-running work. Fable (Nov 2026): highest capability, paid plans, and on Pro it runs on usage credits.
- More capability means slower and more usage. Pick the lightest set-up that passes tests on real examples.
- Effort is often a better lever than switching models. On always-thinking models, lower effort to think less.
- Model changes apply from the next response and can be made mid-chat.
- A bigger model doesn't fix missing context, vague requirements, recent-events gaps or data-handling rules.
- A response labelled with a different model usually means a safety fallback; it is visible and can be turned off in Settings > Capabilities.
- On Enterprise, missing models or effort caps are admin settings; Haiku can't be disabled. Ask the admin.

## Endnotes

1. Current model lineup with descriptions, comparative latency, prices, default effort and context windows. Anthropic, "Models overview" (Claude Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/models/overview
2. Capabilities, speed, cost and effort as criteria; tuning effort often a better lever than switching models; efficiency-first and capability-first strategies; the model selection matrix; "most workloads start with Claude Opus 5.5"; testing with your own prompts and data. Anthropic, "Choosing the right model" (Claude Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/about-claude/models/choosing-a-model
3. Haiku 4.5 removed from the selector on October 29, 2026 for Free, Pro and Max; replaced by Haiku 5.5; still available on Team, Enterprise, Claude Code and the API. Anthropic, "Claude Haiku 4.5 was removed from the model selector" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/17444146-claude-haiku-4-5-was-removed-from-the-model-selector
4. Fable 5 and 5.1 on all paid plans; included with up to 50% of weekly limits on Max, Ultra and premium seats; usage credits on Pro and standard seats. Anthropic, "Claude Fable models on your plan" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/15424964-claude-fable-models-on-your-plan
5. Deprecations are routine, most models historically deprecated about a year after release, and test newer models side by side. Anthropic, "Adapt to new model personas after deprecations" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12738598-adapt-to-new-model-personas-after-deprecations
6. Training data cutoffs by model. Anthropic, "How up-to-date is Claude's training data?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/8114494-how-up-to-date-is-claude-s-training-data
7. Model, effort and thinking settings; effort levels and their uses; models where thinking can't be turned off; changes apply from the next response; admin-configured defaults; when to raise effort or use thinking. Anthropic, "Change the model, effort, and thinking settings" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings
8. What affects usage, five-hour and weekly limits, a separate Fable weekly limit on some plans, usage shared across surfaces, and lowering effort to save usage. Anthropic, "How do usage and length limits work?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work
9. Enterprise model access and effort caps at organization and role level; Haiku models can't be disabled. Anthropic, "Manage model access for your organization" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/15694740-manage-model-access-for-your-organization
10. Enterprise default model and default effort for new conversations, and the option to always start on the default. Anthropic, "Set a default model for your organization" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/15330088-set-a-default-model-for-your-organization
11. Sonnet 5.5 safety classifiers and fallback to Sonnet 5. Anthropic, "Why Claude switched models in your conversation with Sonnet 5.5" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/17161993-why-claude-switched-models-in-your-conversation-with-sonnet-5-5
12. Opus 5 and 5.5 classifiers on everything the model reads, fallbacks, visible notices, the picker staying on the fallback model, the "Switch models when a message is flagged" setting, and editing the earlier message. Anthropic, "Why Claude switched models in your conversation with Opus 5 or Opus 5.5" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/16049681-why-claude-switched-models-in-your-conversation-with-opus-5-or-opus-5-5
13. Fable 5 and 5.1 safeguards and fallback to Opus models. Anthropic, "Why Claude switched models in your conversation with Fable 5 or Fable 5.1" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/15363606-why-claude-switched-models-in-your-conversation-with-fable-5-or-fable-5-1
