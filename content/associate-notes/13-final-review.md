# Chapter 13: Final Review

**Summary**: *This chapter is for the last week. It does not teach anything new. It condenses chapters 1 to 12 into the decisions that settle most items, the pairs of features candidates confuse, and a method for the two minutes you have per question. If a line here surprises you, go back to the chapter it links to.*

## Most items come down to one of seven questions

Each domain has a question you can ask of almost any stem in it. Ask it first.

| Domain (weight) | The question that settles most items | Where it is taught |
|---|---|---|
| Output Evaluation and Validation (21%) | What source would prove this right, and who needs to see it before it is used? | [6](/ccao-f/read/notes/06-checking-what-claude-wrote), [7](/ccao-f/read/notes/07-when-a-human-must-review), [8](/ccao-f/read/notes/08-shaping-output-for-the-reader) |
| Workflow Integration and Solution Design (16%) | Should this step be helped, automated or redesigned, and where does a person approve? | [9](/ccao-f/read/notes/09-finding-and-designing-use-cases), [10](/ccao-f/read/notes/10-fitting-claude-into-the-workflow) |
| Governance, Risk, and Responsible Use (15%) | Is this use prohibited, high-risk or ordinary support work, and what actual control does the policy require? | [11](/ccao-f/read/notes/11-responsible-use-privacy-and-policy) |
| Prompting and Task Execution (14%) | What is the prompt missing: input, audience, requirement, example or a checkpoint? | [1](/ccao-f/read/notes/01-prompts-that-define-the-job) |
| Product and Model Selection (12%) | What shape is the job: one-off, recurring, current fact, deep investigation, deliverable or hands-off task? | [2](/ccao-f/read/notes/02-choosing-the-feature), [3](/ccao-f/read/notes/03-choosing-the-model), [4](/ccao-f/read/notes/04-context-and-memory) |
| Configuration and Knowledge Management (12%) | Is this behaviour (instructions), facts (knowledge), a procedure (Skill) or access (connector)? | [5](/ccao-f/read/notes/05-projects-knowledge-and-connectors) |
| Troubleshooting and Optimization (10%) | What is the cause, and what is the one change that tests it? | [12](/ccao-f/read/notes/12-troubleshooting-and-optimization) |

## The four families, one last time

Every wrong option you will meet belongs to one of these. When two options survive your first pass, ask which one is a family member.

1. **Trusting the model's self-report.** Confidence, a self-rating, "are you sure?". Not evidence. An *evidence-anchored* check ("quote the passage that supports each claim, or remove the claim") is different and can be right.
2. **Cosmetic fix for a substance problem.** Rewording, formality, a persona, more length. Right only when the stem says the facts are already correct and the problem is tone or fit.
3. **An instruction where a control is needed.** "Tell Claude not to keep it." A policy problem is solved by removing the data, using the approved plan or workspace, or an admin setting.
4. **Overreaction.** The top model for everything, dropping the task, banning the tool, redoing everything by hand. Right only when no proportionate fix exists, which is rare.

## Pairs candidates confuse

Many items turn on knowing which of two similar things the stem describes. These facts are from the Help Center as of November 2026. Check the linked chapter if any feel unfamiliar.

| Pair | The difference that decides items |
|---|---|
| **Web search vs Research** | Web search for a quick current fact that one or two searches answer; Research for a multi-source, cited investigation. Research uses more of your limits, runs on Opus 5.5 whatever model you chose, and started on mobile it searches only the web and skips connectors<sup>[1][2]</sup> |
| **Research vs enterprise search** | Enterprise search retrieves internal knowledge through connected apps and only shows what each person can already access<sup>[3]</sup> |
| **Project vs memory** | A Project holds the documents and instructions every chat in it starts with. Memory carries useful context between chats. Each Project has its own memory<sup>[4][5]</sup> |
| **Project instructions vs Project knowledge** | Instructions say how to behave; knowledge holds what is true. Claude cannot see a Project's name or description<sup>[6]</sup> |
| **Profile instructions vs Project instructions vs Skill** | Profile for preferences everywhere; Project for one body of work; Skill for a procedure Claude loads when a task needs it<sup>[7][8]</sup> |
| **Organization vs individual instructions** | Organization instructions win on a direct conflict, apply to everyone and cannot switch off safety behaviour<sup>[9]</sup> |
| **Usage limit vs length limit** | Usage is how much over time (a five-hour period plus weekly limits on paid plans). Length is how much one chat can hold<sup>[10]</sup> |
| **Incognito vs a memory-off chat** | Incognito chats stay out of history and memory, are not available in Projects, and are still retained (30 days by default)<sup>[11]</sup> |
| **Remote connector vs desktop extension** | Remote for cloud services, available everywhere; desktop extension for tools on your own computer, only in Claude Desktop and Claude Code<sup>[12]</sup> |
| **Owner enables vs member connects** | On Team and Enterprise an owner enables a connector; each member then authenticates and Claude inherits that member's permissions<sup>[13]</sup> |
| **Can view vs Can edit (shared Project)** | Can view sees knowledge and instructions and can chat; Can edit changes them. The owner's chats stay private<sup>[14]</sup> |
| **High-risk vs excluded use** | Advice or decisions about a specific person in areas like employment, credit, housing, legal or medical need qualified human review and disclosure. Internal drafting and research are excluded<sup>[15]</sup> |
| **Haiku vs Sonnet vs Opus** | Haiku for fast, cheap, high-volume work; Sonnet for everyday balance; Opus for complex, long-running reasoning. Start light and move up only when a test shows a gap<sup>[16]</sup> |

## Rules worth memorizing

- Fluency and confidence are never evidence. A cited source must be opened and must actually say the thing.
- Accuracy and completeness fail separately. Check coverage against the requirements, not against what is on the page.
- Claude cannot act outside its integrations. "I've sent it" needs confirming in the real system.
- Recompute important numbers with a spreadsheet, code execution or by hand.
- When output is wrong because something is missing, supply the missing thing. Rewording produces plausible filler.
- Split complex work at points where a person can check the intermediate result, and extract and verify before you analyze.
- Change one thing at a time and keep the failing example as your test.
- Prove a new routine alongside the manual process before you automate it. Automate drafting before sending.
- Every automated step needs an owner, a reviewer with a specific question, and a manual fallback.
- A summary carried into a new chat must be checked before it is trusted. Memory is continuity, not a record.
- Outdated knowledge files keep feeding every chat in a Project. Remove them; don't instruct around them.
- A public link is public. Team and Enterprise chats can't be shared outside the organization.
- With an agent working for you, you remain responsible. Narrow its access and approve manually when stakes are high.
- Escalate to a developer or architect when the job needs custom software, an API integration or an automated pipeline. Don't escalate what a Project, connector, Skill or scheduled task already solves.

## Four short reviews

These are written like exam items, with the reasoning you want to be able to give. They are original.

**1. The confident citation.** A communications officer asks Claude to summarize a new data-protection guideline for a staff briefing. The summary is clear and cites "Section 4.2(b)". *What decides it:* the audience is all staff and the claim is specific. Open the official guideline and check that 4.2(b) exists and says what the summary claims. Asking Claude to rate its confidence is family 1. Making the summary more formal is family 2.

**2. The recurring report.** An ops analyst produces the same weekly vendor-performance summary from three exported files and keeps re-explaining the format. *What decides it:* the work recurs with the same structure and material. A Project with the format in its instructions handles the context; if the steps are a fixed procedure used across several Projects, a Skill holds them. If she wants it to run unattended, a scheduled task can do it, starting with a summary she reviews rather than one sent straight to vendors. Moving to the most capable model is family 4 and does nothing for the repetition.

**3. The candidate shortlist.** A hiring manager wants Claude to rank thirty applicants and reject the bottom twenty automatically. *What decides it:* this is a decision about specific people in employment, a high-risk area. Claude can help organize evidence against criteria, but a qualified person must review before anything is decided, with authority to change it, and applicants must be told AI was used. "Add an instruction telling Claude to be fair" is family 3. Banning Claude from recruiting work entirely is family 4.

**4. The stalled long chat.** A planner's three-hour chat is near its length limit and Claude has started contradicting earlier decisions. *What decides it:* the cause is an overloaded chat, not a weak model. Ask for a summary of the agreed decisions, check it, and start a new chat with it. A model with a larger context window treats a symptom, and starting over with nothing loses what was agreed.

## Two minutes per item

1. **Read the last sentence first.** It tells you whether you are choosing an action, a cause or an accurate statement, and how many answers to select.
2. **Read the stem and mark three things:** where the output goes, the constraint that dominates, and what is actually wrong.
3. **Remove the family members.** Most items lose two options here.
4. **Between the last two,** pick the one that fixes the cause with the least drastic step that still meets every stated requirement.
5. **For select-two,** look for two options that address different parts of the problem. Two options that say the same thing in different words cannot both be right.
6. **Flag and move on** after two minutes. You can come back.

## On the exam

- Ask the domain's settling question before reading the options.
- Name the family of each option you rule out.
- Check every Claude-specific claim in an option against what you know the Help Center says; plausible-sounding product behaviour is a common distractor.
- Proportionate beats drastic. Controls beat instructions. Evidence beats confidence.
- Escalation is right when no built-in feature can do the job, and wrong when one can.

## Endnotes

1. Web search for quick factual questions, Research for many searches and a structured, cited report. Anthropic, "When should I use web search, extended thinking, and research?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/11095361-when-should-i-use-web-search-extended-thinking-and-research
2. Research runs on Opus 5.5 with Opus 4.8 as fallback regardless of the selected model, and searches only the web when started on mobile. Anthropic, "Use research on Claude" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/11088861-use-research-on-claude
3. Enterprise search is permission-aware and each user authenticates their own connectors. Anthropic, "Use enterprise search" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12489464-use-enterprise-search
4. Projects as self-contained workspaces with their own knowledge. Anthropic, "What are projects?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/9517075-what-are-projects
5. Memory, chat search, and each Project having its own memory. Anthropic, "Use Claude's chat search and memory to build on previous context" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context
6. Project instructions and knowledge, and that Claude cannot see a Project's name or description. Anthropic, "How can I create and manage projects?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects
7. Profile instructions for account-wide settings. Anthropic, "Understanding Claude's personalization features" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/10185728-understanding-claude-s-personalization-features
8. Skills as procedures loaded when relevant, compared with Projects as static background knowledge. Anthropic, "What are Skills?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12512176-what-are-skills
9. Organization instructions take precedence on a direct conflict and cannot override safety behaviour. Anthropic, "Set organization instructions" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/14546867-set-organization-instructions
10. Usage limits versus length limits, and the five-hour and weekly limits. Anthropic, "How do usage and length limits work?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work
11. Incognito chats are kept out of history and memory, are unavailable in Projects, and are retained for 30 days by default. Anthropic, "Use incognito chats" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12260368-use-incognito-chats
12. Remote connectors versus desktop extensions. Anthropic, "When to use desktop and web connectors" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/11725091-when-to-use-desktop-and-web-connectors
13. Owners enable connectors; members authenticate; Claude inherits each person's permissions. Anthropic, "Use connectors to extend Claude's capabilities" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities
14. Can view and Can edit permissions, and chats staying private in a shared Project. Anthropic, "Manage project visibility and sharing" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/9519189-manage-project-visibility-and-sharing
15. High-risk use case requirements, disclosure, and exclusions. Anthropic, "Usage Policy" (Anthropic, accessed 2026-11-05), https://www.anthropic.com/legal/aup
16. Model families and starting with a faster, lower-cost model. Anthropic, "Choosing a model" (Claude Docs, accessed 2026-11-01), https://platform.claude.com/docs/en/about-claude/models/choosing-a-model
