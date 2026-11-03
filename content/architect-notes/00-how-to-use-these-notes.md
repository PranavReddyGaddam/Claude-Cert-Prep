# How to Use These Notes

**Summary**: *These notes cover the five domains of the Claude Certified Architect – Foundations blueprint as design decisions, not feature tours. Each chapter teaches one family of decisions, works through a scenario, and then takes apart the wrong answers an exam item is likely to offer.*

## The exam rewards picking the mechanism that makes a failure impossible

Most scenario questions describe a system that already works some of the time. Four answers then propose fixes. Usually one fix makes the failure **structurally impossible**, one makes it **less likely**, one solves a **different problem**, and one adds **cost or complexity** without touching the cause.

Anthropic's own guidance draws the same line between **deterministic controls** (hooks, permission deny rules, managed settings) and **guidance the model may or may not follow** (prompts, CLAUDE.md, skills).<sup>[1]</sup> When a scenario says something must "never" or "always" happen, look first for the answer that moves the rule out of the prompt.

The second recurring idea is **simplicity first**. Anthropic recommends finding the simplest solution that works and adding agentic complexity only when it pays for its latency and cost.<sup>[2]</sup> A fix that adds a subagent, a new model, or a bigger context window is wrong if a sharper tool description or a schema solves the problem.

## The chapters follow the blueprint, weighted by difficulty

| Chapter | Blueprint domain | Weight |
|---|---|---|
| 1 The agent loop | Agentic architecture and orchestration | 27% |
| 2 Subagents | Agentic architecture and orchestration | 27% |
| 3 Shape of the work | Agentic architecture, Claude Code workflows | 27% / 20% |
| 4 State, resumption and long context | Agentic architecture, context management | 27% / 15% |
| 5 Claude Code configuration | Claude Code configuration and workflows | 20% |
| 6 Claude Code in review and CI | Claude Code configuration and workflows | 20% |
| 7 Tools and MCP | Tool design and MCP integration | 18% |
| 8 Prompting and structured output | Prompt engineering and structured output | 20% |
| 9 Reliability and human review | Context management and reliability | 15% |
| 10 Last-week review | All | — |

Chapters 1, 2, 4, 5 and 6 are the longest. They cover the topics where candidates most often choose a plausible but weaker mechanism: parallel tool results, subagent context scoping, state that survives an interruption, and choosing between CLAUDE.md, rules, skills, hooks and permissions.

## Each chapter has the same parts

- **Claim headings.** Every section heading is a sentence you could defend in an answer explanation. Skim the headings of a chapter and you have its argument.
- **A worked scenario.** A concrete system goes wrong, and the chapter traces which mechanism fixes it and why.
- **"How wrong answers are built."** This section lists the distractor patterns for the chapter's topic. Learn the patterns, not the items.
- **"What to remember."** This is a short list of facts to check yourself against in the last week.
- **Endnotes.** Every factual claim is tied to an official Anthropic or MCP page. If a note and the documentation disagree, the documentation wins. Product details such as default values and model support change between releases.

## Practise with the scenarios after each pair of chapters

The practice section has six scenarios of 15 questions each, built the way the exam is: one fixed system description, then a run of questions set inside it. The Exam Simulation draws four of them at random. Each explanation says why the right answer is right and why the tempting distractors fail. Read the explanation even when you answer correctly, because the distractor analysis is where most of the learning is.

A good rhythm is to read two chapters, take the questions for those domains, then come back to the "How wrong answers are built" sections for any you missed.

## Endnotes for this chapter

1. Claude Code's best-practices guide separates mechanisms that are enforced every time, such as hooks and deny rules, from instructions the model weighs, such as CLAUDE.md and skills. Anthropic, "Best practices for Claude Code" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/best-practices
2. Anthropic advises starting with the simplest workable design and adding agentic complexity only when its latency and cost are justified. Anthropic, "Building effective agents" (Anthropic Engineering, accessed 2026-11-01), https://www.anthropic.com/engineering/building-effective-agents
