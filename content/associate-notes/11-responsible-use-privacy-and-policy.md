# Chapter 11: Responsible Use, Privacy and Policy

**Summary**: *Responsible use is mostly about controls, not intentions. Know which uses Anthropic's Usage Policy forbids and which it allows only with a qualified human and disclosure. Know what happens to data on each kind of plan, because a consumer account and a Team or Enterprise account follow different rules. When policy says data must not go somewhere, the answer is to keep it out or use the approved plan and setting, never to add a line to the prompt asking Claude to be careful. And when Claude acts for you, you remain responsible for what it does.*

This chapter covers all four objectives of Domain 6. Deciding when a human must review ordinary output is in [Chapter 7](/ccao-f/read/notes/07-when-a-human-must-review). Incognito chats and memory as context tools are in [Chapter 4](/ccao-f/read/notes/04-context-and-memory).

A warning on dates. Plan names, features and retention rules change. Every number here is cited and correct as of November 2026. On the exam, choose the option that reflects the principle (commercial data isn't trained on by default, high-risk decisions need a qualified human) over one that depends on a remembered detail.

## 6.1 Appropriate and inappropriate use cases

### Three tiers in the Usage Policy

Anthropic's Usage Policy sorts uses into three groups. Learning the shape is more useful than memorizing the list.

**1. Prohibited for everyone (Universal Usage Standards).** Examples relevant to office work:<sup>[1]</sup>

- compromising privacy, such as collecting non-public personal data without permission, or compiling profiles of individuals from multiple sources for sale or disclosure without their awareness;
- surveillance: tracking a person's location, communications or online activity without consent, scoring people on trustworthiness or social behaviour without notice or consent, and emotion recognition except for medical or safety reasons;
- fraud and deception: phishing, fake documents or records, misrepresenting professional credentials, spam;
- impersonating real people, or making people think they are talking to a human when they are not (clearly disclosed parody, satire and fiction are allowed);
- plagiarism, or submitting AI-assisted work without proper permission or attribution;
- making or suggesting decisions in law enforcement or criminal justice processes.

**2. Allowed only with controls (High-risk use cases).** Some uses affect a person's health, legal rights, finances, livelihood, or access to housing, education or essential services. When Claude is used to make a **High-risk AI Recommendation**, two requirements apply:<sup>[1]</sup>

- **Qualified human-in-the-loop.** A qualified person must meaningfully review the recommendation, with authority to change it, before it is delivered as advice someone might rely on or used to implement a decision. "Qualified" means trained or experienced in the field, and licensed where the law requires. That person stays responsible for the result.
- **Disclosure.** The person who receives the advice, or who is the subject of the decision, must be clearly told AI was used. You don't need to name Anthropic, Claude or the model.

The policy lists the high-risk areas: legal, medical (including mental health), finance (personalized investment advice, someone's own taxes), credit, insurance, housing, **employment** (screening, ranking or rejecting candidates; hiring; promotion; setting pay or shifts; evaluating performance; discipline), **education and credentials** (admissions; grading an exam that decides admission, graduation, licensure or certification, outside multiple-choice testing; academic misconduct findings), healthcare access, public benefits, and legal status and adjudication.<sup>[1]</sup>

**3. Allowed (exclusions).** The requirements do *not* apply to work that supports a high-risk area without delivering the recommendation itself. The policy's examples include general or educational information that isn't applied to the individual, explaining a decision a qualified person already made, **internal drafting, research, summarization or analysis that is not the final recommendation delivered**, applying a fixed rule where the model uses no judgment about the person, and business operations that don't advise or decide about a specific individual.<sup>[1]</sup> There is also a narrow exception for decisions wholly favourable to the person (paying an insurance claim, granting a benefit). A partial approval or a reduced amount doesn't count as wholly favourable.<sup>[1]</sup>

This tiering is where many exam items live. A recruiter asking Claude to summarize the job description is fine. A recruiter asking Claude to rank 200 applicants and reject the bottom half is a high-risk employment recommendation: it needs a qualified person who meaningfully reviews it with authority to change it, and the candidates must be told AI was involved.

### Other rules worth knowing

- **AI disclosure for chatbots.** Any consumer-facing chatbot or agent that talks directly to external users must disclose that it is AI, at least at the start of each session or in the interface.<sup>[1]</sup>
- **Agents follow the same policy.** Anthropic gives agent-specific examples of misuse: monitoring people without consent, building profiles from protected attributes, sites that mimic real ones, impersonation, spam, manipulating polls or engagement metrics, and using someone's stored credentials without authorization.<sup>[2]</sup> You are responsible for what agents you run do through tools and browsers.<sup>[1]</sup>
- **Using outputs to train models.** You own your outputs. You may use them to train models that don't compete with Anthropic, such as a sentiment classifier, a content categorizer or a semantic search tool. Training a general-purpose chatbot or open-ended text generator on Claude's outputs is prohibited without written permission.<sup>[3]</sup>
- **Safety systems.** Anthropic uses detection models and safety filters that can block responses, and may apply enhanced filters to users who repeatedly violate policy. They aren't perfect; false positives happen.<sup>[4]</sup> Repeated violations can lead to a ban, which can be appealed through a form while logged in.<sup>[5]</sup>

### The traps

- **Over-blocking.** "Claude must not be used anywhere near hiring." Wrong: drafting a job ad or summarizing interview notes for the panel is internal drafting. The controls attach to the recommendation or decision about a person.
- **Under-controlling.** "A manager glances at Claude's shortlist before rejections go out." A glance without real authority or expertise is not meaningful review, and the candidates still need disclosure.
- **"It's only internal."** An internal tool that scores employees for promotion is still an employment decision about individuals.
- **An instruction where a control is needed.** "Tell Claude to be unbiased" does not satisfy the human review or disclosure requirement.

## 6.2 Data sensitivity, regulatory and privacy considerations

### Consumer and commercial plans follow different rules

This table is the single most useful thing in the chapter. "Consumer" means Free, Pro, Max and Ultra. "Commercial" means Team, Enterprise and the API.

| Question | Consumer plans | Commercial plans |
|---|---|---|
| Are my chats used to train models? | Only if you allow it in privacy settings, if a chat is flagged for safety review, or if you opt into a programme<sup>[6]</sup> | **Not by default.** Only if you send feedback (thumbs up/down) or otherwise choose to allow it<sup>[7]</sup> |
| Who controls the data? | You, under the Consumer Terms and Privacy Policy | **Your organization is the controller**; Anthropic is the processor and handles data only as the customer instructs<sup>[8]</sup> |
| How long is a deleted chat kept? | Removed from history at once, deleted from back-end storage within 30 days<sup>[9]</sup> | Same: removed at once, deleted from back-end within 30 days<sup>[10]</sup> |
| Can retention be customized? | No | **Enterprise** Owners can set a custom period (minimum 30 days)<sup>[11]</sup> |
| Training retention if allowed | De-identified, up to 5 years<sup>[9]</sup> | Not applicable by default |

Other facts that decide items:

- **Feedback sends the whole conversation.** A thumbs up or down stores the entire related conversation for up to 5 years, de-linked from your ID, and it may be used for training on both consumer and commercial plans. On Team and Enterprise, an Owner can turn off the **Rate chats** setting.<sup>[6][7]</sup> Rating a chat that contains client data is sharing that data with Anthropic.
- **Policy-flagged chats** keep inputs and outputs for up to 2 years and classification scores for up to 7 years, on every plan.<sup>[9][10]</sup>
- **Connector content.** Raw content from connectors such as Google Drive isn't included in consumer training data or feedback data, unless it is copied directly into the conversation.<sup>[6]</sup>
- **Incognito chats** aren't saved to history or memory and aren't used for training. They are still kept for 30 days (or longer under an Enterprise retention setting). On Team and Enterprise they appear in organization data exports and the Compliance API. They aren't available inside projects.<sup>[12]</sup> Incognito is a privacy convenience, not a way to put restricted data into an unapproved workspace.
- **Consumer advice on sensitive data.** Anthropic recommends being thoughtful about sharing financial identifiers, health records, passwords and confidential business documents.<sup>[13]</sup>
- **Covered models.** For Mythos-class models and similar models Anthropic designates as covered, prompts and outputs are kept for 30 days for safety work on every platform. This mostly affects organizations with zero data retention arrangements.<sup>[14]</sup>

### Regulated data: HIPAA

Protected health information (PHI) needs the HIPAA-ready offering. As of November 2026:<sup>[15]</sup>

- It is available on **Enterprise plans only**. Team and individual plans can't enable it.
- Only the **Primary Owner** can accept the Business Associate Agreement (BAA) and enable it. It is a one-way change and resets some settings.
- Enabling HIPAA doesn't bring every feature under the BAA. Features are covered, available but not covered, or disabled. **PHI should only go through covered features.** Cowork and Claude Code need an extra configuration before they are covered.
- Claude in Chrome is off by default under HIPAA and is not covered by the BAA even when turned on.<sup>[16]</sup>

So "we have Enterprise, so PHI is fine" is wrong, and so is "we enabled HIPAA, so every feature is fine".

### Legal work and confidentiality

Anthropic's page on legal work makes three points an Associate in a legal or compliance team should know. Commercial terms (with no training by default and a data processing agreement) are the baseline expectation for legal technology. Lawyers should consider whether a matter needs stronger arrangements. And they should keep a lawyer visibly directing the work, verify output against primary sources, and document AI use. The page is explicit that it isn't legal advice, and that the configuration question is one for your own counsel.<sup>[17]</sup>

### Workplace example

An HR coordinator on a personal Pro account wants to paste ten employee grievance letters into Claude to draft a summary for the director. The data is confidential, it identifies people, and her company has a Team plan with an AI policy. The right move is to use the company's Team workspace (commercial terms, no training by default, organization control), follow the policy on what personnel data may go in, and remove what the summary doesn't need. "Use incognito on my Pro account" and "tell Claude not to remember it" both fail: the first is still the wrong account, and the second is an instruction, not a control.

### The traps

- **An instruction where a control is needed.** "Add a line telling Claude to keep this confidential." Prompts don't change retention, training or who can access data. Remove the data, or use the approved plan and setting.
- **Assuming one rule for all plans.** Consumer training depends on your setting; commercial is off by default. Custom retention is Enterprise only.
- **Thinking delete means gone instantly.** Deletion from history is immediate; back-end deletion takes up to 30 days; flagged content can be kept longer.
- **Forgetting feedback.** A thumbs-down on a chat sends the whole conversation to Anthropic.
- **Treating HIPAA as a switch for everything.** Only covered features may handle PHI.

## 6.3 Following organizational AI policies and governance standards

### Who controls what in a Team or Enterprise organization

On a Team or Enterprise plan, the organization decides which features members can use and may limit some. The Primary Owner manages the account and its data, including exporting members' conversations and files.<sup>[18]</sup> When the organization has an internal AI policy, that policy applies on top of Anthropic's terms, and questions about privacy go to the organization's owners.<sup>[18]</sup> The controls an Associate should recognize:

| Control | Who sets it | What it does |
|---|---|---|
| **Organization instructions** | Owners, Primary Owners (Team, Enterprise) | Instructions Claude follows in every conversation in the organization. They win over a user's conflicting instruction. Up to 3,000 characters, may take up to an hour to apply (as of November 2026). They can't switch off Claude's safety behaviour<sup>[19]</sup> |
| **Project sharing** | Owners, Primary Owners | Turn off sharing, or only public projects. Turning off public projects makes existing public projects private<sup>[20]</sup> |
| **Custom data retention** | Owners, Primary Owners (Enterprise) | Sets how long chats, projects and artifacts are kept; minimum 30 days; deletion is permanent; changes are in audit logs<sup>[11]</sup> |
| **Model access** | Owners, Primary Owners, some custom roles (Enterprise) | Enables or disables models and caps effort. Haiku models can't be disabled<sup>[21]</sup> |
| **Web search, Claude in Chrome** | Owners | Can be turned off for chat and Cowork, or Chrome allow- and blocklists set<sup>[22][16]</sup> |
| **Feature switches** | Owners | Code execution, network access, Dashboards and smart reports, among others<sup>[23]</sup> |

A good Associate reads this as: if you need something the organization has switched off, ask the owner. Don't route around it with a personal account.

### Sharing is a governance decision

- **Projects.** On Team and Enterprise, a project is public (everyone in the organization can view and use it) or private (invited members only). Even in a public project, your chats stay private unless you share them. Members get "Can view" or "Can edit".<sup>[24]</sup> A removed member's private projects become inaccessible to everyone else, so hand over work before someone leaves.<sup>[25]</sup>
- **Chats.** On Free, Pro, Max and Ultra, a shared chat can be a public link anyone can open without an account. Anthropic's rule is simple: "treat a public link as public". Turning it off can't remove copies people already made. Team and Enterprise members can only share chats inside the organization.<sup>[26]</sup>
- **Artifacts.** On Team and Enterprise, artifacts stay inside the organization by default; an owner decides whether anyone can share outside it. Some artifacts store information everyone who opens them can see, so check before entering sensitive data.<sup>[27]</sup>

### Marking AI-generated content

Anthropic has signed the EU AI Act Code of Practice on transparency. Supported Claude models embed an invisible watermark in generated text, and generated files carry Content Credentials (C2PA) where supported.<sup>[28]</sup> Know the limits. A detected mark means the content *may* have been processed by Claude, not that Claude wrote it. A missing mark doesn't prove a human wrote it, because heavy editing, short passages, older models or stripped file metadata can all remove the signal.<sup>[28]</sup> Watermarks don't replace your organization's own disclosure rules.

### The traps

- **Route-around.** "The admin turned off web search, so use a personal account for that part." The control exists on purpose. Ask for it, or use an approved alternative.
- **Instruction over setting.** "Add 'never mention client names' to my personal instructions" when the organization needs that rule everywhere. That is an organization instruction set by an Owner, and data rules are better enforced by keeping the data out.
- **Public link as private.** Sending a public chat link "only to one person" still makes it public.
- **Watermarks as proof.** Using the presence or absence of a mark to accuse a student or colleague.

## 6.4 The ethical implications of AI use

### Accountability stays with people

Anthropic is direct about this for agentic features. With Cowork and Claude in Chrome, **you remain responsible** for actions Claude takes for you: content published, messages sent, purchases, data accessed or changed, actions by scheduled tasks, and respecting other websites' terms.<sup>[29][16]</sup> The same idea runs through the Usage Policy's human-in-the-loop rule: the qualified person "remains responsible for the accuracy and appropriateness" of what is delivered.<sup>[1]</sup>

### Agents can be manipulated

When Claude reads content you don't control (web pages, emails, shared documents), it may meet **prompt injection**: hidden instructions written to hijack it. An attack needs two things at once: Claude can read untrusted content, and it can take actions that harm you.<sup>[29]</sup> Remove either and the risk drops. Anthropic's advice:<sup>[29][16]</sup>

- Give Cowork a dedicated working folder rather than broad access, and keep backups.
- Use "Manually approve" for sensitive files, new tools or sites, and anything hard to undo.
- Watch for scope creep: files or sites you didn't mention, unrelated topics, requests for sensitive information. Stop the task and report it.
- Don't use Claude in Chrome on sensitive sites (banking, health, legal documents, work accounts with sensitive data). Consider a separate browser profile. Claude takes screenshots of the tab, so whatever is visible becomes part of the conversation.
- Claude in Chrome is prohibited from stock trading, bypassing captchas, inputting sensitive data and scraping facial images.

### Fairness, transparency and people

**General practice.** Bias isn't fixed by telling Claude to be fair. It is managed by deciding who is affected, checking outcomes across groups, keeping a qualified person accountable, and giving affected people a way to question the result. Transparency means telling people what they need to know in plain language: that AI helped, what a person checked, and who to contact.

Anthropic builds some of this into its own tools. Smart reports must not be used to evaluate individuals, they hide names by default, and they won't answer questions about protected characteristics, health, union activity or personal life.<sup>[30]</sup> Read that as a signal of where the ethical lines are in workplace analytics.

### Workplace example

A university administrator wants Claude to flag "students likely to cheat" from writing samples and send warning emails. Several lines are crossed at once. An academic misconduct determination is a high-risk education decision, so it needs a qualified person and disclosure.<sup>[1]</sup> Watermark absence or presence can't settle authorship.<sup>[28]</sup> And sending emails automatically is a consequential, hard-to-undo action. A defensible version: Claude helps staff draft a clear AI-use policy and summarizes cases that staff have already flagged, while a qualified panel decides each case and tells the student how AI was used.

### The traps

- **Trusting the model's self-report.** "Ask Claude whether its ranking is biased." That is not a fairness check.
- **Responsibility shifted to the tool.** "Claude sent it, not me." Anthropic says you remain responsible.
- **Blanket bans.** "Ban AI in the admissions office." Drafting and research are allowed; the controls attach to decisions about people.
- **Speed over consent.** Monitoring staff or customers without notice or consent is prohibited, however useful.

## On the exam

- Know the three tiers: **prohibited** uses, **high-risk** uses that need a qualified human with authority to change the result plus disclosure, and **excluded** support work such as internal drafting and research.
- Employment, education, credit, insurance, housing, legal, medical and finance decisions about individuals are **high-risk**. Law enforcement decisions are **prohibited**.
- **Commercial** plans don't train on data by default and the organization is the data controller. **Consumer** training depends on the user's setting.
- **Feedback** sends the whole conversation to Anthropic. **Incognito** isn't used for training but is still kept 30 days and appears in Team and Enterprise exports.
- PHI needs a **HIPAA-ready Enterprise** plan and only **covered** features.
- Never answer a data-control problem with a **prompt instruction**. Remove the data, or use the approved plan, workspace or admin setting.
- Treat a **public link as public**. Team and Enterprise chats can't be shared outside the organization.
- With agents, **you remain responsible**. Narrow access, approve manually when stakes are high, and stop on suspicious behaviour.

## Endnotes

1. Universal Usage Standards (privacy, surveillance, fraud, impersonation, plagiarism and attribution, criminal justice), High-risk Use Case Requirements (qualified human-in-the-loop, disclosure, the list of high-risk areas, exclusions, favourable decisions), chatbot AI disclosure and agentic responsibility. Anthropic, "Usage Policy" (Anthropic, accessed 2026-11-05), https://www.anthropic.com/legal/aup
2. Agent-specific examples of prohibited surveillance, harmful content, scaled abuse and unauthorized access. Anthropic, "Using Agents According to Our Usage Policy" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12005017-using-agents-according-to-our-usage-policy
3. Output ownership and permitted versus prohibited model training on outputs. Anthropic, "Can I use my Outputs to train an AI model?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12326764-can-i-use-my-outputs-to-train-an-ai-model
4. Detection models, safety filters, enhanced filters and false positives. Anthropic, "Our Approach to User Safety" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/8106465-our-approach-to-user-safety
5. Account bans, appeals, and warnings. Anthropic, "Safeguards warnings and appeals" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/8241253-safeguards-warnings-and-appeals
6. Consumer training conditions, connector content, incognito, and feedback storage for 5 years. Anthropic, "Is my data used for model training?" (Claude Privacy Center, accessed 2026-11-05), https://privacy.claude.com/en/articles/10023580-is-my-data-used-for-model-training
7. Commercial products not used for training by default, feedback storage, and the Rate chats setting. Anthropic, "Is my data used for model training?" (Claude Privacy Center, accessed 2026-11-05), https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training
8. Customer as controller and Anthropic as processor for Team and Enterprise. Anthropic, "Does Anthropic Act as a Data Processor or Controller?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/9267385-does-anthropic-act-as-a-data-processor-or-controller
9. Consumer retention: deletion within 30 days, 5-year de-identified training retention, policy-violation retention. Anthropic, "How long do you store my data?" (Claude Privacy Center, accessed 2026-11-05), https://privacy.claude.com/en/articles/10023548-how-long-do-you-store-my-data
10. Commercial retention: deletion within 30 days, incognito, covered models and policy-violation retention. Anthropic, "How long do you store my organization's data?" (Claude Privacy Center, accessed 2026-11-05), https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data
11. Enterprise custom retention: Owner roles, 30-day minimum, what is deleted, permanence and audit logs. Anthropic, "Configure custom data retention controls for Enterprise plans" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/10440198-configure-custom-data-retention-controls-for-enterprise-plans
12. Incognito chats: not saved to history or memory, not used for training, 30-day retention, included in Team and Enterprise exports and the Compliance API, not available in projects. Anthropic, "Use incognito chats" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12260368-use-incognito-chats
13. Recommendation to be thoughtful about sharing highly sensitive personal details. Anthropic, "I would like to input sensitive data into my chats with Claude. Who can view my conversations?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/8325621-i-would-like-to-input-sensitive-data-into-my-chats-with-claude-who-can-view-my-conversations
14. 30-day retention for covered models and who it affects. Anthropic, "Data retention practices for Covered Models" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/15425996-data-retention-practices-for-covered-models
15. HIPAA-ready offering: Enterprise only, Primary Owner acceptance, irreversibility, covered versus not covered features, Cowork and Claude Code configuration. Anthropic, "HIPAA-ready Enterprise plans" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/13296973-hipaa-ready-enterprise-plans
16. Claude in Chrome risks, screenshots, regulated data under HIPAA, prohibited actions, recommendations, admin allowlists and user responsibility. Anthropic, "Use Claude in Chrome safely" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12902428-use-claude-in-chrome-safely
17. Commercial terms as a baseline for legal work, keeping a lawyer in the loop, verifying against primary sources, and the not-legal-advice caveat. Anthropic, "Using Claude for Legal Work: Privilege, Confidentiality, and How to Think About Configuration" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/15707726-using-claude-for-legal-work-privilege-confidentiality-and-how-to-think-about-configuration
18. Primary Owner management of data and exports, organizational feature limits and internal policies. Anthropic, "Who owns and manages the data of my team?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/9265372-who-owns-and-manages-the-data-of-my-team
19. Organization instructions: who sets them, precedence, 3,000-character limit, delay, and inability to override safety. Anthropic, "Set organization instructions" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/14546867-set-organization-instructions
20. Organization controls for project sharing and public projects. Anthropic, "Control project sharing for your organization" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/9927533-control-project-sharing-for-your-organization
21. Model access and effort caps on Enterprise; Haiku always available. Anthropic, "Manage model access for your organization" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/15694740-manage-model-access-for-your-organization
22. Owners can turn off web search for Cowork and chat. Anthropic, "Get started with Claude Cowork" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork
23. Owner controls for code execution, file creation and network egress. Anthropic, "Create and edit files with Claude" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude
24. Public and private projects, chats private by default, view and edit permissions. Anthropic, "Manage project visibility and sharing" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/9519189-manage-project-visibility-and-sharing
25. What happens to a removed member's projects and chats. Anthropic, "What happens to a user's data when they are removed from a Team or Enterprise organization?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12053672-what-happens-to-a-user-s-data-when-they-are-removed-from-a-team-or-enterprise-organization
26. Public links: consumer plans only, no account needed, "treat a public link as public", copies not removed, Team and Enterprise sharing inside the organization only. Anthropic, "Public links for shared chats" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/16762437-public-links-for-shared-chats
27. Artifacts inside the organization by default on Team and Enterprise, owner control of external sharing, shared storage caution. Anthropic, "Share artifacts" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/9547008-share-artifacts
28. Watermarks and Content Credentials, EU Code of Practice, and the limits of detection. Anthropic, "How Claude marks AI-generated content" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/16266773-how-claude-marks-ai-generated-content
29. Cowork risks, prompt injection conditions, protective steps, scheduled task cautions and user responsibility. Anthropic, "Use Claude Cowork safely" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/13364135-use-claude-cowork-safely
30. Smart reports privacy guardrails and the warning against individual evaluation. Anthropic, "Get started with smart reports" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/16893491-get-started-with-smart-reports
