# Chapter 9: Finding and Designing Use Cases

**Summary**: *A good use case starts with the work, not the tool. Before anyone writes a prompt, an Associate can say what the task is, what inputs it needs, who checks the result and what a wrong answer costs. Claude is then useful three ways: as a thinking partner that finds gaps in requirements, as a researcher and process analyst, and as a fast prototyping tool. In every case the person keeps the decisions, and anything that needs real software goes to a developer.*

This chapter covers Domain 4 objectives 4.1, 4.2 and 4.3. Fitting the finished design into a team's routine, and explaining it to stakeholders, is in [Chapter 10](/ccao-f/read/notes/10-fitting-claude-into-the-workflow). Which feature to pick at the "which one" level is in [Chapter 2](/ccao-f/read/notes/02-choosing-the-feature).

A note on sources. Anthropic's pages describe what Claude's features do. They say very little about how to run a requirements workshop or score a process for automation. Where this chapter gives that kind of advice it is marked **General practice**. On the exam, items built on general practice still have a defensible key, but the key never depends on an invented Claude fact.

## What Claude is good at, in Anthropic's own words

Anthropic's short list of things to use Claude for is a good baseline, because the exam expects you to match a task to a real strength rather than to marketing. Claude can write across formats and styles, help you learn something new, summarize long text, write and explain code, act as a debate or brainstorming partner that offers different viewpoints, translate, and interpret images such as charts.<sup>[1]</sup> Two details on that page are easy to miss and testable:

- Claude is best at English because of its training data. It knows more than a dozen languages and translates between them "to varying degrees of success". Portuguese, French and German are named as especially strong.<sup>[1]</sup> A translation into a less common language for a public notice needs a fluent human check.
- Brainstorming is listed as a strength. That means generating options and viewpoints, not choosing among them for you.

Read every use case through that list. A request that is really "summarize these 40 interview notes and pull out the themes" plays to a strength. A request that is really "decide which supplier we should sign with" is a decision. Claude can prepare the comparison. A person decides.

## 4.1 Analyzing requirements and use cases

### What good practice looks like

**General practice.** Requirements fail in predictable ways: the goal is vague, two stakeholders want different things, a constraint (budget, policy, deadline, data access) is missing, or nobody said how success will be measured. Claude is very good at finding those gaps if you ask it to look for them, and very good at hiding them if you don't, because it fills silence with plausible assumptions.

So the strong pattern is to use Claude as a requirements reviewer, not a requirements author:

1. Give Claude the raw material: meeting notes, the request email, the current process document, stakeholder comments.
2. Ask for the gaps, not the answer. "List every assumption you would have to make to build this. List the questions we must answer first. Flag any place where two people asked for different things."
3. Take the questions back to the people who own the answers.
4. Only then ask Claude to draft the requirement, the acceptance criteria or the project brief, using the confirmed answers.

The output of step 2 is a list of open questions with owners. That list is worth more than a polished draft built on guesses.

### A use-case screen

**General practice.** Before a team commits to "let's use Claude for X", run a short screen. It sorts candidates quickly and gives you language for the exam's "which is the best first use case" items.

| Question | Good sign | Warning sign |
|---|---|---|
| Is the input available, and are we allowed to use it here? | Documents the team already owns, approved for this workspace | Data that policy keeps out of this tool or plan (see [Chapter 11](/ccao-f/read/notes/11-responsible-use-privacy-and-policy)) |
| Can a person check the output quickly? | A draft someone reads anyway, a summary of documents they can open | An answer nobody can verify without redoing the work |
| What does a wrong answer cost? | A rewrite | Money, a person's rights, a public statement, a safety issue |
| How often does it happen? | Weekly or daily, same shape each time | Once a year, different every time |
| Is the step itself sound? | The process is fine, just slow | The step exists to patch a broken upstream process |

The last row matters most. If analysts spend hours each week explaining why two spreadsheets disagree, a faster explanation is not the fix. The fix is upstream. A useful frame is four choices for each step: **assist** (Claude drafts, a person operates), **automate** (a bounded, reversible step runs on its own under policy), **redesign** (remove or restructure the step), or **reject** (data, consequence or policy makes Claude the wrong tool).

### Workplace example

A school's operations lead is asked to "use Claude to sort out the field trip permission process". She pastes in the current form, three emails from teachers, and the parent complaint that started it. She asks Claude to list what each teacher wants, where they conflict, and what it would need to know to redesign the form. Claude finds that two teachers want a paper backup and one wants it removed, that nobody has said who chases late forms, and that the complaint is about a deadline, not the form. She takes those three questions to the head teacher. The redesign that follows is small and correct, because the requirement was fixed before the drafting started.

### The traps

- **Cosmetic fix for a substance problem.** The draft brief "reads vague", so the option says to ask Claude to make it more detailed and professional. A longer brief built on unconfirmed assumptions is still wrong. The fix is to surface the assumptions and confirm them with stakeholders.
- **Trusting the model's self-report.** "Ask Claude whether the requirements are complete." Claude cannot know what your stakeholders didn't tell it. It can list likely gaps. Only the stakeholders can close them.
- **Right step, wrong order.** "Have Claude draft the full specification, then circulate it for comments." Plausible, and common, but it anchors everyone on Claude's guesses. Questions first, draft second.
- **Overreaction.** "The requirements are unclear, so Claude is not suitable for this project." Unclear requirements are exactly where Claude helps, as a gap-finder.

## 4.2 Research, planning and process optimization

### Pick the research tool by the question

Claude has several ways to go and find things. Anthropic documents what each is for, and the exam tests whether you know the difference.

| Need | Tool | What the docs say |
|---|---|---|
| A quick fact from the web | Web search in a normal chat | Covered in [Chapter 2](/ccao-f/read/notes/02-choosing-the-feature) |
| A deep, multi-angle question | **Research** | Runs multiple searches that build on each other, decides what to look into next, and works through open questions. Searches the web and connected tools such as Google Workspace. Paid plans only<sup>[2]</sup> |
| "Where is our policy on X?" across company tools | **Enterprise search** ("Ask Your Org" project) | A pre-configured project for searching your organization's connected sources with instructions maintained by Anthropic. Team and Enterprise only<sup>[3]</sup> |
| How the team itself uses Claude | **Smart reports** | Analysis of a team's Claude sessions: workstreams, cost, pain points, recommendations. Enterprise only, off by default<sup>[4]</sup> |

Details that decide exam items:

- **Research needs web search turned on.** It can use connector tools automatically during a run, without asking for approval each time. Started from Claude Mobile, it searches only the web and skips connectors, with no error shown. To include connectors, start it on the web or in Claude Desktop.<sup>[2]</sup>
- **Research costs more.** It is subject to the same limits as normal chats but can use them up faster, because it retrieves many sources. As of November 2026 it runs on Claude Opus 5.5, falls back to Opus 4.8, and uses those models whichever model you picked for the chat.<sup>[2]</sup>
- **Enterprise search is for fast retrieval, Research is for deep investigation.** Anthropic's own comparison says enterprise search is "optimized for quick knowledge retrieval" from internal sources, while Research is for complex, multi-step projects that take longer and may use more messages.<sup>[3]</sup>
- **Enterprise search is permission-aware.** Each person sees only what they can already access in the source system, so two colleagues can ask the same question and get different answers. The exception is a custom connector set up with one shared credential, where everyone sees what that credential can reach.<sup>[3]</sup>
- **An Owner must set enterprise search up first**, choosing at least a Documents and a Chat connector. Users then authenticate with their own accounts. It works on Claude Desktop but not on Claude Mobile.<sup>[3]</sup>
- Anthropic's tips for both are plain good prompting: name the sources, give a date range, and break a complex query into one source at a time before asking for a synthesis.<sup>[3]</sup>

### Planning

**General practice.** Claude is a good planning partner when the plan has known parts: a project timeline from a list of tasks and dependencies, a communications calendar, an event run-of-show, a risk register seeded from past project reviews. Ask it to list dependencies and risks explicitly, and to say which dates it assumed. Then check those assumptions with the people who own them. Anthropic's research page uses planning a team offsite as its example, which is a fair picture of the scale where Research earns its extra usage.<sup>[2]</sup>

### Process optimization

**General practice.** Map the process as it really runs before changing it. Who starts it, what inputs arrive, where people use judgment, where time is lost, who approves the result. Claude can help build that map from interview notes or a shared process document, and can suggest which steps are candidates for assist, automate, redesign or reject. It cannot see the informal checks people do without writing them down. Those checks often carry the real quality control, so ask the people who do the work.

For teams already using Claude, **smart reports** turn this into evidence. An admin picks a team, a time range of up to 28 days and the products to cover. Claude reads a sample of transcripts and reports workstreams, cost per type of output, the most common pain points (for example, a connector that wasn't set up, output that didn't match the ask, or rework loops), and recommendations, including recurring workflows worth turning into shared skills.<sup>[4]</sup> Three facts are worth memorizing:

- Smart reports are on Enterprise plans, off by default, and each organization gets up to 10 reports a month at no charge (as of November 2026).<sup>[4]</sup>
- Anthropic says they "aren't designed and should not be used for evaluating individual performance or making employment decisions".<sup>[4]</sup> A smart report is an adoption and investment tool.
- Names are hidden by default. Attribution to individuals is a separate setting, off by default, and each reveal is logged. Sessions on restricted topics, such as health, union activity or personal life, are used only in aggregate.<sup>[4]</sup>

### Workplace example

A marketing manager wants to know why campaign briefs take two weeks. She asks the enterprise search project to "search Slack and Google Drive for discussions about brief approvals in the last quarter" and gets a cited answer showing that most delay sits in legal review. That is a quick retrieval question, so enterprise search is the right tool. She then wants to know how three competitors run their campaign approval process. That is an open, multi-source question, so she switches to Research on her desktop, not her phone, because she also wants it to pull from the team's Google Docs.

### The traps

- **Real feature, wrong job.** Using Research for "what's our expense policy?" works, but it is slower and costlier than enterprise search. Using enterprise search for a market scan misses the web.
- **Assuming everyone sees the same results.** A manager says enterprise search "proves" a document doesn't exist. It only proves *she* can't see one.
- **Research on mobile for internal sources.** It quietly skips the connectors. The fix is the surface, not the prompt.
- **Automating a broken step.** The option speeds up a step that should be removed. Redesign beats automation when the step is waste.
- **Smart reports as a performance tool.** Any option that uses a smart report to rank or discipline individuals is wrong on Anthropic's own terms.

## 4.3 Supporting solution design, development and iteration

### Prototype, then test on real cases

The Associate's design work is usually a document, a spreadsheet, a template, a small tool or a dashboard. Claude can produce all of them. Code execution and file creation are available on every plan, on web, desktop and mobile, and Claude can create and edit Excel, Word, PowerPoint and PDF files in a sandbox.<sup>[5]</sup> Anthropic's own advice is to start with simple tasks, be specific about structure, content and formatting, and expect to review and refine the output.<sup>[5]</sup>

**General practice.** Treat the first version as a prototype. Run it on three to five real past cases, including an awkward one, before anyone relies on it. Write down what "good" looked like for those cases before you look at Claude's output, so you aren't grading on impression. Iterate on the instructions or the template, not just the single output. How to judge the output is covered in [Chapter 6](/ccao-f/read/notes/06-checking-what-claude-wrote).

### Dashboards: check the query, not just the chart

Claude Dashboards turn a plain-language question about company data into a dashboard. You connect a data warehouse (such as BigQuery or Snowflake) or another connected app such as Salesforce. Claude writes a SQL query for each chart, runs it, and each chart shows its query and when its data was last refreshed.<sup>[6]</sup> The design rules from that page:

- **Ask the question, not the chart.** "How do this month's signups by channel compare with last month's?" works better than "a signups chart". Name the table or app if you know it.<sup>[6]</sup>
- **Open the query.** If the number looks wrong, open the chart's query to see what is being counted, and tell Claude what to change.<sup>[6]</sup> You don't need to write SQL to notice that a "revenue" chart is counting orders, or that the date range is wrong.
- **Dashboards are for quick, exploratory questions.** When a question needs deeper analysis, Anthropic says to send the dashboard to another tool and continue there.<sup>[6]</sup>
- As of November 2026 Dashboards are in beta on Pro, Max, Ultra, Team and Enterprise. On Enterprise they are off until an Owner turns them on. They start private to you.<sup>[6]</sup>

### Package what works

When a prototype becomes a repeated procedure, a **skill** is the usual home for it. Skills are folders of instructions, scripts and resources that Claude loads when relevant, so a team's procedure is applied the same way every time. Anthropic's examples include applying brand guidelines, following company email templates and structuring meeting notes. Simple skills need no code, only written instructions.<sup>[7]</sup> On Team and Enterprise plans, Owners can provision skills to everyone.<sup>[7]</sup> Smart reports name recurring workflows that are good skill candidates.<sup>[4]</sup> Setting skills and Projects up properly is [Chapter 5](/ccao-f/read/notes/05-projects-knowledge-and-connectors).

### Know where the Associate's job stops

The Associate builds with Claude's built-in features. When the design needs something those features don't provide (an integration with an internal system that has no connector, an automated pipeline, a customer-facing chatbot, a custom connector), the right move is to write a clear requirement and hand it to a developer or architect. A crisp handoff (the goal, the inputs, the expected output, the edge cases you found in testing, who will review) is a real Associate deliverable.

### Workplace example

A finance operations analyst asks Claude for a dashboard of overdue invoices by region. The total for one region looks too high. She opens the chart's query and sees that it counts invoices that are overdue *or* disputed. She tells Claude to exclude disputed ones, and the number now matches the ledger for a month she checks by hand. Her manager then asks for an automated nightly feed of the dashboard into the ERP system. That is an integration, not a dashboard question, so she writes up what the feed must contain and passes it to the systems team.

### The traps

- **Trusting the picture.** A clean chart is not a correct chart. The decisive step is to check what the query counts against a figure you know.
- **Cosmetic iteration.** Changing colours, titles or wording when the problem is that the prototype fails on real cases.
- **Testing on the happy path.** A template that works on the example Claude wrote is not tested. Use real past cases, including a hard one.
- **Building past your remit.** "Ask Claude to write the integration code and deploy it yourself" is the wrong answer for an Associate when the task needs production software. Escalate with a clear requirement.
- **Dropping the tool after one bad output.** One wrong chart means you check and fix the query, not that dashboards are unreliable.

## On the exam

- Use Claude to **find gaps in requirements** (assumptions, conflicts, open questions), then confirm them with stakeholders before drafting.
- A step that only exists to patch an upstream problem should be **redesigned**, not automated.
- **Enterprise search** is for quick retrieval of internal knowledge, and it is permission-aware. **Research** is for deep, multi-step questions, costs more usage, and skips connectors when started on mobile.
- **Smart reports** measure adoption, cost and friction for a team. They must not be used to judge individuals.
- For a **dashboard**, ask the business question and check each chart's query against a known figure.
- Prototype on **real past cases**, including a hard one, with success criteria written before you look.
- Turn a repeated, proven procedure into a **skill**. Hand anything that needs custom software or integration to a developer.
- Claude's English is strongest. Translations into other languages for real audiences need a fluent human check.

## Endnotes

1. Claude's main uses: writing, learning, summarizing, coding, brainstorming and debate, translation (best in English; Portuguese, French and German named as strong) and image analysis. Anthropic, "What are some things I can use Claude for?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/7996845-what-are-some-things-i-can-use-claude-for
2. Research behaviour, paid-plan availability, the web search requirement, automatic connector use, mobile web-only limitation, faster use of limits, the models it runs on, and the offsite-planning example. Anthropic, "Use research on Claude" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/11088861-use-research-on-claude
3. Enterprise search: the "Ask Your Org" project, Team and Enterprise availability, Owner setup with Documents and Chat connectors, permission-aware results and the shared-credential exception, no mobile support, best practices, and the comparison with Research. Anthropic, "Use enterprise search" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12489464-use-enterprise-search
4. Smart reports: Enterprise availability, off by default, 10 reports a month, scope options, report sections including pain points and skill recommendations, attribution controls, restricted topics, and the warning against use for individual performance or employment decisions. Anthropic, "Get started with smart reports" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/16893491-get-started-with-smart-reports
5. Code execution and file creation availability on all plans, sandboxed file creation, and advice to start simple, be specific and review outputs. Anthropic, "Create and edit files with Claude" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude
6. Claude Dashboards: data sources, per-chart SQL queries and refresh times, tips for asking, checking the query, use for exploratory questions, beta availability, Enterprise off by default, private by default. Anthropic, "Get started with Claude Dashboards" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/17454700-get-started-with-claude-dashboards
7. Skills as folders of instructions, scripts and resources loaded when relevant; custom skill examples; no-code skills; organization-provisioned skills. Anthropic, "What are skills?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12512176-what-are-skills
