# Chapter 2: Choosing the Feature

**Summary**: *Claude has one model picker but many ways of working: a plain chat, a Project, web search, Research, artifacts, downloadable files, Cowork tasks, Skills and connectors. Each exists for a particular shape of job. The exam rewards matching the shape: a one-off question goes in a chat, recurring work with the same files goes in a Project, a quick current fact uses web search, a multi-source investigation uses Research, something you'll edit and share becomes an artifact or a file, and a multi-step task you want done while you step away goes to Cowork. The wrong answers are real features used at the wrong size.*

This chapter covers objective 3.1, "Select appropriate Claude product features (Projects, research mode, chat, artifacts)", at the "which one" level. Setting up a Project, its knowledge and its connectors is in [Chapter 5](/ccao-f/read/notes/05-projects-knowledge-and-connectors). Choosing the model is in [Chapter 3](/ccao-f/read/notes/03-choosing-the-model). Choosing whether output should be inline text, an artifact or structured data, as an output-curation decision, is in [Chapter 8](/ccao-f/read/notes/08-shaping-output-for-the-reader).

A warning before the details. Claude's product surface changes quickly. As of November 2026, Anthropic is rolling out a "new Claude experience" that merges chat and Cowork into one conversation, starting with Pro, Max and Ultra and reaching Team and Enterprise where an admin turns it on.<sup>[1]</sup> Some menus differ between the two experiences. This chapter teaches the job each feature does, which stays stable, and flags availability facts that may move.

## Start from the shape of the job

Before naming a feature, answer four questions about the work.

1. **Is it one-off or recurring?** Recurring work with the same background wants persistent context.
2. **Does it need information Claude doesn't have?** Current events, your files, your apps.
3. **What is the output?** An answer you read once, or a deliverable you'll edit, share or download.
4. **How many steps, and do you need to be there for them?** A single reply, or a task that runs for a while and touches files or apps.

| Job shape | Start with | Why |
|---|---|---|
| A one-off question, explanation or quick draft | **Chat** | Nothing needs to persist |
| Recurring work that reuses the same documents and instructions | **Project** | Knowledge and instructions apply to every chat in it |
| A current fact that one or two searches can answer | **Web search** | Fast, cited, cheap |
| A question that needs many sources pulled together into a cited report | **Research** | Multi-search investigation built for synthesis |
| A self-contained deliverable you will edit, reuse or share | **Artifact** | Opens beside the chat; editable, saved, shareable |
| A Word, Excel, PowerPoint or PDF file to download | **File creation** (code execution) | Produces real files with working formulas and formatting |
| A multi-step task that runs while you step away, or that needs local files, a browser or scheduled runs | **Cowork** (or a task in the new Claude experience) | Plans, executes and delivers finished work |
| A repeatable procedure you want applied the same way wherever it comes up | **Skill** | Loads when relevant, across chats and Projects |
| Live data in your email, calendar, drive or work apps | **Connector** | Reads (and can act in) the source with your permissions |

The rest of the chapter takes each row in turn and shows the trap next to it.

## Chat: the default for bounded work

A plain chat is right when the job is self-contained: explain a concept, draft one email, rewrite a paragraph, think through a decision. You supply the context in the message. When the conversation ends, nothing has to be maintained.

The trap is the reverse: building a Project, a Skill and a connector for something you will do once. It is not wrong, just wasted effort. The other trap is staying in chat for work that clearly recurs, so you paste the same style guide and the same policy every Monday. That is the signal to move to a Project.

## Projects: persistent context for recurring work

A Project is a self-contained workspace with its own chat history and knowledge base. You upload documents and set instructions, and Claude uses both in every chat inside that Project.<sup>[2]</sup> Projects are available on every plan, including Free, where you can create up to five, as of November 2026.<sup>[2]</sup> On paid plans, when the knowledge approaches the context limit, Projects switch automatically to a retrieval mode (RAG) that expands capacity by up to ten times.<sup>[2]</sup> On Team and Enterprise plans, Projects can be shared with colleagues with view or edit permission.<sup>[2]</sup>

Two Project facts change which feature is right:

- **Chats inside a Project don't see each other.** Context is not shared across chats in a Project unless the information is added to the Project's knowledge.<sup>[3]</sup> A Project gives every chat the same starting point, not a shared running conversation.
- **Projects are static background; Skills are procedures.** Anthropic draws the line itself: Projects provide background knowledge that is always loaded when you start chats in them, while Skills provide procedures that activate when needed and work everywhere in Claude.<sup>[4]</sup>

Use a Project when the *same material and the same rules* apply to a stream of work: a policy team answering staff questions from the current handbook, a marketing team writing in a house style, a course team building lessons from a fixed syllabus.

## Web search versus Research

Both features reach the web. They differ in the size of the job.

| | Web search | Research |
|---|---|---|
| Best for | Straightforward factual queries answerable with one or two searches: a company detail, recent news, today's figure<sup>[5]</sup> | Comprehensive gathering that needs five or more searches over one to three minutes, with an in-depth report from many sources<sup>[5]</sup> |
| Sources | The live web, with citations in every response<sup>[6]</sup> | The web plus your connected tools, such as Gmail, Calendar and Docs, on web and Desktop<sup>[7]</sup> |
| Plans | Available on current models; on Team and Enterprise, an owner must first enable it for the organization<sup>[6]</sup> | Paid plans (Pro, Max, Ultra, Team, Enterprise), on web, Desktop and Mobile, and web search must be on<sup>[7]</sup> |
| Usage | Counts toward your usage limits<sup>[6]</sup> | Same limits as normal chat, but uses them faster because it retrieves many sources<sup>[7]</sup> |

Research details that make good exam stems (all as of November 2026):

- **It picks its own model.** Research runs on Claude Opus 5.5 and falls back to Opus 4.8 when needed, whichever model you selected for the chat. On Team and Enterprise, if an admin has turned off both of those models for your role, Research won't work.<sup>[7]</sup>
- **Mobile skips connectors silently.** Research started in Claude Mobile only searches the web and doesn't use your connectors, with no error to tell you. Start it on web or Desktop to include them.<sup>[7]</sup>
- **It can use connector tools without asking each time** during the research run.<sup>[7]</sup>
- **In the new Claude experience** there is no web search toggle (Claude searches when it helps) and Research is started with /deep-research or from the "+" menu.<sup>[1]</sup>

Anthropic also places extended thinking beside these two: use it for hard reasoning that doesn't need the web, such as working through a maths problem or analyzing a concept from several angles. Thinking and Research can be combined when a research job also needs careful planning.<sup>[5]</sup>

### The traps

- **Research for a single fact.** "What is the current base rate?" does not need a multi-minute investigation that burns usage faster.
- **Web search for a market study.** "Compare our five main competitors' pricing, positioning and recent launches" is a Research job. One or two searches will give a thin, partial answer.
- **Search for something that needs no search.** If the answer is in the document you just uploaded, or it is reasoning rather than lookup, web search adds cost and noise. Anthropic suggests telling Claude not to search when you don't need current information.<sup>[8]</sup>

## Artifacts: deliverables that live beside the chat

An artifact is "anything Claude makes for you that you'd put in front of someone": a document, a deck, a design, a dashboard or a small interactive tool. It opens beside the conversation, and you can edit it, come back to it and share it.<sup>[9]</sup> Claude creates one when the content is significant and self-contained (typically over 15 lines), likely to be edited or reused outside the conversation, and stands on its own.<sup>[9]</sup> Everything you make is saved to the Artifacts tab.<sup>[9]</sup>

As of November 2026, artifacts are available on every plan, and the Docs, Slides and Design templates are on all plans. Some templates and capabilities are narrower: Dashboards (beta) needs a paid plan, Motion (beta) is Team and Enterprise only, and connecting apps to an artifact or storing data in one needs a paid plan.<sup>[9]</sup> Artifacts require the code execution and file creation capability to be on.<sup>[9]</sup> Template artifacts export to common formats: docs to Word, PDF, Markdown or Google Docs; decks to PowerPoint, PDF or Google Slides.<sup>[9]</sup>

Use an artifact when the output is a thing rather than an answer: a one-page brief you'll keep refining, a slide deck for Monday, a checklist tool your team will use. Keep inline text for a short answer you'll read once.

Two details worth knowing:

- **Claude doesn't generate photos or illustrations** the way image-generation tools do. It can build diagrams, charts and interactive visuals with HTML and SVG.<sup>[10]</sup> A request for a photorealistic product image is not a Claude feature-choice question; it needs a different tool.
- **Shared storage is visible to others.** An artifact can store data personally or in shared storage everyone using it sees. Whoever builds it decides which, so check before entering anything sensitive.<sup>[9]</sup>

## File creation: real Office files

With code execution and file creation on, Claude can create Excel spreadsheets with working formulas, PowerPoint decks, Word documents and PDFs that you download or save to Google Drive, and can analyze uploaded data files such as CSVs.<sup>[11]</sup> It is available on all plans, on by default for Free, Pro, Max and Ultra, and on by default for Team organizations with owner control, as of November 2026.<sup>[11]</sup> Creating files uses more of your usage limit than a normal chat.<sup>[11]</sup> Anthropic advises being specific about structure, content and formatting and expecting to review and refine the output.<sup>[11]</sup>

The choice between an artifact and a file is mostly about where the work goes next. If the team will open it in Excel or attach it to an email, ask for the file. If you will keep iterating with Claude and share a link, an artifact fits. One subtlety on Google files: asking for a generic "doc" or "deck" creates a local file; to get a Google Doc, Sheet or Slides file you must ask for it by name or paste a Google link, with the Google connectors on.<sup>[12]</sup>

## Cowork: hand over a whole task

Cowork brings the agentic approach of Claude Code to knowledge work without a terminal. Instead of answering one prompt at a time, Claude takes on a multi-step task, plans it, breaks it into subtasks, and delivers finished outputs such as formatted documents, organized files and synthesized research.<sup>[13]</sup> As of November 2026 it is available on paid plans only: on Claude Desktop for all paid plans, and on web and mobile for Pro, Max, Ultra and Team (beta on Team), with Enterprise where an owner enables it.<sup>[13]</sup>

What makes Cowork the right choice:

- **The work has many steps** and you want the result, not a conversation about it.
- **You want to step away.** Cloud sessions keep working after you close your laptop.<sup>[13]</sup>
- **It touches your computer.** In Claude Desktop, Claude can read and write files in folders you grant, use a browser, and (in beta on some plans) use apps on your computer. Those need the Desktop app open.<sup>[13]</sup>
- **It recurs on a schedule.** Scheduled tasks run in the cloud without your computer on.<sup>[13]</sup>

How much Claude checks with you is a setting, and it is testable. In the current Cowork experience there are three modes: **Manual** (Claude asks before actions), **Auto** (Claude proceeds but reviews each action for safety and blocks unsafe ones) and **Skip** (nothing pauses or checks; only for work you completely trust).<sup>[13]</sup> In the new Claude experience the choice is Auto (default on Pro, Max, Ultra and Team) or Manual (default on Enterprise).<sup>[1]</sup> Anthropic's advice for work with real consequences (money, messages sent as you, important files) is to stay close, review what Claude does, or switch to manual approval.<sup>[13]</sup> Claude also asks explicit permission before permanently deleting files in Cowork.<sup>[13]</sup>

### The traps

- **Cowork for a quick question.** Multi-step tasks use more usage than a quick answer. Anthropic's own tip is to tell Claude when you only need a quick answer, not a file or deliverable.<sup>[13]</sup>
- **Skip mode for anything that sends or deletes.** It is a real mode, and it is the wrong one when the task emails customers.
- **Expecting local-file work with the Desktop app closed.** Cloud sessions continue; tasks that need local files, the browser or computer use need the app open.<sup>[13]</sup>

## Skills: a procedure Claude applies when relevant

Skills are folders of instructions, scripts and resources that Claude loads when they're relevant, so it performs a specialized task the same way each time: applying brand guidelines to a deck, structuring meeting notes in the company format, running a team's analysis routine.<sup>[4]</sup> They are available on all plans and require code execution to be on.<sup>[4]</sup> Anthropic's built-in skills for Excel, Word, PowerPoint and PDF are used automatically when relevant.<sup>[4]</sup> On Team and Enterprise, owners can provision skills for everyone.<sup>[4]</sup>

Anthropic's own comparisons are the cleanest way to choose:<sup>[4]</sup>

| If you need… | Use | Not |
|---|---|---|
| Background documents always available for one body of work | Project | Skill |
| A procedure applied the same way wherever the task comes up | Skill | Project |
| Broad preferences for every conversation (tone, role, format) | Custom instructions | Skill |
| Access to an external service or its data | Connector | Skill |

Skills and connectors work together: a connector gives Claude access to a tool, and a skill teaches Claude how to use it well.<sup>[4]</sup> Building and maintaining skills is in [Chapter 5](/ccao-f/read/notes/05-projects-knowledge-and-connectors).

## When the answer is "not a feature at all"

Some stems describe a need no built-in feature meets: an automated pipeline that runs every hour inside the company's systems, a custom app on top of Claude, a connector to an internal tool that has no MCP server yet. The Associate move is to recognize the boundary and bring in a developer or architect, not to force a Project or Cowork task to act like software. Custom connectors, for instance, connect Claude to remote MCP servers that must be reachable from Anthropic's cloud, and building one is developer work.<sup>[14]</sup> See [Chapter 10](/ccao-f/read/notes/10-fitting-claude-into-the-workflow) for how to hand that off.

## Worked example: one communications team, five features

The internal communications team at a hospital network has a week of mixed work.

- A manager asks what "SBAR" stands for. **Chat**, answered in one line.
- Every week the team drafts the staff newsletter in a house style from the latest policy updates. A **Project** holds the style guide and the current policy pack, with instructions on tone and structure.
- Before a briefing, someone needs today's figure for local flu admissions. **Web search**, with a citation to check.
- Leadership wants a review of how five peer hospital networks communicated their nurse-retention programs. **Research**, on Desktop so it can also pull the team's own past briefings from Google Drive.
- The newsletter needs a printable PDF and a short slide deck for the all-hands. **File creation** for the PDF, a **Slides artifact** for the deck they'll keep refining.

Nobody in this example needed Cowork. If the team later wanted the newsletter assembled every Friday from a shared folder and a Slack channel, a scheduled **Cowork** task would be the step up, with manual approval before anything is sent.

## On the exam

- Match the feature to the job's shape: one-off → chat; recurring with the same material → Project; quick current fact → web search; multi-source cited report → Research; editable deliverable → artifact; Office file → file creation; multi-step hands-off task → Cowork; repeatable procedure → Skill; live app data → connector.
- Research is a paid-plan feature, needs web search on, uses limits faster, runs on Opus 5.5 regardless of your selected model, and skips connectors when started on mobile (as of November 2026).
- Chats in a Project don't share content with each other; Projects give every chat the same knowledge and instructions.
- Projects are background knowledge, Skills are procedures, custom instructions are broad preferences, connectors are access.
- Claude builds diagrams and charts but doesn't generate photos.
- For Cowork work with real consequences, prefer manual approval and stay close. Skip mode is for fully trusted tasks only.
- If the need is software (pipelines, integrations, custom connectors), escalate to a developer rather than stretching a feature.

## Endnotes

1. The new Claude experience merging chat and Cowork, rollout by plan, no web search toggle, Research via /deep-research or the "+" menu, Auto and Manual permission defaults. Anthropic, "Claude Cowork and chat are one Claude" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude
2. Projects as self-contained workspaces with knowledge and instructions, availability on all plans with five projects on Free, RAG on paid plans up to 10x, Team and Enterprise sharing. Anthropic, "What are projects?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/9517075-what-are-projects
3. Context is not shared across chats within a project unless added to the knowledge base. Anthropic, "How can I create and manage projects?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects
4. Skills as folders of instructions loaded dynamically, plan availability and code execution requirement, Anthropic and custom and organization skills, and the comparisons with Projects, MCP and custom instructions. Anthropic, "What are skills?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12512176-what-are-skills
5. When to use web search, extended thinking and Research, including the one-or-two versus five-or-more tool call guidance. Anthropic, "When should I use web search, extended thinking, and research?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/11095361-when-should-i-use-web-search-extended-thinking-and-research
6. Web search models, owner enablement on Team and Enterprise, citations in every response, and usage. Anthropic, "Enable and use web search" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/10684626-enable-and-use-web-search
7. Research availability, web search requirement, connectors used automatically, mobile limitation, usage, and the models Research runs on. Anthropic, "Use research on Claude" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/11088861-use-research-on-claude
8. Turn off tools you don't need and ask Claude not to search the web when you don't need current information. Anthropic, "How do usage and length limits work?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work
9. What artifacts are, when Claude creates one, plan availability of templates and capabilities, code execution requirement, the Artifacts tab, export formats and shared storage. Anthropic, "What are artifacts and how do I use them?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them
10. Claude doesn't generate photos or illustrations but builds diagrams, charts and interactive visuals. Anthropic, "Can Claude produce images?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/9002504-can-claude-produce-images
11. File types Claude creates, availability and defaults by plan, usage impact, and advice to be specific and review. Anthropic, "Create and edit files with Claude" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude
12. Asking for a generic doc or deck creates a local file; name Google or paste a link to get a Google file. Anthropic, "Use Google Workspace connectors" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/10166901-use-google-workspace-connectors
13. Cowork's purpose, availability by plan and surface, cloud sessions, local access through Desktop, scheduled tasks, Manual, Auto and Skip modes, deletion protection, and usage tips. Anthropic, "Get started with Claude Cowork" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork
14. Custom connectors connect to remote MCP servers reached from Anthropic's cloud, and can connect to services not verified by Anthropic. Anthropic, "Get started with custom connectors using remote MCP" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
