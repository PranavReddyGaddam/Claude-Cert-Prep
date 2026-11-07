# Chapter 10: Fitting Claude into the Workflow

**Summary**: *Adding Claude to a team's routine is a design decision about ownership, not a feature toggle. Decide whether Claude assists a person, runs a bounded step on its own, or prompts a redesign of the step. Put human review where a mistake would be expensive or hard to undo. Use the built-in features (Projects, Cowork, scheduled tasks, skills, connectors, shared artifacts) to carry the routine. Then explain it to stakeholders with evidence: what it does, what it costs, what stays human, and what it can still get wrong.*

This chapter covers objectives 4.4 and 4.5. Finding the use case and building the first version is [Chapter 9](/ccao-f/read/notes/09-finding-and-designing-use-cases). When a human must review output is covered in depth in [Chapter 7](/ccao-f/read/notes/07-when-a-human-must-review). The safety settings for Cowork and Chrome are in [Chapter 11](/ccao-f/read/notes/11-responsible-use-privacy-and-policy).

## 4.4 Integrating Claude into existing workflows

### Three ways in: augment, automate, redesign

**General practice.** Every step you touch gets one of three treatments:

- **Augment.** A person still does the step and owns the result. Claude drafts, summarizes, checks or suggests. Most first integrations should be this.
- **Automate.** A bounded step runs without a person in the moment, on a schedule or a trigger. This fits work that is repetitive, low in consequence and easy to reverse, and where someone reviews the results afterwards.
- **Redesign.** Claude's arrival is the moment to remove a step, merge two, or change who does what. If a weekly status report exists only because the project tool is out of date, fix the tool and let Claude summarize the tool.

Two questions place a step on that scale: how bad is it if the result is wrong, and can it be undone cheaply before anyone is harmed?

| If wrong, the consequence is... | ...and it can be reversed | Design direction (General practice) |
|---|---|---|
| Low | Easily | Automate, and review results regularly |
| High | Easily | Claude prepares or stages; a person approves before release |
| Low | Not easily | Narrow the scope, add a confirmation step |
| High | Not easily | Keep a person making the decision, with Claude in support |

A draft saved to a folder is low and reversible. A message sent to 3,000 customers is high and irreversible. The same prompt can sit in either row depending on what happens to the output next.

### Handoffs are where integrations break

**General practice.** The most common failure is not a bad prompt. It is a gap in ownership: the person who used to assemble the report assumes someone else now checks it, and that person assumes it was already checked. For every step, write down:

- who owns the result,
- what Claude receives (which files, which sources, how fresh),
- what "done" looks like,
- who reviews it, and what they are checking for,
- what happens when the input is missing or Claude's output fails the check (the fallback, which a current team member must be able to run by hand).

A review request should name the decision. "Please review" is weak. "Confirm the two items marked unverified can go in the external newsletter; everything else matched the source" is something a reviewer can actually do.

### The building blocks Anthropic provides

The exam expects you to know which built-in feature carries which part of a routine. Projects, connectors and instructions are covered in [Chapter 5](/ccao-f/read/notes/05-projects-knowledge-and-connectors). The workflow-specific pieces are below.

**Cowork.** Cowork brings Claude Code's agentic way of working to knowledge work without a terminal. You describe an outcome, Claude makes a plan, breaks the work into subtasks, runs code in an isolated environment on Anthropic's servers, and delivers finished files such as spreadsheets with working formulas, presentations and formatted documents. You can watch, steer mid-task, or step away.<sup>[1]</sup> Cowork sessions run in the cloud and keep going when you close your laptop. They reach your computer (local files, your browser) only through the Claude Desktop app, and only for folders you have connected.<sup>[1]</sup> As of November 2026, Cowork is on all paid plans on desktop. On web and mobile it is on Pro, Max, Ultra and Team (beta on Team), and on Enterprise when an owner enables it.<sup>[1]</sup> In the new Claude experience, chat and Cowork are merged into one conversation and Claude decides which tool to use, so you don't pick a mode first.<sup>[2]</sup>

**How much Claude checks with you.** Cowork has three permission modes.<sup>[1]</sup>

| Mode | What happens | Use it when |
|---|---|---|
| **Manually approve** | Claude pauses and asks before actions | The task touches sensitive files, accounts or sites; you are using a new tool or site; mistakes would be hard to undo<sup>[3]</sup> |
| **Automatically approve** | Claude keeps working, reviews each action for safety and blocks anything it judges unsafe | Well-defined work you are watching loosely |
| **Skip all approvals** | Nothing pauses and nothing checks actions | Only when you fully trust every action, connector, file and app in the task |

Claude always asks before permanently deleting files, in any mode.<sup>[3]</sup> On Team and Enterprise plans an admin can remove "Automatically approve" or require approval for write-capable connector tools.<sup>[1]</sup>

**Scheduled tasks.** You describe a task once, choose a cadence, and Claude runs it as its own Cowork session each time: daily briefings from Slack or email, weekly reports from Drive, recurring competitor research, standup summaries from project tools.<sup>[4]</sup> The facts that decide exam items:

- Cadences are hourly, daily, weekly, on weekdays, or manual (run on demand). You can also set the approval mode, an optional model and an optional folder.<sup>[4]</sup>
- Scheduled tasks run remotely, so they run even when your computer is asleep or the desktop app is closed. A task that needs local files or apps runs only locally.<sup>[4]</sup>
- You review upcoming and past runs from "Scheduled" in the sidebar, where you can edit, pause, resume, delete or run a task on demand.<sup>[4]</sup>
- Anthropic's safety advice for them is specific: start with low-risk tasks like summaries, avoid sensitive data and consequential actions (sending messages, purchases, anything hard to undo), review outputs after each run, and pause tasks you no longer use.<sup>[3]</sup>

**Projects in Cowork.** A Cowork project groups related tasks with their own instructions, scheduled tasks, context (a local folder, a linked chat project, a URL) and memory. What Claude learns in one project doesn't carry to other projects, but a project shares memory with your chats outside projects unless you turn off "Use account memory". On Team and Enterprise, projects can be shared with "Can view" or "Can edit" access.<sup>[5]</sup>

**Skills and plugins.** A skill packages a procedure so it runs the same way every time. Organization Owners on Team and Enterprise can provision skills to everyone, which is how a team distributes an approved workflow instead of each person keeping their own prompt.<sup>[6]</sup> Plugins bundle skills, connectors and sub-agents into one package.<sup>[1]</sup> Because one plugin can widen what Claude can do quite a lot, install only ones you have evaluated.<sup>[3]</sup>

**Connectors inside the tools people already use.** Interactive connectors show a live app inside the conversation, for example an Asana board where you can tick off tasks while you keep talking to Claude.<sup>[7]</sup> Claude for Google Workspace puts Claude in a Docs, Sheets or Slides sidebar (beta, as of November 2026). It reads the file you have open, and only that file. Its edits land as direct edits made as you, not as suggestions, so choose "Ask before edits" if you want to review each change. Some actions, such as adding a link or removing someone's access, always stop for approval.<sup>[8]</sup>

**Sharing the output.** Most workflows end with something other people open. As of November 2026, live artifacts are artifacts made in Cowork before August 19, 2026. They can still be opened and shared but not edited in place; you republish one as a new artifact to keep editing it, and people with the old link see the new version. A live artifact shared with a colleague uses *the viewer's* access to connectors and data, not yours, so a part they can't access shows an error instead of your data.<sup>[9]</sup> Sharing artifacts in general, and what an owner controls, is in [Chapter 11](/ccao-f/read/notes/11-responsible-use-privacy-and-policy).

### Workplace example

A project manager at a construction firm spends Monday mornings building a status digest from the project tool, the site team's Slack channel and the risk log. She starts by augmenting: she runs the digest in Cowork, compares it with her own version for three weeks, and fixes the instructions where Claude misread "on hold". Once it matches, she sets it as a weekly scheduled task in a Cowork project that holds the instructions and the digest template. The task drafts the digest to a folder. It does not post it. She reviews the draft each Monday and sends it herself, because the digest goes to the client and a wrong date would be expensive. Six weeks later she notices the risk-log section is always thin. The fix is redesign: the site team wasn't updating the log. She raises that with the site lead rather than asking Claude to "infer risks".

### The traps

- **Automating the send before the draft is proven.** The option schedules a task that emails clients directly. The right order is: run it alongside the manual process, compare, then automate the low-risk part, with a person approving anything external.
- **An instruction where a setting is needed.** "Tell the scheduled task to be careful with client data." The control is the scope you give it: which folders, which connectors, which approval mode.
- **The wrong mode for the stakes.** Leaving a task that touches finance files on "Skip all approvals" because it is faster. Anthropic says to switch to manual approval when the task touches sensitive files or would be hard to undo.<sup>[3]</sup>
- **Assuming a scheduled task needs your laptop.** It runs in the cloud. Unless it needs local files or apps, closing the laptop doesn't stop it, and nobody is watching it live. That is why you review past runs.
- **Overreaction.** "One digest was wrong, so go back to doing it by hand." Find the cause (a stale source, a vague instruction, a missing review) and fix it.
- **Treating a shared artifact as a snapshot.** A colleague's view of a live artifact depends on their own access, so "it shows an error for my manager" is often a permissions fact, not a bug.

## 4.5 Communicating Claude's value and limitations to stakeholders

### Lead with evidence, not the demo

**General practice.** A demo shows that something *can* work on a good example. A stakeholder decision needs to know how it worked on real cases. For any proposal, be ready to say:

- what the workflow does, in one sentence;
- what was tested, on how many real cases, and how many needed correction;
- what it saves, measured end to end (if drafting got 70% faster but review got twice as long, say so);
- what stays human, and who owns it;
- what it can still get wrong, and how that will be caught;
- what data it uses, under which plan, and what the organization's policy says about that (see [Chapter 11](/ccao-f/read/notes/11-responsible-use-privacy-and-policy));
- what it costs, in usage, review time and upkeep.

### Tailor to the audience

**General practice.**

| Audience | What they need to hear |
|---|---|
| Executive sponsor | Value against cost, the risk boundaries, the evidence that it's ready, the decision you need from them |
| The people doing the work | Exactly what changes for them, what they still own, how to spot a bad output, what to do when it fails |
| Reviewers and approvers | What they are checking, against what standard, and that they have authority to reject |
| Legal, privacy, security | What data goes where, under which plan and settings, who can see it, how long it's kept |
| Customers or the public | That AI is involved where that is required or expected, in plain words |

### Use Anthropic's own evidence where it exists

On Enterprise plans, **smart reports** give a per-team view of what Claude is used for, what each kind of work costs at list price, where sessions hit friction, and which repeated patterns are worth packaging as skills. Anthropic lists "bring evidence to renewals" as a use case: a per-team view of adoption, cost and output instead of a blended usage number.<sup>[10]</sup> Two limits belong in any stakeholder conversation about them. They are for understanding adoption and planning investment, and Anthropic says they must not be used to evaluate individual performance or make employment decisions. And they read a *sample* of transcripts, so they show patterns rather than an audit of every session.<sup>[10]</sup> A pain point a report finds is often the cheapest win: a connector nobody turned on, which an admin can fix in minutes.<sup>[10]</sup>

### Say the limits plainly

Stakeholders trust a proposal that names its limits. The ones to state, all grounded in earlier chapters, are:

- Claude can be wrong in a confident tone. Anything that matters gets checked against a source ([Chapter 6](/ccao-f/read/notes/06-checking-what-claude-wrote)).
- It works from what it is given. Missing or stale inputs produce confident gaps.
- Usage limits are real. Long multi-step tasks, research and file creation use more of a plan's allowance than a quick question.<sup>[1]</sup>
- Some decisions require a qualified person by policy, not by preference ([Chapter 11](/ccao-f/read/notes/11-responsible-use-privacy-and-policy)).

### Workplace example

A communications lead wants budget to roll out Claude to her ten-person team. Her first draft says Claude "writes press releases in minutes and never misses a fact". She rewrites it. The new version says that in a four-week pilot, eight of eleven press-release drafts needed only light edits, two needed a factual correction caught in review, and one was abandoned because the source brief was incomplete. Time from brief to approved release fell from two days to one. Every release is still approved by her before it goes out. Her director approves the rollout, and legal signs off quickly because the data question was answered on page one.

### The traps

- **Overclaiming.** "It eliminates errors" or "no review needed". Both are false and both make the first mistake a credibility crisis.
- **Underclaiming to be safe.** "It's only good for spelling." That throws away real value and is just as inaccurate.
- **A demo as proof.** Showing the best output from the pilot instead of the error rate across all cases.
- **Reporting the fast step, hiding the slow one.** Generation time alone, with no review time.
- **The wrong measure for the wrong purpose.** Using a smart report to rank individual employees.
- **One message for everyone.** Giving the security team a productivity pitch, or the frontline team a cost slide.

## On the exam

- Choose **augment, automate or redesign** for each step. Place human approval where an error is costly or hard to undo.
- Prove a new routine **alongside the manual process** before automating it, and automate drafting before sending.
- Every step needs an owner, a reviewer with a specific question, and a **fallback** someone can run by hand.
- Use **Manually approve** for sensitive, new or hard-to-undo work. Claude always asks before permanently deleting files.
- **Scheduled tasks** run in the cloud even with your computer off. Start with low-risk summaries, avoid sending or buying, and review past runs.
- A shared live artifact uses the **viewer's** access. Claude in Google Workspace edits **as you**, directly, unless you choose "Ask before edits".
- To stakeholders, report **measured, end-to-end results** on real cases, what stays human, and the limits.
- **Smart reports** support adoption and investment decisions, never decisions about individuals.

## Endnotes

1. What Cowork is, how it runs tasks in the cloud and reaches your computer through Claude Desktop, availability by plan and surface, the three permission modes, admin controls on Team and Enterprise, plugins, and usage limits for multi-step tasks. Anthropic, "Get started with Claude Cowork" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork
2. Chat and Cowork merged into one conversation in the new Claude experience, and its rollout. Anthropic, "Claude Cowork and chat are one Claude" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/16761823-claude-cowork-and-chat-are-one-claude
3. When to switch to manual approval, deletion always needing permission, cautions for scheduled tasks, and caution with plugins. Anthropic, "Use Claude Cowork safely" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/13364135-use-claude-cowork-safely
4. Scheduled tasks: common uses, cadences, settings, running remotely when the computer is off, local-only tasks, and managing runs. Anthropic, "Schedule recurring tasks in Claude Cowork" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork
5. Cowork projects: instructions, scheduled tasks, context, memory scope and the "Use account memory" toggle, and sharing. Anthropic, "Organize your tasks with projects in Claude Cowork" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/14116274-organize-your-tasks-with-projects-in-claude-cowork
6. Skills and organization-provisioned skills for distributing approved workflows. Anthropic, "What are skills?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12512176-what-are-skills
7. Interactive connectors rendering live apps such as Asana inside the conversation. Anthropic, "Use interactive connectors in Claude" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/13454812-use-interactive-connectors-in-claude
8. Claude for Google Workspace: beta availability, reading only the open file, edits made as you and not as suggestions, "Ask before edits", and actions that always need approval. Anthropic, "Use Claude in Google Docs, Sheets, and Slides" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/16951679-use-claude-in-google-docs-sheets-and-slides
9. Live artifacts: the August 19, 2026 cut-off, republishing to edit, organization-only sharing, and use of the viewer's access. Anthropic, "Use live artifacts in Claude Cowork" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/14729249-use-live-artifacts-in-claude-cowork
10. Smart reports: what they show, the renewals and connector use cases, transcript sampling, and the warning against use for individual performance or employment decisions. Anthropic, "Get started with smart reports" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/16893491-get-started-with-smart-reports
