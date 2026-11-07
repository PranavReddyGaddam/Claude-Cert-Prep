# Chapter 5: Projects, Knowledge and Connectors

**Summary**: *A Claude configuration is a small system: instructions that say how to behave, knowledge that says what is true, connectors that reach live data in other apps, and Skills that encode repeatable procedures. Each layer has a job and a scope, from the organization down to a single chat. Good configuration puts each piece in the right layer, writes instructions that are short and testable, keeps one current version of each source, and treats every change as something to test. Connectors inherit the user's own permissions, and admins set the outer limits.*

This chapter covers all four Domain 5 objectives (Configuration and Knowledge Management, 12% of the exam). Choosing whether a job needs a Project at all is in [Chapter 2](/ccao-f/read/notes/02-choosing-the-feature). Memory and context limits are in [Chapter 4](/ccao-f/read/notes/04-context-and-memory). What data may go into Claude at all is in [Chapter 11](/ccao-f/read/notes/11-responsible-use-privacy-and-policy).

A note on change. As of November 2026 Anthropic is rolling out a new version of Projects (beta) in stages, starting with Claude Code, in which a project is one conversation that Claude splits into parallel threads.<sup>[1]</sup> Most chat users still have the current version, which this chapter describes. The principles (what goes in instructions, what goes in knowledge, how to maintain them) carry over.

## 5.1 Configuring Claude Projects with instructions and knowledge sources

### What a Project holds

A Project is a self-contained workspace with its own chat history and knowledge base. You upload documents to its knowledge and set Project instructions, and Claude uses both in every chat in the Project.<sup>[1]</sup> Each Project also has its own memory ([Chapter 4](/ccao-f/read/notes/04-context-and-memory)).<sup>[2]</sup> A few setup facts that appear in stems:

- **Claude can't see the Project's name or description.** They are for people. Anything Claude needs to know goes in instructions or knowledge.<sup>[2]</sup>
- **Chats in a Project don't share content with each other** unless it's added to the knowledge base.<sup>[2]</sup>
- **Free plans can create up to five Projects**, as of November 2026.<sup>[1]</sup>
- **On Team and Enterprise**, Projects can be private (only invited members) or shared with the whole organization, with "Can view" or "Can edit" permissions. Your chats inside a shared Project stay private unless you share them.<sup>[3]</sup>

### Instructions versus knowledge

The most important configuration decision is which layer a piece of content belongs in.

| Put it in **instructions** if it says… | Put it in **knowledge** if it is… |
|---|---|
| How Claude should behave: role, tone, format, what to do when sources conflict | Reference material Claude should draw on: policies, handbooks, product specs, past examples |
| Rules that apply to every chat in the Project | Content that is too long to restate, or that changes on its own schedule |
| "Cite the policy section for every answer" | The policy itself |

Anthropic's guidance on instructions is to keep them concise, using them for general context, key guidelines and Claude's role, and to reserve task-specific instructions for the chat itself.<sup>[4]</sup> Long project instructions crowd the context, and a policy pasted into instructions is harder to update than the same policy as a dated file in knowledge.

### Getting knowledge right

On paid plans, when Project knowledge approaches the context window limit, Claude switches automatically to retrieval (RAG) mode, expanding capacity by up to ten times. You'll see an indicator, and Claude uses a "project knowledge search" tool to pull the relevant parts instead of loading everything.<sup>[5]</sup> There is nothing to configure and you can't force it on or off; it switches back to in-context processing if the knowledge shrinks.<sup>[5]</sup> Anthropic says response quality stays consistent with in-context processing.<sup>[5]</sup>

Because retrieval depends on finding the right file, Anthropic's best practices are about organization:<sup>[5]</sup>

- **Use clear, descriptive filenames.** "Refund-policy-EU-2026-09.pdf" retrieves better than "final_v3.pdf".
- **Group related content in the same Project** so Claude can connect sources.
- **Reference specific documents by name** when you ask, to focus the search.

File facts (as of November 2026): Project files can be up to 30MB each, the number is unlimited as long as content fits Claude's limits, and Claude extracts text only from Project files except multimodal PDFs.<sup>[6]</sup> For non-PDF documents with embedded images, Claude won't read the images.<sup>[6]</sup> A chart pasted as an image inside a Word document is invisible to Claude; put the numbers in the text or a table.

Project knowledge also saves usage. Content in Projects is cached and counts less against your limits when reused, until the cache expires after a period of inactivity.<sup>[7]</sup> That is a reason to put core reference documents in the Project once, rather than uploading them to each chat.

### Worked example: an HR team's policy Project

An HR advisor, Mei, sets up "Ask HR" for managers. Her first version pastes the whole 40-page leave policy into the instructions and adds "be helpful and accurate". Answers are slow and sometimes quote the 2025 policy, which is also in knowledge.

Her second version:

- **Instructions** (short): "You answer leave and absence questions from line managers at Northwind. Use only the documents in this Project. Quote the policy section you rely on. If the documents don't answer the question, say so and direct the manager to hr@northwind.example. Don't give advice on individual disciplinary cases."
- **Knowledge**: the current leave policy, named with its effective date; the 2025 version removed; a one-page FAQ of common questions.
- **Sharing**: "Can view" for managers, "Can edit" for the two HR advisors.

### The traps

- **Policy text in instructions.** It works on day one and becomes the stale copy on day ninety.
- **Behavior rules buried in a knowledge file.** A rule like "always cite the section" sitting in page 12 of a document is easy for retrieval to miss.
- **Relying on the Project description.** Claude can't see it.
- **"Upload everything."** More files means more chances for an outdated or conflicting source to be retrieved.

## 5.2 Managing uploaded knowledge and connectors (e.g., Google Drive, Gmail)

### Uploads versus connected sources

You can give Claude information two ways: upload a copy, or connect the app where the information lives.

| | Uploaded file | Connected source |
|---|---|---|
| Freshness | A snapshot as of upload; you replace it when it changes | Live: a Google Doc added from Drive syncs to its latest version<sup>[8]</sup> |
| Permissions | Anyone with access to the chat or Project sees what you uploaded | Claude inherits each person's permissions in the source app<sup>[9]</sup> |
| Effort | Manual upkeep | Each user authenticates; admins enable on Team and Enterprise<sup>[9]</sup> |
| Good for | Stable reference documents | Email, calendars, living documents, work apps |

### How connectors work

Connectors let Claude access your apps, retrieve data and take actions in them. Claude inherits each person's permissions from the connected service: if you can't open a file in the source system, the connector can't reach it either.<sup>[9]</sup> You find connectors in the Connectors Directory, turn them on per conversation from the "+" menu, and manage them in **Customize > Connectors**.<sup>[9]</sup>

On Team and Enterprise plans (as of November 2026):<sup>[9]</sup>

- An Owner or Primary Owner must **enable a connector for the organization** before members can use it. Enabling it doesn't grant access; **each person still authenticates individually** (unless the connector uses Enterprise-managed auth or a shared credential).
- Owners can **restrict actions org-wide**: for example, let Claude read Gmail but not send, or read Drive but not edit. Each tool can be set to Always allow, Needs approval or Blocked, and users can't override the org setting.
- Members who can't add a connector can **request** one; requests are on by default on Team and off by default on Enterprise.
- **Connectors are only available in private Projects**, and **chats with synced content can't be shared**.

### Google Workspace specifics

The Gmail, Google Calendar and Google Drive connectors are available on all plans on Claude and Claude Desktop, with owner enablement first on Team and Enterprise.<sup>[8]</sup> Facts that shape good answers (as of November 2026):<sup>[8]</sup>

- **Gmail**: Claude can search, read and draft, and can send, reply and forward, but **asks for your approval before each send by default**. It sees attachment metadata, not attachment content.
- **Drive**: Claude extracts text only; images embedded in documents aren't processed. The Drive connector can add files to **private** Projects only; it's disabled for shared Projects.
- **Live editing**: separate Google Docs, Sheets and Slides connectors let Claude edit a file in a pane beside the chat. To get a Google file rather than a local download, ask for it by name ("a Google Doc") or paste a Google link.
- **Training**: Anthropic doesn't train on Gmail, Drive or Calendar connector data. On consumer plans with training allowed, content you copy and paste from those sources into a chat could be used.
- **Retention**: data retrieved by a connector is stored with its chat, so deleting the chat deletes it.
- **Admin blocks**: if a Google Workspace admin hasn't trusted the Claude app, users see "Access blocked"; the fix is on the Google admin side, not in Claude.

Microsoft 365 follows the same pattern: on a work account, a Claude Owner enables it and a Microsoft Entra Global Administrator grants one-time consent, and write tools depend on what the admin enabled.<sup>[10]</sup>

### Keeping connectors lean

Each connector takes space in the conversation. Anthropic's **Tool access** setting (per conversation) has three modes: **Auto** (default; Claude decides what to load), **Always available** (all loaded up front; best for fewer than 10 connectors you use constantly), and **On demand** (loaded only when needed; best for 10 or more, or when chats hit length limits).<sup>[11]</sup> Turning off connectors a chat doesn't need also helps context and usage.<sup>[12]</sup>

Two connector types sit outside the everyday path. **Desktop extensions** run locally in Claude Desktop and Claude Code for tools on your own computer, and aren't available on web or mobile.<sup>[13]</sup> **Custom connectors** link Claude to a remote MCP server; they can point at services Anthropic hasn't verified, so Anthropic says to connect only to servers from trusted organizations.<sup>[9]</sup> Building one, or connecting an internal system that sits behind a firewall, is a job for IT or a developer.

### Worked example: a sales coordinator's account briefs

Tomás prepares account briefs before client calls. He used to download the latest proposal from Drive and upload it, then paste in the last three emails. Now, on his company's Team plan, the admin has enabled Gmail and Drive with send blocked org-wide. Tomás authenticates once. In a private "Account briefs" Project he adds the master proposal template from Drive (it stays in sync) and asks Claude to pull the latest thread with the client from Gmail. When a colleague asks for a copy of the chat, he can't share it, because it contains synced content; he shares the finished brief instead.

### The traps

- **"The admin enabled it, so everyone has access."** Each user still authenticates, and Claude only sees what that user can see.
- **An instruction where a control is needed.** "Tell Claude never to send email" in a Project instruction is weaker than the org setting that blocks the send tool, or than the default approval prompt.
- **Uploading a copy of a living document.** The copy goes stale; connect the source.
- **Expecting Claude to read images or attachments.** Drive extracts text; Gmail sees attachment metadata.
- **Drive files in a shared Project.** Not available; it's limited to private Projects.

## 5.3 Creating effective system-level instructions

### The layers and who sets them

Claude takes standing instructions from several places. The exam expects you to put a rule at the right level.

| Layer | Set by | Applies to | Notes |
|---|---|---|---|
| Organization instructions | Owners and Primary Owners on Team and Enterprise | Every conversation for everyone in the org | Up to 3,000 characters (as of November 2026); take precedence over individual instructions on a direct conflict; can take up to an hour to apply<sup>[14]</sup> |
| Profile instructions ("Instructions for Claude") | Each user, in Settings > Your Claude | All of that user's conversations | Your role, preferred approach, terms you use<sup>[15]</sup> |
| Project instructions | Project editors | Chats in that Project | Project-specific context, workflow rules, roles<sup>[15]</sup> |
| Skills | Users, or owners provisioning for everyone | Load only when relevant to the task | Procedures, formats, specialized workflows<sup>[16]</sup> |
| The prompt | You, in the chat | That conversation | Task-specific detail |

Anthropic's own rule of thumb: use profile instructions for account-wide settings, Project instructions for a particular Project, and Skills for task-specific behavior.<sup>[15]</sup> Custom instructions apply broadly; Skills only load when relevant, which makes them better for specialized workflows.<sup>[16]</sup>

When organization and individual instructions conflict directly, Claude favors the organization's. Individual instructions still apply to anything the organization's don't address. Anthropic notes this prioritization is prompt-level, so behavior may vary in rare edge cases, and recommends testing.<sup>[14]</sup>

### Writing instructions that work

Anthropic's best practices for organization instructions apply to any standing instruction:<sup>[14]</sup>

- **Concise and clear.** Organization instructions are included in every message from everyone, so shorter keeps conversations efficient.
- **Specific.** Not "be professional" but "Respond in formal English. Don't use contractions, slang or emojis."
- **Consistent behaviors only.** Use them for what should apply everywhere: format, tone, organization context.
- **No internal conflicts.** If instructions contradict each other, Claude may not follow either reliably.
- **Can't override safety.** Instructions that conflict with Claude's built-in safety guidelines won't be followed.
- **Test, then review regularly.** Start a new conversation after saving, try several kinds of question, and remove instructions that are no longer relevant.

Add the habits from [Chapter 1](/ccao-f/read/notes/01-prompts-that-define-the-job): give the reason for a rule, and say what to do rather than only what to avoid. "When a manager asks about an individual case, don't advise; give the HR contact" works better than "never discuss individual cases".

**General practice.** Instructions are where you set Claude's behavior when information is missing: "If the documents don't cover it, say so and give the contact." Without that line, Claude's default is to be helpful, which can mean filling the gap.

### What instructions can't do

An instruction is a request to the model. It is not a permission setting. "Don't read files from the Finance folder" doesn't stop a connector that has access; removing access does. "Keep customer data private" doesn't change retention; plan and admin settings do. Anthropic's own example organization instruction about not including personal information in responses is a good habit, but it sits alongside data controls, not in place of them.<sup>[14]</sup> When a stem's requirement is a hard boundary, look for the setting.

### Skills as reusable instructions

A Skill is a folder with at minimum a skill.md file whose name and description tell Claude when to use it, plus instructions and optionally scripts or reference files.<sup>[17]</sup> Claude reads the short description first and loads the rest only when the task calls for it, which keeps context light.<sup>[17]</sup><sup>[16]</sup> Anthropic's advice on good skills: solve one specific, repeatable task, give clear instructions, include examples where helpful, say when the skill should be used, and keep each skill to one workflow.<sup>[17]</sup> If Claude isn't using a skill, check that it's toggled on, that its description clearly says when to use it, and try naming it in your request.<sup>[18]</sup>

Skills need code execution on.<sup>[16]</sup> Install skills only from trusted sources, and review a skill shared by a colleague before enabling it, especially any code or instructions to connect to outside network sources.<sup>[18]</sup>

## 5.4 Informing, maintaining and updating configurations, knowledge sources and instructions

### Knowledge has a lifecycle

**General practice.** Uploading is the easy part. A Project stays trustworthy only if someone owns it, its sources are current, and old versions leave. A simple routine:

1. **Name an owner** for each Project and each shared Skill.
2. **Date your sources** in the filename, and keep one current version. When a policy changes, replace the file; don't add the new one beside the old.
3. **Review on a schedule** (monthly for fast-moving content). Remove files no longer used; Anthropic recommends this for both context and usage.<sup>[12]</sup>
4. **Keep a short test set**: five or so questions with known right answers. Rerun them after any change to instructions or knowledge.
5. **Tell people** what changed, especially when you change sharing or behavior.

### Product behaviors that affect maintenance

As of November 2026:

- **Organization instructions** can take up to an hour to take effect across Claude products. Test in a new conversation once they have.<sup>[14]</sup>
- **Shared Skills** are view-only for recipients and update automatically: when the owner updates a skill, recipients get the new version at next use.<sup>[18]</sup>
- **Published Skills** (Team and Enterprise) are managed by the organization. If review is required, an update goes through the same review, and everyone stays on the approved version until it's approved.<sup>[18]</sup>
- **Provisioned Skills** from an owner appear for everyone and are on by default; users can toggle them off.<sup>[19]</sup>
- **Archiving a Project doesn't revoke access.** Members, permissions and knowledge are preserved; to remove someone, change sharing.<sup>[2]</sup>
- **Turning off Project sharing** (an owner setting) stops new shares, keeps existing shares, and turns existing public Projects private.<sup>[20]</sup>
- **Drive-linked documents** stay in sync, so a Project using them reflects edits in Drive without re-uploading; if a user loses access to the document, it disappears from their conversations.<sup>[8]</sup>

### Worked example: a training team's quarterly refresh

A learning and development team runs a "Course builder" Project and a "Lesson plan format" Skill shared with twelve trainers. In Q3 the company changes its brand template.

The lead updates the Skill once; the trainers get the new version at their next use. She replaces the old brand guide in the Project's knowledge with the new dated file, deletes the old one, and adds one line to the instructions: "Use the 2026-Q3 brand guide; ignore older templates in examples." She reruns her five test requests. One output still uses the old colour palette, because a sample lesson in knowledge used it. She replaces the sample. Then she posts a two-line note to the trainers saying what changed.

### The traps

- **Appending instead of replacing.** Keeping "policy-v1" and "policy-v2" side by side invites retrieval of the wrong one.
- **Changing instructions without testing.** Instructions interact; a new rule can conflict with an old one.
- **Archiving to remove access.** Archiving keeps members and permissions.
- **Assuming an update reached everyone instantly.** Org instructions can take up to an hour; published skill updates may wait for review.
- **Fixing a data boundary with wording.** If the requirement is "this team must not access that folder", the answer is permissions, not a sentence in the instructions.

## On the exam

- Instructions say how to behave; knowledge holds what is true. Keep instructions short; put reference documents in knowledge with clear, dated filenames.
- Claude can't see a Project's name or description. Chats in a Project don't share content except through knowledge (and Project memory).
- RAG switches on automatically on paid plans when knowledge approaches the context limit; there's nothing to configure.
- Connectors inherit each user's permissions. On Team and Enterprise, owners enable, each user authenticates, and owners can restrict actions org-wide.
- Gmail asks before sending by default and can't read attachments; Drive reads text only and works with private Projects only; chats with synced content can't be shared.
- Organization instructions beat individual instructions on a direct conflict, apply to everyone, max 3,000 characters, up to an hour to apply.
- Profile instructions for everywhere, Project instructions for one body of work, Skills for task-specific procedures.
- An instruction is not a control. Hard boundaries come from permissions and admin settings.
- Maintain by owning, dating, replacing, reviewing on a schedule and rerunning a fixed test set after every change.

## Endnotes

1. Projects as workspaces with knowledge and instructions, Free plan limit of five, RAG on paid plans, Team and Enterprise sharing permissions, and the new version of projects (beta). Anthropic, "What are projects?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/9517075-what-are-projects
2. Creating projects, Claude not seeing the name and description, adding knowledge and instructions, context not shared across chats, project memory, and archiving preserving access. Anthropic, "How can I create and manage projects?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects
3. Public and private projects, Can view and Can edit, and chats staying private in shared projects. Anthropic, "Manage project visibility and sharing" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/9519189-manage-project-visibility-and-sharing
4. Keep project instructions concise, for general context, key guidelines and Claude's role; reserve task-specific instructions for the chat. Anthropic, "How do usage and length limits work?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/11647753-how-do-usage-and-length-limits-work
5. RAG activation, the project knowledge search tool, capacity up to 10x, no setup, quality, and best practices for filenames, grouping and referencing documents. Anthropic, "Retrieval augmented generation (RAG) for projects" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/11473015-retrieval-augmented-generation-rag-for-projects
6. Project file limits and text-only extraction except multimodal PDFs; embedded images in non-PDF documents not read. Anthropic, "Upload files to Claude" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/8241126-upload-files-to-claude
7. Project content cached and counting less against limits when reused, cache expiry after inactivity. Anthropic, "Usage limit best practices" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/9797557-usage-limit-best-practices
8. Gmail, Calendar and Drive capabilities, send approval by default, attachment metadata only, text-only extraction, private projects only, live editing and naming Google files, training and retention, admin trust settings, and sync behavior. Anthropic, "Use Google Workspace connectors" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/10166901-use-google-workspace-connectors
9. What connectors are, inherited permissions, Team and Enterprise enablement and individual authentication, action restrictions, connector requests, custom connectors, private projects only, and chats with synced content not shareable. Anthropic, "Use connectors to extend Claude's capabilities" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities
10. Microsoft 365 connector availability and admin setup for work accounts. Anthropic, "Connect to Microsoft 365" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/15183774-connect-to-microsoft-365
11. Tool access modes and recommendations by number of connectors. Anthropic, "Manage Claude's tool access" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/13730515-manage-claude-s-tool-access
12. Removing unused project files and turning off unneeded tools to save context and usage. Anthropic, "How large is the context window on paid Claude plans?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/8606394-how-large-is-the-context-window-on-paid-claude-plans
13. Desktop extensions for local tools, available only in Claude Desktop and Claude Code. Anthropic, "When to use desktop and web connectors" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/11725091-when-to-use-desktop-and-web-connectors
14. Organization instructions: who sets them, scope, precedence, 3,000-character limit, up to an hour to apply, and best practices. Anthropic, "Set organization instructions" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/14546867-set-organization-instructions
15. Profile instructions, project instructions and skills, and choosing between them. Anthropic, "Understanding Claude's personalization features" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/10185728-understanding-claude-s-personalization-features
16. Skills: progressive loading, code execution requirement, comparisons with projects and custom instructions. Anthropic, "What are skills?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12512176-what-are-skills
17. Skill structure, name and description metadata, progressive disclosure, and what makes a good skill. Anthropic, "How to create custom skills" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12512198-how-to-create-custom-skills
18. Sharing and publishing skills, automatic updates for recipients, review for published updates, security advice, and troubleshooting a skill Claude isn't using. Anthropic, "Use skills in Claude" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12512180-use-skills-in-claude
19. Owner-provisioned skills available to everyone and enabled by default. Anthropic, "Provision and manage skills for your organization" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/13119606-provision-and-manage-skills-for-your-organization
20. Turning off project sharing and public projects, and their effects on existing shares. Anthropic, "Control project sharing for your organization" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/9927533-control-project-sharing-for-your-organization
