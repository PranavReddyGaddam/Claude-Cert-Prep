# How to Use These Notes

**Summary**: *These notes cover the seven domains of the Claude Certified Architect – Professional (CCAR-P) blueprint. Pro items are short, standalone stems that test trade-off judgment across a system's whole lifecycle. Each chapter teaches one family of decisions, works through a design review, and takes apart the wrong answers an item is likely to offer.*

## A Pro item is a short stem with one constraint that decides it

The exam has 63 items in 120 minutes and is scored on a scale where 720 of 1000 passes. Items are multiple-choice or multiple-response, and **each multiple-response item tells you how many answers to select**. There are no long shared case studies. A typical stem is two to four sentences: a system, a symptom or a goal, and one or two facts that look like background but decide the answer.

Read every stem twice. On the second pass, mark three things.

1. **The constraint that dominates.** Cost, latency, risk, regulation or maintainability. Stems usually state one outright ("must not leave the EU", "results are needed by the next morning", "the team has one engineer").
2. **What changed and what did not.** "Accuracy dropped after the knowledge base was refreshed; the model and latency are unchanged" tells you where the cause is and where it is not.
3. **What the requirement protects.** If the stem says users need the full document, any answer that truncates it is wrong no matter how much it saves.

The right answer almost always **removes or fixes the cause**. It does not add a layer that watches the cause happen.

## Select-N items reward two independent correct reasons

A multiple-response item states how many answers to select, and you should select exactly that many. The trap is choosing two options that say the same thing in different words, or one fix plus a compensating control for the same fix.

A good approach:

- First eliminate every option that fails the stated constraint outright.
- Of what remains, look for options that address **different parts** of the problem, such as one change to the design and one change to how it is measured.
- If two remaining options are near-duplicates, at most one of them is right. Usually the more specific one.

## Wrong answers come from four families

Learn the families, not individual items. Every "How wrong answers are built" section in these notes ties its bullets back to them. Each example below is original.

| Family | What it looks like | Why it loses |
|---|---|---|
| 1. Compensating control instead of removal | Audit logging, a confirmation prompt, an alert or a dashboard where the capability should not exist | The risk remains. You have only made it visible or slower |
| 2. Blunt fix that breaks a stated requirement | Truncating needed input, downsizing the model regardless of task fit, dropping a feature to save cost | It solves the headline metric by violating something the stem said mattered |
| 3. Irrelevant or wrong knob | A bigger model, temperature, a larger context window, "the model silently changed" | The evidence points somewhere else. The knob is real but not the cause |
| 4. Diagnosis that ignores what changed | Blaming the component the stem says is unchanged | The stem tells you which part moved. Follow it |

**Family 1 example.** An internal research agent can call a tool that deletes rows in the analytics warehouse. It only ever needs to read. A tempting answer is "log every delete call and alert the data team." The better answer removes the delete tool from the agent's tool set, or gives it read-only credentials. Logging tells you about the damage after it happens.

**Family 2 example.** A contract-summary pipeline costs too much, and most of the spend is long input documents. A tempting answer is "send only the first 20 pages of each contract." The stem said reviewers rely on termination and liability clauses, which usually sit near the end. The better answer keeps the full document and cuts cost another way, such as caching the shared instructions or moving the non-urgent work to batch processing.

**Family 3 example.** A classification step returns inconsistent labels for near-identical tickets. A tempting answer is "move to the largest model." The stem mentions that the category list was edited last week and two categories now overlap in meaning. The cause is the category definitions, so the fix is to make them mutually exclusive and add examples at the boundary.

**Family 4 example.** A support assistant's answers became less accurate on Monday. The stem says the help-center articles were re-imported over the weekend and that model version, prompt and latency did not change. A tempting answer is "the provider updated the model." The evidence points at the re-import: check the chunking, metadata and freshness of the new index.

## Pro differs from Foundations in what it asks you to weigh

The Foundations exam mostly asks **which mechanism makes a failure impossible**: a hook instead of a prompt instruction, a tool list instead of an allow list, a schema instead of "please return JSON". Those notes live at [/ccar-f/read/notes/00-how-to-use-these-notes](/ccar-f/read/notes/00-how-to-use-these-notes), and these chapters assume you know them.

Pro asks a different question: **given several mechanisms that would all work, which one is right for this organization, this budget and this point in the lifecycle?** Typical Pro judgments:

- A workflow versus an agent when both would pass the eval, but one is cheaper to run and easier to audit.
- Batch processing versus real-time calls when the business can or cannot wait.
- A smaller model with routing versus one large model when the edge-case accuracy target is the binding constraint.
- How to tell a stakeholder that the 99.9% availability they want is not something an API rate limit can promise.
- What to measure after launch, and what to do when the measurement moves.

Anthropic's guidance on agents puts the starting point plainly: find the **simplest solution possible** and add complexity only when it is needed, because agentic systems often trade latency and cost for better task performance.<sup>[1]</sup> Many Pro items are that sentence applied to a specific budget.

Pro also covers ground no Anthropic page documents, such as A/B test statistics, SLOs, stakeholder practice, architecture decision records and regulation. Sections that rely on general engineering practice are marked *General practice, not from Anthropic documentation.* Treat those as sound defaults, not as product facts.

## The chapters follow the blueprint's seven domains

| Chapter | Title | Domain | Weight |
|---|---|---|---|
| [1](/ccar-p/read/pro-notes/01-from-business-problem-to-architecture) | From Business Problem to Architecture | Solution Design & Architecture (D1.1, D1.2, D1.6) | 17% |
| [2](/ccar-p/read/pro-notes/02-choosing-the-pattern) | Choosing the Pattern: Workflows, Agents and Multi-Agent Systems | Solution Design & Architecture (D1.3, D1.4, D1.5) | 17% |
| [3](/ccar-p/read/pro-notes/03-models-and-prompts) | Models and Prompts as Design Decisions | Claude Models, Prompting & Context Engineering (D2.1–D2.3) | 13% |
| [4](/ccar-p/read/pro-notes/04-context-tokens-and-reuse) | Context, Tokens and Prompt Reuse | Claude Models, Prompting & Context Engineering (D2.4, D2.5) | 13% |
| [5](/ccar-p/read/pro-notes/05-integration-mechanisms-and-scope) | Integration Mechanisms and Capability Scope | Integration (D3.1, D3.7, D3.8) | 19% |
| [6](/ccar-p/read/pro-notes/06-retrieval-augmented-generation) | Retrieval-Augmented Generation | Integration (D3.5, D3.6) | 19% |
| [7](/ccar-p/read/pro-notes/07-identity-latency-and-observability) | Identity, Latency and Observability | Integration (D3.2–D3.4) | 19% |
| [8](/ccar-p/read/pro-notes/08-evaluation-testing-and-optimization) | Evaluation, Testing and Optimization | Evaluation, Testing & Optimization (D4.1–D4.6) | 16% |
| [9](/ccar-p/read/pro-notes/09-governance-safety-and-risk) | Governance, Safety and Risk | Governance, Safety & Risk Management (D5.1–D5.5) | 14% |
| [10](/ccar-p/read/pro-notes/10-discovery-communication-and-lifecycle) | Discovery, Communication and the System Lifecycle | Stakeholder Communication & Lifecycle Management (D6.1–D6.5) | 14% |
| [11](/ccar-p/read/pro-notes/11-team-enablement-and-operations) | Team Enablement and Operations | Developer Productivity & Operational Enablement (D7.1–D7.3) | 7% |
| [12](/ccar-p/read/pro-notes/12-capstone-design-reviews) | Capstone Design Reviews | All | — |

Integration is the heaviest domain at 19%, so it gets three chapters. Developer productivity is the lightest at 7%, and chapter 11 is shorter to match. Domains 1 and 2 are each split in two because their objectives fall into two distinct groups of decisions.

## Each chapter has the same parts

- **Claim headings.** Every section heading is a sentence you could defend in an answer explanation. Skim a chapter's headings and you have its argument.
- **One section per objective.** Each section states *the decision*, ranks the options by which constraint dominates, shows how to *read the evidence* (symptom to likely cause), and lists *numbers worth knowing*.
- **A worked design review.** A concrete system, the flawed design, the constraint that decides, the better design, and why each tempting alternative loses.
- **"How wrong answers are built."** Distractor patterns for the chapter, each tied to one of the four families.
- **"What to remember."** A short list to check yourself against in the last week.
- **Endnotes.** Every Claude-specific claim is tied to an official Anthropic or MCP page. Prices, limits, model names and beta status change between releases. If a note and the documentation disagree, the documentation wins.

## Use the question bank in short loops

The CCAR-P question bank has 126 questions in seven domain sets, written in the exam's style: short standalone stems, four-option single-answer items and five-option "Which TWO" items. Each explanation says why the right answer is right and why every distractor fails. The Exam Simulation draws 63 of them per attempt, split by blueprint weight, with a 120-minute timer.

A rhythm that works:

1. Read one chapter. Skim its headings again at the end and say each claim out loud in your own words.
2. Take that domain's questions without notes.
3. For every miss, name the wrong-answer family of the option you picked. If you keep landing in the same family, that is your habit to break, and it will cost you points across every domain.
4. Read the explanation even when you were right. The distractor analysis is where most of the learning is.
5. In the last week, reread only the "How wrong answers are built" and "What to remember" sections, then do the capstone reviews in chapter 12.

Time matters too: 63 items in 120 minutes is a little under two minutes each. Short stems make that comfortable, so bank the time and spend it on select-N items, where each pick has to survive the stated constraint on its own.

## Endnotes for this chapter

1. Anthropic recommends finding the simplest solution possible and increasing complexity only when needed, noting that agentic systems often trade latency and cost for better task performance. Anthropic, "Building effective agents" (Anthropic Engineering, accessed 2026-11-02), https://www.anthropic.com/research/building-effective-agents
