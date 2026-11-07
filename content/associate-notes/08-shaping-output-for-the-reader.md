# Chapter 8: Shaping Output for the Reader

**Summary**: *An output is finished when the person who receives it can use it, not when it is accurate. That means editing for the reader's decision, adapting one set of facts for several audiences without letting the facts drift, comparing versions against stated criteria rather than polish, and choosing the container that fits how the content will be used: a quick inline answer, a throwaway visual, a shareable artifact or living doc, a downloadable file, a dashboard or a fixed structure another person or tool will consume.*

This chapter covers objectives 2.5 (edit, adapt, refine and compare for the audience) and 2.6 (organize, curate and choose output formats). Checking facts is [Chapter 6](/ccao-f/read/notes/06-checking-what-claude-wrote). Writing the original prompt is [Chapter 1](/ccao-f/read/notes/01-prompts-that-define-the-job). Choosing between chat, Projects, research and other features is [Chapter 2](/ccao-f/read/notes/02-choosing-the-feature).

Most of 2.5 is sound editorial practice that Anthropic's pages do not spell out. Where a rule below is not from an Anthropic page it is marked **General practice**. The Claude features named are all from the Help Center.

## 2.5 Editing, adapting, refining and comparing

### Start from the reader

Before editing anything, answer four questions about the reader (General practice):

1. **What decision or action will they take with this?** An executive approving budget needs the recommendation, the cost and the risk. An engineer fixing a fault needs the steps.
2. **What do they already know?** Terms that are obvious to your team need defining for a customer.
3. **How much time will they give it?** A board member reads the first paragraph. A reviewer reads every line.
4. **Where will they read it?** A phone screen, a printed handout, a slide shown in a meeting, a spreadsheet a finance tool imports.

These answers belong in the request to Claude, not only in your head. Anthropic's own tips for Claude Docs make the same point: a good request says what the document is for, who will read it, and what it should cover.<sup>[1]</sup>

### Edit in order: substance, structure, then style

A useful editing order (General practice):

1. **Substance.** Is everything the reader needs present and correct? Is anything included that they do not need? This is [Chapter 6](/ccao-f/read/notes/06-checking-what-claude-wrote) work and comes first, because polishing a paragraph you later delete is wasted.
2. **Structure.** Is the most important thing first? For decision-makers, lead with the conclusion and the ask; put method and detail after.
3. **Style.** Length, tone, terminology, reading level, formatting for the medium.

The exam rewards noticing which layer the problem is in. If the CFO says "I couldn't find the number I needed," the fix is structure (lead with it), not tone. If a customer says "this is full of jargon," the fix is style. If a manager says "this is missing the Q3 data," no amount of style editing helps.

### Adapt without letting facts drift

A common job is turning one source into several versions: an incident report for executives, for affected staff, and for customers. Keep the **facts fixed and change the treatment**: depth, order, vocabulary, what to emphasize, what action you ask for (General practice).

The risk is that each rewrite changes details. A "simplified" customer version may round "about 4 hours of downtime" into "a brief interruption," or drop the caveat that some data may need re-entry. When you ask Claude to adapt, tell it explicitly which facts must not change (figures, dates, commitments, caveats), and after the rewrite check those facts against the source version, not against your memory of it.

Shortening is where caveats die. "Make it shorter" without saying what must stay invites Claude to cut the qualification that made the statement true.

### Refine with targeted feedback

Vague feedback ("make it better", "more professional") gets a different draft, not necessarily a better one. Specific feedback names the change and the reason: "The first paragraph should give the decision we need and the deadline; move the background to the end." Anthropic's guidance on consistent output says examples of what you want are **more effective than abstract instructions**.<sup>[2]</sup> If you have a past update that landed well with this reader, show it.

Claude's features help you refine without starting over:

- **Edit where you mean.** In a doc or Markdown document, highlight the text, choose "Edit with Claude" and describe the change; Claude edits where you marked it, so you do not have to describe which section you mean.<sup>[3]</sup> In Claude Docs you can also edit directly, ask Claude for the next pass in the conversation, or mention @Claude in a comment.<sup>[1]</sup>
- **Explore another direction safely.** Editing an earlier message creates a different version of the chat with its own artifacts, so you can try a second approach without losing the first.<sup>[3]</sup>
- **Make a recurring audience stick.** If you write for the same reader every week, put the audience and format rules into project instructions, or use a skill to adjust tone and format consistently.<sup>[4]</sup> (Project configuration is [Chapter 5](/ccao-f/read/notes/05-projects-knowledge-and-connectors).)

### Compare outputs against criteria

When you have two drafts (two prompts, two models, two runs), compare them on what matters to the reader, decided **before** you read them (General practice):

- **Same inputs.** If one draft had the spreadsheet and the other did not, you are comparing inputs, not drafts.
- **Written criteria.** For example: includes all five required sections; every figure matches the source; under 300 words; ends with a clear ask.
- **Check facts in both.** A more fluent draft can hold more errors.
- **Watch disagreement.** Where two runs disagree on a fact, that fact needs checking. Anthropic suggests comparing multiple runs precisely because inconsistency can signal hallucination.<sup>[5]</sup>

Anthropic recommends the same discipline for choosing between models: run side-by-side comparisons on the prompts and conversations that matter most to you.<sup>[6]</sup>

### Example

A communications manager at a regional water utility has a technical incident report about a pump failure. She needs three versions. For the executive team: four sentences, with what happened, customer impact, cost estimate and the decision needed (approve emergency spend). For field staff: the sequence of events and the new inspection step. For customers: what happened in plain language, whether water is safe, what to do, and when service returns. She gives Claude the report once, asks for the three versions with a list of facts that must be identical in all three (affected area, times, the boil-water status), then checks those facts in each version against the report. The customer version had changed "until further notice" to "until this evening". She corrected it before it went out.

### The traps

- **A persona or "more formal" for a content problem (family 2).** If the executive summary lacks the cost figure, telling Claude to "write like a seasoned consultant" produces confident prose without the cost figure.
- **Longer as better.** Asking for more detail when the reader has two minutes moves the output away from the reader.
- **Picking the draft that reads best.** Polish is not a criterion unless the reader's need is polish. Compare against the written requirements.
- **Trusting the adapted version.** Each rewrite is a new output and can introduce errors. Re-check fixed facts.
- **Starting from scratch every time (family 4).** Discarding a draft that is 90 percent right wastes the work. Use targeted edits.

## 2.6 Organizing, curating and choosing the output format

### Curating comes before formatting

Curating is deciding what goes in: selecting the relevant material, removing duplicates, grouping related points, ordering them for the reader, and flagging gaps ("no data received for site 8") instead of hiding them (General practice). When you give Claude a pile of notes, tell it what to keep and what to leave out, and ask it to list what it excluded so you can check that nothing important went.

### Choosing the container

The format question on the exam is about **how the output will be used**: read once, reused, edited with others, imported somewhere, or explored. Anthropic's pages give clear criteria for each container.

| Use | Best fit | What Anthropic's pages say |
|---|---|---|
| A quick answer you read and move on from | **Inline text** in the chat | The default; no container needed |
| Understanding something in the moment (a process, a trend in a CSV) | **Custom visual** | Built inline when a visual explains better; **ephemeral by default**, "like a whiteboard sketch"; keep it by copying as image, downloading, or saving as an artifact. Beta; web and desktop only, not on mobile<sup>[7]</sup> |
| Substantial, self-contained content you will edit, reuse or share | **Artifact** | Claude creates one when content is significant and self-contained (typically over 15 lines), likely to be edited or reused outside the chat, stands on its own and will be referred back to<sup>[3]</sup> |
| A document you will write and revise with colleagues | **Claude Docs** (an artifact template) | Living document; collaborators edit, comment and @mention Claude; changes attributed; exports to Word, PDF, Markdown and Google Docs<sup>[1][3]</sup> |
| A presentation | **Slides** template | Edit slides directly, present in Claude, export to PowerPoint or PDF<sup>[3]</sup> |
| A file someone needs in Office or as a PDF, especially with working formulas | **File creation** (.xlsx, .docx, .pptx, .pdf) | Financial models with working formulas, reports with charts; download or save to Google Drive; 30 MB per file<sup>[8]</sup> |
| Quick exploratory questions over company data | **Dashboards** template (beta) | Claude writes a query per chart, shows it and when data was refreshed; for deeper analysis, move to another tool<sup>[9]</sup> |
| Content a person or tool must consume in a fixed shape | **Structured output** (a table, a fixed template, CSV) | Define the format precisely and give examples so every output follows it<sup>[2]</sup> |

A few details decide items:

- **Persistence.** Custom visuals disappear as the conversation moves on unless you keep them. Artifacts are saved in the Artifacts tab and are "persistent and shareable from the start."<sup>[7]</sup> If the stem says "the team will reuse this every month", the throwaway visual is wrong.
- **Mobile.** Custom visuals do not render on Claude for iOS or Android.<sup>[7]</sup> If the reader is on a phone, a visual may not reach them.
- **Spreadsheets.** If finance needs to change an assumption and see totals update, an .xlsx with working formulas fits; a table pasted in chat does not.<sup>[8]</sup>
- **Requirement.** Artifacts require the code execution and file creation capability to be on. On Team and Enterprise plans that is an organization setting an Owner controls.<sup>[3]</sup>

### Sharing is part of the format decision

Where the output is going affects which container you pick, and who can see it. As of November 2026:<sup>[10]</sup>

- Artifacts start **private**. Nothing is shared until you share it.
- On Team and Enterprise plans, artifacts stay **inside your organization by default**. Sharing outside requires an Owner to turn on external sharing or allow that artifact.
- Access levels are Can view, Commenter and Can edit.
- Artifacts can store data. With **shared storage**, everyone using the artifact sees the same data. Anthropic warns you to check whether an artifact uses shared storage before entering anything sensitive.<sup>[3]</sup>

If a client outside your organization must see a deliverable and external sharing is off, the answer is not to find a workaround: export the file through your normal channel, or ask an Owner. (Organizational policy is [Chapter 11](/ccao-f/read/notes/11-responsible-use-privacy-and-policy).)

### Structured data for a person or a tool

When a downstream reader is a process (a weekly import into a tracker, a template the compliance team files), consistency matters more than prose quality. Anthropic's consistency guidance: define the output format precisely, provide examples of the output you want, and break complex tasks into smaller steps.<sup>[2]</sup> In practice for an Associate: give Claude the exact column names and order, say what to put when a value is missing ("n/a", never blank), and show one filled-in row. If outputs must be machine-validated or wired into another system automatically, that is developer work: escalate rather than trying to force it in chat.

### Example

A project manager at a construction firm produces three things from the same weekly site data. For the finance team: an .xlsx with fixed columns (site, budget, spend to date, forecast, variance) and formulas for variance, because they filter and re-use it. For the client: a two-page Claude Doc she shares with the client's project lead (an Owner has allowed external sharing for client deliverables), with comments enabled so questions sit next to the text. For her own Monday stand-up: she asks Claude in chat to "show this week's spend by site as a chart" and looks at it once. Three readers, three containers, one set of facts.

### The traps

- **Prose where structure is needed (family 2).** "Ask Claude to make the summary clearer" when the receiving team imports a fixed set of fields. Clarity does not create columns.
- **The impressive container for a simple need.** A dashboard or interactive artifact for a one-off answer someone reads once adds work and nothing else.
- **The ephemeral container for a reusable need.** A custom visual for a chart the team will update monthly will not persist on its own.
- **Ignoring the reader's device or access.** A visual that does not render on mobile, or a share link a client outside the organization cannot open.
- **Shared storage for personal data.** A team tracker artifact with shared storage shows everyone's entries to everyone.

## On the exam

- Identify the reader's decision, knowledge, time and medium before editing; put them in the request.
- Fix substance first, then structure, then style. Match the fix to the layer that failed.
- When adapting for several audiences, name the facts that must not change and re-check them in each version.
- Give specific feedback and examples; use targeted edits ("Edit with Claude", branching) instead of starting over.
- Compare drafts on written criteria with the same inputs, never on polish alone.
- Pick the container from how the output will be used: inline for read-once, custom visual for in-the-moment, artifact or Doc for reuse and collaboration, file creation for Office files with working formulas, structured output for anything consumed in a fixed shape.
- Artifacts start private; on Team and Enterprise they stay inside the organization unless an Owner allows external sharing.

## Notes

1. Claude Docs: living documents, editing directly, asking Claude, comments and @Claude, attribution of changes, and the tip that a good request says what the doc is for, who reads it and what it covers. Anthropic, "Get started with Claude Docs" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/16923645-get-started-with-claude-docs
2. Specify the output format precisely, constrain with examples (more effective than abstract instructions), and chain prompts for complex tasks. Anthropic, "Increase output consistency" (Claude Docs, accessed 2026-11-05), https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/increase-consistency
3. When Claude creates an artifact, templates (Docs, Slides, Design, Dashboards), "Edit with Claude" on highlighted text, editing an earlier message to branch, export formats, shared versus personal storage and its warning, and the capability requirement. Anthropic, "What are artifacts and how do I use them?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them
4. Profile instructions, project instructions, and skills for adjusting tone and format. Anthropic, "Understanding Claude's personalization features" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/10185728-understanding-claude-s-personalization-features
5. Best-of-N comparison: inconsistencies across outputs could indicate hallucinations. Anthropic, "Reduce hallucinations" (Claude Docs, accessed 2026-11-05), https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
6. Run side-by-side comparisons with the prompts that matter most when testing newer models. Anthropic, "Adapt to new model personas after deprecations" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12738598-adapt-to-new-model-personas-after-deprecations
7. Custom visuals are ephemeral by default, can be kept by copying, downloading or saving as an artifact, are in beta, and do not render on mobile; artifacts are persistent and shareable. Anthropic, "Custom visuals in chat and Cowork" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/13979539-custom-visuals-in-chat-and-cowork
8. File creation of .xlsx, .pptx, .docx and PDF; working formulas; download or save to Google Drive; 30 MB limit. Anthropic, "Create and edit files with Claude" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude
9. Dashboards show each chart's query and last refresh; meant for quick exploratory questions. Anthropic, "Get started with Claude Dashboards" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/17454700-get-started-with-claude-dashboards
10. Artifacts start private; Team and Enterprise artifacts stay inside the organization by default; external sharing set by an Owner; access levels. Anthropic, "Share artifacts" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/9547008-share-artifacts
