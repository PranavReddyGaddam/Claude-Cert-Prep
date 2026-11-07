# Chapter 4: Context and Memory

**Summary**: *Claude works from what is in the conversation, and a conversation has a ceiling. Two separate limits apply: a usage limit on how much you can do over time, and a length limit (the context window) on how much one chat can hold. Long chats get slower, costlier and more cluttered, so a careful user knows when to start fresh, when to carry a checked summary forward, and when to put information somewhere it persists: a Project, instructions, a Skill or memory. Memory is useful continuity, not a source of truth, and incognito and memory-off chats exist for when you don't want continuity at all.*

This chapter covers objective 3.4, "Understand and manage context limitations and memory considerations (when to restart, summarize, or persist)". Setting up Project knowledge and instructions is in [Chapter 5](/ccao-f/read/notes/05-projects-knowledge-and-connectors). The privacy side of memory and incognito chats for regulated data is in [Chapter 11](/ccao-f/read/notes/11-responsible-use-privacy-and-policy).

## Two different limits

Anthropic separates them clearly, and exam stems often blur them on purpose.<sup>[1]</sup>

| | Usage limit | Length limit |
|---|---|---|
| What it controls | How much you can use Claude over time, across all your chats | How long one conversation can get |
| How it works | On paid plans, a session limit that resets five hours after your first message, plus weekly limits that reset at a fixed time each week | The context window: how much the model can work with at once in a single chat |
| What affects it | Conversation length and complexity, features used, model, effort level | Everything in the chat: messages, files, tool results, instructions |
| Shared across | Claude on the web, Desktop and Claude Code count toward the same limit | Only that conversation |
| If you hit it | Wait for the reset, upgrade, or continue on usage credits if enabled | Start a new conversation, or use a Project to work with more material |

All of that is from Anthropic's limits article, as of November 2026.<sup>[1]</sup> You can check both progress bars in **Settings > Usage**.<sup>[2]</sup>

Things that eat usage, per Anthropic: message length, attachment size, how long the current conversation is, tools like Research and web search, model choice, effort level, artifacts, and multi-step work like running code or creating files.<sup>[2]</sup> Longer conversations cost more partly because Claude keeps working with everything earlier in the chat.

## The context window

The context window is Claude's working memory for one chat. As of November 2026, on paid plans, the newest chat models support up to 1M tokens, while others support 500K or 200K, and a portion is always reserved for Claude's response.<sup>[1]</sup> Anthropic's per-model table lists, for example, 1M tokens for Opus 5.5, Sonnet 5.5, Haiku 5.5 and Fable 5.1 in chat.<sup>[3]</sup> You can't increase the window for your plan.<sup>[1]</sup>

Three things matter more than the number:

**Automatic context management.** On paid plans with code execution on, when a chat approaches the limit, Claude summarizes earlier messages so the conversation can continue, and you may see Claude "organizing its thoughts". The full history is preserved for reference, but conversations that trigger this use more of your usage limit, and code execution must be enabled for it to work.<sup>[3]</sup><sup>[1]</sup> So a very long chat rarely stops outright any more; it gets more expensive and Claude is working from a condensed version of the early turns.

**Tools and connectors take space.** Anthropic calls tools and connectors token-intensive and suggests turning off connectors a conversation doesn't need, and telling Claude not to search the web when you don't need current information.<sup>[1]</sup> With 10 or more connectors, the **On demand** tool access mode loads only the connectors a request needs, which Anthropic recommends when conversations are hitting length limits.<sup>[4]</sup>

**Projects stretch capacity.** Projects use retrieval (RAG) on paid plans, loading only the relevant parts of the knowledge into the context window, so they can hold far more material than a single chat.<sup>[3]</sup> Anthropic also recommends short project instructions and removing project files you no longer use.<sup>[1]</sup>

**General practice.** A big window raises the ceiling; it doesn't make every token equally useful. A chat that holds three abandoned outlines, two corrected figures and a change of audience gives Claude conflicting material to weigh. Fitting is not the same as clean.

## Restart, summarize or persist

This is the decision the objective names. Use the question "what does the next piece of work actually need?"

| Situation | Move | How |
|---|---|---|
| Moving on to unrelated work | **Restart** | New chat. Anthropic's Cowork advice is to start a new conversation for unrelated work so Claude isn't carrying extra context.<sup>[5]</sup> |
| Long chat near your usage limit | **Restart** | Anthropic suggests starting a new conversation if you're approaching your usage limit in a long chat.<sup>[1]</sup> |
| Long chat full of superseded drafts, corrected facts or a changed brief, and the work continues | **Summarize, check, then restart** | Ask Claude to summarize the decisions, current facts and open questions; correct the summary yourself; paste it into a new chat as the brief. |
| Information the next many chats will need (reference documents, a style guide) | **Persist in a Project** | Project knowledge and instructions apply to every chat in the Project ([Chapter 5](/ccao-f/read/notes/05-projects-knowledge-and-connectors)) |
| Preferences you want everywhere (your role, tone, format) | **Persist in instructions or memory** | Profile instructions for explicit rules; memory for context Claude picks up as you work |
| A procedure you want done the same way each time | **Persist as a Skill** | [Chapter 5](/ccao-f/read/notes/05-projects-knowledge-and-connectors) |
| Picking up yesterday's thread on a paid plan | **Search past chats** | Ask Claude what you discussed; it searches and cites the chats (see Chat search below) |

**General practice** on the summarize step: the automatic summary Claude makes near the limit keeps you going, but you don't control what it keeps. For consequential work, make the summary deliberate. Ask for decisions made, figures confirmed (with sources), what changed since the start, and what's still open. Then read it. A summary you haven't checked can carry a wrong figure into every later chat with the authority of "we already agreed this".

### Worked example: a project manager's long planning chat

Aisha has spent two days in one chat planning an office move. The chat holds three floor-plan options (two rejected), a budget that finance revised twice, and a timeline that slipped a month. Claude's latest draft of the staff announcement mentions the old move date.

The tempting fixes: keep correcting in the same chat, or switch to a model with a bigger context window. Neither addresses the cause, which is that the chat contains several conflicting versions of the truth. Aisha asks Claude for a summary of current decisions, corrects the one figure it got wrong, starts a new chat inside the "Office move" Project with the summary at the top, and adds the final budget and timeline to the Project knowledge so later chats start from them. The next draft is right first time.

## Memory

### What it is and how it behaves

Claude can build memory from your chats and carry it into new conversations and, in the cloud, into Cowork tasks.<sup>[6]</sup> In the current experience Claude saves memory as individual topics while you chat, not as a summary after the fact, and you can also tell it to "remember this".<sup>[6]</sup> It remembers everyday working context: your role and projects, people in your work, communication preferences, technical preferences and ongoing work.<sup>[6]</sup>

As of November 2026:<sup>[6]</sup>

- **Availability.** Memory is on by default for Free, Pro, Max and Ultra on the web, Desktop and Mobile. On Team and Enterprise, owners control whether memory is available. Whether it starts on for members depends on when the organization was created; in older organizations it's off until each member turns it on.
- **Projects keep their own memory.** In a Project, Claude uses that Project's memory plus your memory from chats outside Projects, but not memory from other Projects. To keep a Project's memory fully separate, turn off "Use account memory" on the Project's page.
- **Sensitive topics are excluded by default.** Claude doesn't store topics such as health, race, religion, politics or gender identity unless you opt in. Some things are never saved even if you ask, including government ID numbers, financial account numbers, criminal history and immigration status.
- **You can see and edit it.** In **Settings > Your Claude**, "Manage" next to Your memory lists every topic; you can edit or delete any of them, or tell Claude in a chat what to remember, change or forget.
- **Pause or reset.** Pausing keeps existing memory but stops using it and making new memories. Resetting permanently deletes all memories, including Project memories, and can't be undone.
- **Deleting a chat doesn't delete what was learned from it.** When a conversation is deleted, memory entries generated from it aren't removed; you delete individual memories instead.

### Memory is continuity, not a record

**General practice.** Memory is good for "Jordan prefers bullet summaries" and "the team calls the CRM 'Atlas'". It is a poor place for "the spending limit is 20,000" or "the refund window is 30 days". Those facts change, and memory may hold an old version. If a decision depends on a current figure, check the source of record and correct the memory if it is stale. Never treat "Claude remembered it" as verification.

### Turning memory off, for one chat or for good

There are three different tools, and stems test which one fits.

| | Memory off for one chat | Incognito chat | Pause or reset memory |
|---|---|---|---|
| How | "+" menu, turn off "Memory" **before the first message**<sup>[6]</sup> | Ghost icon when starting a chat **outside a Project**<sup>[7]</sup> | Settings > Your Claude<sup>[6]</sup> |
| Uses or adds to memory | No | No | No (paused) / everything deleted (reset) |
| Saved to chat history | Yes; it stays in your history<sup>[6]</sup> | No<sup>[7]</sup> | Unchanged |
| Works in a Project | Yes, and the chat doesn't use or add to the Project's memory<sup>[6]</sup> | No; incognito isn't available in Projects<sup>[7]</sup> | Applies account-wide |
| Can be changed later | No; set before the first message<sup>[6]</sup> | Can't be converted to a regular chat<sup>[7]</sup> | Can unpause; reset is permanent |

Incognito details worth knowing (as of November 2026):<sup>[7]</sup>

- Incognito chats are available on every plan, aren't used for training, and aren't saved to history or memory. They are still retained for 30 days by default, or longer under an Enterprise organization's custom retention setting.
- On Team and Enterprise, incognito chats are included in organizational data exports available to owners, and in the Compliance API on Enterprise.
- Your profile preferences still apply in incognito chats.
- In the new Claude experience, incognito chats open in the previous chat experience, so Claude can't create files or run code in them.
- Once closed, an incognito chat can't be reopened.

The key exam distinction: **incognito keeps a chat out of your history and memory; it is not a data-protection control for your organization.** On a Team plan it is still retained and exportable by owners. If policy says certain data shouldn't go into Claude at all, incognito doesn't satisfy that ([Chapter 11](/ccao-f/read/notes/11-responsible-use-privacy-and-policy)).

### Bringing memory in or out

You can import memory from another AI assistant via **Settings > Your Claude** > "Start import": you paste in what the other service exports, and Claude stores it as memory entries. Anthropic describes imports as experimental, notes Claude may not keep imported personal details unrelated to work, and suggests editing the export to remove anything sensitive first.<sup>[8]</sup> To export, view your memory in settings or ask Claude to write out its memories verbatim.<sup>[8]</sup>

## Chat search

On paid plans, you can ask Claude to search your previous conversations ("What did we decide about the vendor shortlist?"). It searches using retrieval, shows the search as a tool call, and cites the original chats.<sup>[6]</sup> Two boundaries matter:<sup>[6]</sup>

- Searches cover chats outside Projects, and, separately, chats inside each specific Project. A search from inside a Project stays inside that Project.
- Incognito chats are never searched. Chats started with memory off stay in your history and can be found by searches from other conversations.

You can turn chat search off in **Settings > Your Claude** with "Search and reference chats".<sup>[6]</sup>

Chat search is the right tool for "pick up where we left off" when the earlier chat wasn't in a Project. It is not a replacement for putting standing reference material into a Project, because it retrieves pieces of past conversations, not the current approved document.

## Worked example: a marketing lead's three needs

Rafael leads marketing at a software company.

- He wants every chat to know he writes for CTO-level readers and prefers short paragraphs. He puts that in his **profile instructions**, and memory picks up the product names as he works.
- He's preparing a sensitive reorganization announcement and doesn't want it shaping later drafts or showing in his history. He uses an **incognito chat**, knowing that on his company's Team plan it is still retained and exportable by owners, and he leaves out the names of affected staff anyway.
- He runs a monthly campaign review in the "Campaigns" **Project**, but the new agency partner's work shouldn't mix with the in-house brand memory. He turns off "Use account memory" for that Project.

## The traps

- **"Tell Claude to forget it."** Asking in chat can update memory, but if the goal is that a chat never enters history or memory, the control is incognito or memory-off before the first message.
- **A bigger window for a messy chat.** The problem is conflicting content, not capacity. Restart with a checked summary.
- **Expecting chats in a Project to share content.** They share the Project's knowledge, instructions and memory, not each other's conversations.
- **Treating memory as the source of truth.** A remembered figure may be stale. Check the source of record.
- **Incognito as a compliance control.** It is retained and, on Team and Enterprise, exportable. It doesn't make sensitive data acceptable to share.
- **Mixing up the limits.** Hitting a usage limit is fixed by waiting, upgrading or usage credits; hitting a length limit by a new chat or a Project.
- **Leaving every connector on.** Tools and connectors use context. Turn off what the chat doesn't need, or switch to On demand.

## On the exam

- Usage limits are about how much over time (five-hour session plus weekly on paid plans, shared across surfaces). Length limits are about one chat's context window.
- Long chats use more usage; with code execution on, Claude auto-summarizes near the limit, which also uses more usage.
- Restart for unrelated work or a cluttered chat; summarize decisions deliberately and check the summary before carrying it forward; persist recurring material in a Project, preferences in instructions or memory, procedures in a Skill.
- Memory: on by default on individual plans, owner-controlled on Team and Enterprise; Projects have their own memory; sensitive topics excluded by default; editable in Settings > Your Claude.
- Memory-off chat: set before the first message, stays in history. Incognito: not in history or memory, not available in Projects, still retained (30 days default) and exportable on Team and Enterprise.
- Chat search (paid plans) cites past chats and stays within Project boundaries; it never searches incognito chats.
- Memory is continuity. Verify anything that could have changed.

## Endnotes

1. Usage limits versus length limits; five-hour and weekly limits; usage shared across surfaces; context window sizes and reserved output; automatic context management; ways to stretch context including concise project instructions, removing unused files, lower effort and turning off tools; starting a new conversation near the usage limit. Anthropic, "How do usage and length limits work?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work
2. Factors that affect usage, project caching, and the Settings > Usage progress bars. Anthropic, "Usage limit best practices" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/9797557-usage-limit-best-practices
3. Per-model context windows in chat, Claude Code and Cowork; automatic context management with code execution; Projects using RAG; tools and connectors being token-intensive. Anthropic, "How large is the context window on paid Claude plans?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/8606394-how-large-is-the-context-window-on-paid-claude-plans
4. Tool access modes (Auto, Always available, On demand) and On demand for 10 or more connectors or length issues. Anthropic, "Manage Claude's tool access" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/13730515-manage-claude-s-tool-access
5. Starting a new conversation for unrelated work so Claude isn't carrying extra context. Anthropic, "Get started with Claude Cowork" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork
6. Chat search availability and boundaries; how memory is stored; availability and defaults by plan; project memory and "Use account memory"; memory off for a single chat; sensitive topics and never-saved data; pause and reset; deletion behavior; managing memory in Settings > Your Claude. Anthropic, "Use Claude's chat search and memory to build on previous context" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context
7. Incognito chats: availability, no training, not saved to history or memory, 30-day retention, Team and Enterprise exports and Compliance API, profile preferences, not available in Projects, can't be converted or reopened, no file creation in the new experience. Anthropic, "Use incognito chats" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12260368-use-incognito-chats
8. Importing memory from other AI providers, the experimental status, work focus, and exporting memory. Anthropic, "Import and export your memory from Claude" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12123587-import-and-export-your-memory-from-claude
