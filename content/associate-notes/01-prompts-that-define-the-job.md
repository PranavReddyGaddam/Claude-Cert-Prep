# Chapter 1: Prompts That Define the Job

**Summary**: *A good prompt is a job brief for a capable new hire who knows nothing about you, your team or your task. It says what the output is for, who will read it, what to work from, what rules apply and what "done" looks like. Big jobs get split at the points where you can check the work. When the output disappoints, you find the missing piece before you reword anything. And the brief changes shape with the task: analysis, research, drafting and brainstorming each need something different from you.*

This chapter covers all four Domain 1 objectives (Prompting and Task Execution, 14% of the exam). Choosing the feature that carries the prompt (chat, Project, Research, Cowork) is in [Chapter 2](/ccao-f/read/notes/02-choosing-the-feature). Checking what comes back is in [Chapter 6](/ccao-f/read/notes/06-checking-what-claude-wrote). Diagnosing a prompt that keeps failing is in [Chapter 12](/ccao-f/read/notes/12-troubleshooting-and-optimization).

## 1.1 Creating effective prompts for business and technical tasks

### Claude starts every task as a new contractor

Anthropic's own starting point is blunt. Think of Claude as a newly hired contractor who has no context about you, your task or your organization, and give it very specific instructions about exactly what you want.<sup>[1]</sup> The developer guide says the same thing in different words: Claude is "a brilliant but new employee who lacks context on your norms and workflows", and the more precisely you explain what you want, the better the result.<sup>[2]</sup>

That single idea explains most of this domain. Claude does not know that "the report" means the monthly board pack, that your readers are finance directors, or that legal bans the word "guarantee" in customer emails. If the prompt does not say it, Claude fills the gap with something plausible, which reads well and is wrong for your situation.

Anthropic gives a practical test. Show your prompt to a colleague who knows little about the task and ask them to follow it. If they would be confused, Claude will be too.<sup>[2]</sup>

### The parts of a job brief

Anthropic's help pages list the basics: explain the ask simply and clearly, include as much context as possible as if the reader has no background, break complex requests into substeps, and give feedback.<sup>[3]</sup> When you hand Claude a whole task, the Help Center adds three things to include: the outcome you want, the format you want it in, and the inputs Claude should work from (files, links or connected apps).<sup>[4]</sup> Put together, a business brief has six parts.

| Part | The question it answers | Weak version | Strong version |
|---|---|---|---|
| Purpose | What decision or action will this support? | "Summarize the survey." | "Summarize the survey so the ops director can pick two fixes at Thursday's review." |
| Audience | Who reads it, and what do they already know? | (missing) | "Regional managers. They know the process but not the survey method." |
| Inputs | What should Claude work from, and what wins if sources disagree? | "Use the attached files." | "Use the attached survey export and the 2026 service policy. The policy wins on any conflict." |
| Constraints | What must not happen? | "Be careful." | "No customer names. Don't recommend anything that needs new headcount." |
| Format | What shape should the result take? | "Make it professional." | "One page: three findings, each with the supporting numbers, then two options with trade-offs." |
| Done criteria | How will you judge it? | (missing) | "Every number must trace to a row in the export. Mark anything you couldn't verify." |

Three habits from Anthropic's prompting guidance make each part work harder.

**Explain why.** Giving the reason behind an instruction helps Claude generalize. Anthropic's example: instead of "never use ellipses", say the response will be read aloud by a text-to-speech engine that can't pronounce them.<sup>[2]</sup> In business terms, "keep it under 150 words because it goes in a push notification" beats "keep it short".

**Say what to do, not only what to avoid.** "Write in flowing paragraphs" steers better than "don't use bullet points".<sup>[2]</sup>

**Ask for the extra explicitly.** If you want Claude to go beyond the literal task (add a risk section, suggest alternatives, flag gaps), ask for it rather than hoping it infers it from a vague prompt.<sup>[2]</sup>

### Examples and structure

Examples are one of the most reliable ways to steer format, tone and structure. Anthropic recommends three to five examples that are relevant to the real task and varied enough that Claude doesn't copy an accidental pattern.<sup>[2]</sup> If every sample complaint reply you paste is about late deliveries, do not be surprised when Claude mentions delivery in a reply about billing.

When a prompt mixes instructions, background and source material, separate them clearly. The developer guide uses XML-style tags for this.<sup>[2]</sup> In everyday chat, labelled sections do the same job: a heading or tag for "Background", "Source material" and "What I need". The point is that Claude can tell the material it should analyze from the instructions it should follow.

For long documents, Anthropic's guidance is to put the long material first and the question at the end, and for long-document tasks to ask Claude to pull out the relevant quotes before answering.<sup>[2]</sup> Quoting first keeps the answer anchored to what the document actually says.

### Roles help tone, not knowledge

A role ("You are reviewing this as our privacy lead") focuses tone and perspective, and Anthropic notes that even one sentence of role makes a difference.<sup>[2]</sup> A role does not give Claude your privacy policy, the facts of the case or any authority to approve anything. If the problem is that Claude lacks information, a role does not fix it.

### Worked example: an operations lead's supplier email

Dana runs operations for a food distributor. A supplier has missed three deliveries. Her first prompt: "Write a firm email to our supplier about late deliveries." The draft is polite, generic, threatens "further action" and invents a contract clause.

Her second prompt is a brief. Purpose: get a written recovery plan by Friday without ending the relationship. Audience: the supplier's account manager, who has been helpful before. Inputs: the three delivery dates pasted below, and section 7 of the contract (pasted) on service levels. Constraints: don't threaten termination; legal hasn't approved that; don't quote any clause except section 7. Format: under 200 words, a clear ask in the first paragraph. The draft now cites the right clause, makes a specific ask and contains nothing Dana has to delete.

Nothing about the second prompt is clever. It just stops making Claude guess.

### The traps

- **Cosmetic fix for a missing input.** The output cited a clause that doesn't exist, and the option says "ask Claude to make the email more formal" or "add a persona as a contracts lawyer". The cause is that Claude never saw the contract. Supply it.
- **Adjectives instead of criteria.** "Make it comprehensive and strategic" sounds like a requirement but gives Claude nothing to test against. Look for the option that names the audience, the inputs or the check.
- **More length as quality.** A longer prompt full of restated wishes is not better. A short prompt with the purpose, inputs and done criteria beats a long one without them.
- **Trusting the model's self-report.** "Add: make sure everything is accurate" or "ask Claude to confirm it didn't invent anything" does not create accuracy. Supplying the source and asking Claude to quote it does.

## 1.2 Applying task decomposition to structure complex requests

### Split where you can check

Anthropic's help pages tell you to break complex requests into substeps, and the developer guide says to give instructions as numbered steps when order or completeness matters.<sup>[3]</sup><sup>[2]</sup> The skill the exam tests is *where* to split. The useful boundary is a point where a person can look at an intermediate result and say "yes, that's right" before more work is built on it.

A typical knowledge-work job splits like this:

1. **Gather and confirm the inputs.** Which documents, which date range, which version of the policy.
2. **Extract.** Pull the facts, quotes or figures into a table, with where each came from.
3. **Analyze.** Group, compare, find patterns, using only the extracted table.
4. **Draft** for the audience.
5. **Review** the draft against the criteria from the brief, then revise.

If step 2 is wrong you fix step 2, not the whole report. Anthropic's developer guide names the last two steps as the most common chaining pattern: generate a draft, have Claude review it against criteria, then refine it based on the review.<sup>[2]</sup>

**General practice.** Steps that don't depend on each other can run side by side (summarizing each of six interviews, for example). Steps that depend on an earlier result must wait for it. The recommendation section cannot be written before the comparison it rests on is checked.

### Decomposition is not "lots of separate chats"

Splitting a task does not mean scattering it. Chats in the same Project don't share their content with each other unless the information is added to the Project's knowledge.<sup>[5]</sup> If you extract figures in one chat and then ask for analysis in a brand-new chat, the second chat has not seen the extraction unless you bring it over. Keep dependent steps in one conversation, or carry the checked output forward deliberately. [Chapter 4](/ccao-f/read/notes/04-context-and-memory) covers when a fresh chat is the right call.

### Claude can decompose too, but you still own the outcome

In Cowork, Claude analyzes your request, creates a plan and breaks complex work into subtasks itself, and you can follow the plan and steer mid-task.<sup>[6]</sup> That does not remove your job. Claude can only decompose toward the outcome you described. If the brief never said the output is for a board that wants one page, Claude's well-organized plan produces a well-organized twelve-page report. Review the plan before you let it run, which is what the Help Center's own steps say to do.<sup>[6]</sup>

### Worked example: a project manager's vendor comparison

Priya, a project manager, has twelve vendor proposals and needs a shortlist of three. A single prompt ("Compare these proposals and recommend three") gives her a confident ranking with prices that don't match the PDFs.

She splits it. First: "For each proposal, extract price, delivery timeline, support terms and any exclusions into a table. Quote the page for each figure. Write 'not stated' if a proposal doesn't say." She checks four rows against the PDFs and finds one misread price, which she corrects. Second, in the same chat: "Using only the corrected table, score each vendor against these weighted criteria." Third: "Draft a one-page recommendation for the steering group, with the main risk for each shortlisted vendor." The final page is built on figures she has already checked.

### The traps

- **One giant prompt for a multi-stage job.** It looks efficient. It hides where the error came from and leaves nothing to check until the end.
- **Splitting by size instead of by checkpoint.** "Do the first six proposals, then the next six" divides the work but creates no point where anything is verified.
- **Right steps, wrong order.** Drafting the recommendation and *then* extracting the figures to support it is decomposition backwards. Expect an option that has all the right steps in an order that defeats the purpose.
- **Handing the plan to Claude and walking away.** Letting Claude decompose is fine. Skipping the review of its plan for consequential work is not.

## 1.3 Iterating prompts to improve output quality

### Diagnose before you rewrite

Anthropic's help pages include feedback as a basic technique: give follow-up instructions, clarify, or ask Claude to rewrite.<sup>[3]</sup> The developer guide assumes something stronger before any prompt work starts: a clear definition of success and some way to test against it.<sup>[7]</sup> Without a target, "make it better" gives Claude nothing to aim at and gives you nothing to measure.

So the first move when output disappoints is to name what is wrong, in terms of the brief:

| Symptom | Likely missing piece | Fix |
|---|---|---|
| Facts or figures are wrong or invented | Inputs | Supply the source, ask for quotes, see [Chapter 6](/ccao-f/read/notes/06-checking-what-claude-wrote) |
| Right content, wrong reader level | Audience | State who reads it and what they know |
| Misses something you needed | Requirement never stated | Add it to the brief explicitly |
| Wrong shape or length | Format | Describe the format, or give an example |
| Generic, could be about any company | Context | Add the specifics that make it yours |
| Stops early or is too brief | Scope of the ask | Ask for the rest, or ask it to continue from where it stopped |

For the last row, Anthropic suggests giving Claude the previous prompt and response when you write your next prompt, so it can pick up where it left off.<sup>[8]</sup>

### Change one thing and keep the test fixed

**General practice.** Iterate like an experiment. Keep two or three representative inputs (a typical case, a tricky case, an edge case) and rerun them each time you change the prompt. Change one meaningful thing per round. If you change the instructions and the test inputs at the same time and the result improves, you don't know which change helped. If three rounds of rewording haven't moved the result, stop polishing and look for a missing input, conflicting requirements or a task that needs a different feature or model. Anthropic's own overview notes that not every failure is best solved by prompt engineering, and that model choice can sometimes fix latency or cost more easily.<sup>[7]</sup>

Two product features make iteration cleaner. You can edit an earlier message to create a different version of the conversation, so you can try another direction without losing the previous work.<sup>[9]</sup> And when a good prompt has emerged, you can ask Claude to review the conversations that worked well and draft instructions for itself based on them. Anthropic suggests this when you can't describe the qualities you want.<sup>[10]</sup> Those instructions then belong somewhere reusable, which is [Chapter 5](/ccao-f/read/notes/05-projects-knowledge-and-connectors).

### Worked example: a marketer's product descriptions

Luis writes product descriptions for an outdoor-gear retailer. Claude's drafts are fluent but every one opens with "Embark on your next adventure". His first instinct is "be more creative". That changes the opening cliché to a different one.

Diagnosis: there is no example of the house style, and no rule about openings. He pastes three approved descriptions that start with a concrete product fact, adds "Open with the most useful fact for a buyer, as in the examples", and reruns his three test products (a tent, a stove, a pair of socks). Two are now right. The socks description still overclaims waterproofing. That is not a style issue: the spec sheet he pasted was for a different model. He fixes the input, and all three pass.

### The traps

- **Rewording a substance problem.** The output is wrong because a source is missing or out of date, and the option polishes the wording.
- **Asking Claude to grade itself.** "Ask Claude to rate its confidence from 1 to 10" or "ask whether the answer is accurate" produces a confident-sounding self-report, not evidence.
- **Changing everything at once.** A rewrite of the prompt, new test inputs and a new model in one round tells you nothing about what worked.
- **Escalating to the biggest fix first.** Switching to the most capable model, or deciding Claude "can't do this", before trying the missing example or source.

## 1.4 Adapting the prompting strategy to the task type

The guide names four task types. Each needs a different emphasis in the brief, and some point to a specific feature.

| Task type | What the brief must stress | Useful features | Typical failure |
|---|---|---|---|
| **Analysis** (data, documents, comparisons) | The exact inputs, the question, the method or criteria, and "show where each figure came from" | Higher effort or thinking for complex reasoning; file creation for spreadsheets and charts | Confident conclusions not traceable to the data |
| **Research** (finding current or external information) | The research question, what counts as a good source, the time frame, and how to cite | Web search for quick lookups; Research for multi-source investigation | Outdated or uncited claims; a quick lookup treated as a full review |
| **Drafting** (emails, reports, announcements) | Audience, purpose, tone, length, examples of the house style, facts to include | Projects for recurring style; artifacts or files for deliverables | Generic text that fits no particular reader |
| **Brainstorming** (options, angles, names) | Quantity, range, constraints that must hold, and a separate step for judging | Plain chat | Asking for "the best idea" and getting one safe answer |

### Analysis

For complex reasoning that doesn't need the web, Anthropic points to extended thinking, and for detailed document analysis or comprehensive planning it suggests raising the effort level, turning on thinking, or both.<sup>[11]</sup><sup>[12]</sup> Effort is no substitute for the brief: the same page says that whichever settings you choose, a specific prompt helps Claude use its effort well.<sup>[12]</sup> Model and effort choices are in [Chapter 3](/ccao-f/read/notes/03-choosing-the-model).

### Research

Anthropic separates the two search features by size of job. Web search suits straightforward factual questions that one or two searches can answer. Research suits comprehensive information gathering that needs five or more searches, takes a few minutes and produces a longer, cited report.<sup>[11]</sup> For research prompts, the developer guide's advice is to give clear success criteria and to ask Claude to verify information across multiple sources.<sup>[2]</sup> Tell Claude what time window matters and which kinds of sources you trust. The model only knows what it was trained on up to its cutoff, which is June 2026 for the current Haiku, Sonnet, Opus and Fable models as of November 2026, so anything recent needs search.<sup>[13]</sup>

### Drafting

Drafting is where audience and examples do the most work. State the reader, the purpose, the length and the tone, and paste two or three examples of the house style. If the same style is needed every week, put it in a Project's instructions rather than retyping it ([Chapter 5](/ccao-f/read/notes/05-projects-knowledge-and-connectors)). Editing a draft for a different audience is covered in [Chapter 8](/ccao-f/read/notes/08-shaping-output-for-the-reader).

### Brainstorming

Anthropic lists acting as a brainstorming partner that offers different viewpoints among Claude's strengths.<sup>[14]</sup> **General practice.** Brainstorming works best in two separate steps. First ask for range: "Give me 15 options across at least four different approaches, including some that seem unusual." Then, in a second turn, give the constraints and criteria and ask Claude to evaluate the list. Asking for "the best three names" in one go collapses the exploration into safe, similar ideas. Brainstorming is also where hard constraints still matter: if the budget is fixed or a brand rule applies, say so before Claude spends twelve options on ideas you can't use.

### Worked example: a teacher's four jobs in one afternoon

Ms. Okafor, a secondary-school teacher, uses Claude four ways in one afternoon. **Analyze**: she uploads quiz results and asks which questions most students missed, with the counts behind each claim. **Research**: she uses web search for recent syllabus changes and asks for links to the exam board's own pages. **Draft**: for a letter to parents she gives the reading level, three required facts and a past letter as an example. **Brainstorm**: she asks for twelve varied revision activities, then filters them in a second prompt for "no extra printing, 20 minutes or less".

### The traps

- **One prompt style for everything.** A drafting-style prompt ("write an engaging summary") applied to an analysis task produces engaging, unverifiable summaries.
- **Research for a single fact, or web search for a market study.** Both are a real feature used at the wrong size. Match the job to the feature.
- **Relying on training data for anything current.** Even a strong answer can be out of date. If recency matters, the task needs search.
## On the exam

- When the output is wrong because something is missing, the answer supplies the missing input, audience, requirement or example. Rewording, formality and personas are distractors.
- A strong prompt states purpose, audience, inputs, constraints, format and how success is judged. "Comprehensive", "strategic" and "professional" are not requirements.
- Split complex jobs at points where a person can check an intermediate result. Order matters: extract and verify before you analyze and recommend.
- Iterate by naming the defect, changing one thing and rerunning the same test cases. Don't ask Claude to grade its own accuracy.
- Examples steer format and tone best, and should be varied so Claude doesn't copy an accidental pattern.
- Web search for a quick current fact; Research for a multi-source, cited investigation; thinking and higher effort for hard reasoning on material you already have.
- Brainstorm wide first, then filter against constraints in a separate step.
- If repeated prompt changes don't help, look for a missing source, a conflicting requirement, or a different feature or model before rewriting again.

## Endnotes

1. Treat Claude as a newly hired contractor with no context and give very specific instructions. Anthropic, "Introduction to prompt design" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/7996853-introduction-to-prompt-design
2. Be clear and direct; the "brilliant but new employee" framing and the colleague test; numbered steps when order matters; explaining the reason behind instructions; asking explicitly for more; 3–5 relevant, diverse examples; separating content with tags; long documents first and quote extraction; roles; telling Claude what to do instead of what not to do; research success criteria and source verification; draft, review, refine chaining. Anthropic, "Prompting best practices" (Claude Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
3. Explain simply and clearly, include as much context as possible, break complex requests into substeps, and give Claude feedback. Anthropic, "My prompt isn't giving me a helpful answer." (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/7996857-my-prompt-isn-t-giving-me-a-helpful-answer
4. Brief Claude like a colleague: desired outcome, format and the inputs it will need. Anthropic, "Claude Cowork and chat are one Claude" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude
5. Context is not shared across chats within a project unless it is added to the project knowledge base. Anthropic, "How can I create and manage projects?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects
6. Cowork analyzes the request, creates a plan, breaks work into subtasks, shows progress and lets you steer; review Claude's approach before letting it run. Anthropic, "Get started with Claude Cowork" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork
7. Define success criteria and a way to test before prompt engineering; not every failing criterion is best solved by prompting, and model choice can fix latency or cost. Anthropic, "Prompt engineering overview" (Claude Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview
8. If responses are too brief or partial, retool the prompt and give Claude the previous prompt and response to pick up where it left off. Anthropic, "Claude's response to my prompt is too brief." (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/8114518-claude-s-response-to-my-prompt-is-too-brief
9. Editing an earlier message creates a different version of the chat so you can explore another direction without losing previous work. Anthropic, "What are artifacts and how do I use them?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them
10. Asking Claude to review conversations you valued and draft instructions for itself. Anthropic, "Adapt to new model personas after deprecations" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12738598-adapt-to-new-model-personas-after-deprecations
11. Web search for straightforward queries answerable in one or two tool calls; extended thinking for complex reasoning that doesn't need the web; Research for five or more tool calls over 1–3 minutes with a cited report; combining thinking and Research. Anthropic, "When should I use web search, extended thinking, and research?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/11095361-when-should-i-use-web-search-extended-thinking-and-research
12. Raise effort or turn on thinking for complex tasks such as detailed document analysis and comprehensive project planning; be specific whichever settings you choose. Anthropic, "Change the model, effort, and thinking settings" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings
13. Knowledge cutoffs per model, including June 2026 for Haiku 5.5, Sonnet 5.5, Opus 5.5 and Fable 5.1. Anthropic, "How up-to-date is Claude's training data?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/8114494-how-up-to-date-is-claude-s-training-data
14. Claude as a debate or brainstorming partner that generates different viewpoints. Anthropic, "What are some things I can use Claude for?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/7996845-what-are-some-things-i-can-use-claude-for
