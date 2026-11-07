# Chapter 7: When a Human Must Review

**Summary**: *Whether a person must check Claude's work depends on what happens if it is wrong, not on how good the draft looks. For advice or decisions that affect a specific person's health, legal rights, money, job, housing, education or access to services, Anthropic's Usage Policy requires a qualified person to meaningfully review the output, with authority to change it, before it is delivered or acted on, and requires telling the affected person that AI was involved. Outside those areas, you scale review to consequence, reach and reversibility. A review only counts if the reviewer is qualified, can change the outcome and actually looks at the evidence.*

This chapter covers objective 2.4. How to check facts yourself is in [Chapter 6](/ccao-f/read/notes/06-checking-what-claude-wrote). Data sensitivity, approved workspaces and the wider Usage Policy are in [Chapter 11](/ccao-f/read/notes/11-responsible-use-privacy-and-policy). Designing review steps into a workflow is in [Chapter 10](/ccao-f/read/notes/10-fitting-claude-into-the-workflow).

## Two questions decide it

Every item on this objective is some version of: "this output is about to be used; does someone need to look at it first, and who?" Answer two questions in order.

1. **Is this a high-risk use under the Usage Policy?** If so, a qualified human review is required, not optional.<sup>[1]</sup>
2. **If not, what does an error cost, how far does it travel, and can it be undone?** That sets how much review is proportionate.

The trap on both questions is the same: judging by the quality of the draft. A polished, correct-looking recommendation to deny someone's insurance claim needs a qualified reviewer exactly as much as a sloppy one does.

## Question 1: the Usage Policy's high-risk requirements

### What the policy says

Anthropic's Usage Policy has a section called High-risk Use Case Requirements. It covers uses that "can impact an individual's health, legal rights, finances, livelihoods, or access to housing, education, or essential services."<sup>[1]</sup> When Claude is used to make what the policy calls a **High-risk AI Recommendation**, two controls are required:<sup>[1]</sup>

- **Qualified human-in-the-loop.** A qualified person must **meaningfully review** the recommendation, **with the authority to change or modify it**, **before** it is delivered as advice to someone who might rely on it or used to implement a decision. "Qualified" means having the training or experience to evaluate output in that field, and holding a licence where the law requires one for the activity. That person "remains responsible for the accuracy and appropriateness" of what is delivered.
- **Disclosure.** The person who receives the advice, or who is the subject of the decision, must be clearly told that AI was used. You do not have to name Anthropic, Claude or the model.

### The high-risk areas

The policy lists the areas. In plain terms:<sup>[1]</sup>

| Area | Examples that count |
|---|---|
| Legal | Advising a person on their rights or what to do in their matter; preparing documents for them to sign or file |
| Medical | Diagnosing, recommending or adjusting treatment or dose, interpreting a person's symptoms or results |
| Finance | Personalized buy/sell/hold advice on investments; advice on a person's own taxes; preparing their return |
| Credit | Approving, denying or setting terms of a loan; creditworthiness assessments used for that |
| Insurance | Underwriting, pricing, claim outcomes, coverage decisions, cancellation |
| Housing | Approving, denying or ranking rental or purchase applications; eviction |
| Employment | Screening, ranking or rejecting candidates; hiring, promotion, pay, shifts; performance evaluation and discipline |
| Education and credentials | Admissions; grading assessments that decide admission, graduation or certification (outside multiple-choice testing); academic misconduct findings |
| Healthcare access | Triage or waitlist priority; eligibility for treatment |
| Public benefits | Eligibility for, or amount of, benefits or essential services |
| Legal status and adjudication | Outcomes of civil, administrative or arbitral matters; immigration status |

Using Claude to make or suggest decisions in law enforcement or criminal justice is not a high-risk use; it is prohibited outright.<sup>[1]</sup>

### What the requirements do not cover

The exclusions are where the hard exam items live, because they stop you from over-applying the rule. The requirements do **not** apply to:<sup>[1]</sup>

- General information or education that is not applied to the person's circumstances (explaining what a law says or how a treatment works).
- Wellness content (sleep, stress, nutrition, exercise).
- Helping someone understand advice or a decision a qualified person already gave them.
- **Internal drafting, research, summarization or analysis that is not the ultimate recommendation delivered.**
- Carrying out a decision a person already made, or applying a fixed rule or formula where the model exercises no judgment about the individual.
- Business operations that do not advise or decide about a specific individual.

There is also a narrow **favorable-decision** exception: where the law allows, human review is not required before acting on a recommendation that is *wholly* favorable to the person, such as paying an insurance claim or granting a benefit. A partial approval, a reduced amount or an approval with conditions is **not** wholly favorable. Disclosure and other legal duties may still apply.<sup>[1]</sup>

### Example

An HR manager at a logistics company asks Claude to read 140 applications and rank the candidates for a dispatcher role. Ranking candidates is in the employment area, so before any ranking is used to reject or advance someone, a recruiter or hiring manager who can judge the role must review it, with authority to change it, and candidates must be told AI was involved. Compare: the same manager asks Claude to summarize the company's published interview policy for new interviewers. That is general internal content about a process, not a decision about a person, and normal checking is enough.

A second example: a benefits adviser at a housing charity uses Claude to draft a letter telling a tenant they qualify for *part* of a hardship grant. Partial approval is not wholly favorable, so the favorable-decision exception does not apply. A qualified adviser reviews before it is sent.

### The traps

- **"The draft is accurate, so no review is needed" (family 1).** The requirement is triggered by the type of use, not by observed quality.
- **A disclaimer instead of a reviewer (family 3).** Adding "this was generated by AI, please verify" to a rejection letter satisfies the disclosure half at most. It does not supply a qualified person who reviewed it first.
- **A reviewer who cannot change anything.** A junior coordinator who forwards Claude's ranking without authority to alter it is not "meaningful review with the authority to change or modify."<sup>[1]</sup>
- **Over-applying the rule (family 4).** Requiring a lawyer to sign off on Claude's summary of a public regulation for an internal training slide confuses general information with legal advice to a person. Internal drafting and research are excluded.
- **"Wholly favorable" read loosely.** Approving a claim at a reduced amount still needs review.

## Question 2: proportionate review everywhere else

Most work is not in a high-risk area. You still decide how much checking it needs. Anthropic's Help Center gives the baseline: scrutinize high-stakes advice, do not treat Claude as a single source of truth,<sup>[2]</sup> verify mission-critical calculations with specialized tools,<sup>[3]</sup> and "always validate critical information, especially for high-stakes decisions."<sup>[4]</sup> How you turn that into a decision is **General practice**:

| Factor | Lower review | Higher review |
|---|---|---|
| **Consequence of an error** | Mild embarrassment, quick correction | Money, safety, legal exposure, harm to a person |
| **Reach** | You, or a small internal team | Customers, the public, regulators, the board |
| **Reversibility** | Can be corrected tomorrow at little cost | Sent, signed, published, filed or acted on |
| **Novelty** | A routine task you have checked many times | A new task type, new sources or a new model |
| **Verifiability** | Easy to check (recompute, compare to a document) | Needs expert judgment to check |

Read them together. An internal brainstorm is low on every row: a glance is enough. A customer email about a delayed shipment is high on reach and not reversible once sent: someone should read it. A press release quoting financial results is high on every row: the figures need checking against the source and a qualified person (finance, legal or communications lead) signs off.

**Additional verification is not always a human.** Sometimes the right step is a source check you can do yourself: recompute the totals, open the cited page, compare against the policy ([Chapter 6](/ccao-f/read/notes/06-checking-what-claude-wrote)). The exam often offers both "add a human reviewer" and "check against the source"; pick the one that matches the risk and the stated requirement. If a qualified judgment is needed (is this clause enforceable? is this dosage safe?), only a qualified person will do. If the question is "is this number right?", a recomputation answers it.

### Example

A project manager uses Claude to turn meeting notes into a weekly status update. When it goes to her own team, she skims it. When the same update goes to the client, she checks every date and commitment against the project plan, because a wrong delivery date in a client document is hard to walk back. When Claude drafts a change-order with new pricing, the commercial lead reviews it before it is sent, because it binds the company. Same tool, same quality of draft, three levels of review.

## What makes a review real

A named reviewer is not the same as a review. General practice, consistent with the Usage Policy's "meaningfully review":<sup>[1]</sup>

- **Qualified for the question.** An editor can judge tone. Only a clinician can judge a dosage. Match the reviewer to the risk.
- **Has authority.** The reviewer can change, hold or reject the output, not just pass it on.
- **Sees the evidence.** Give the reviewer the sources, the figures to check and what Claude was asked, not just the polished text. A reviewer who sees only the final prose is checking presentation.
- **Has time and a reason to look.** If everything is sent for review, reviewers start approving by habit. Route the high-consequence items, and make the review step small and specific.
- **Owns the result.** The policy says the qualified person "remains responsible."<sup>[1]</sup> Anthropic's guidance for legal teams says the same thing in practice: keep a lawyer in the loop, verify output against primary sources, document AI use, and keep AI output as the attorney's draft rather than a substitute for advice.<sup>[5]</sup>

## When Claude takes actions, check what it did

Review is not only about text. When Claude works with tools, the question becomes "did it do what it says, and only that?"

- Claude can falsely claim to have sent an email or created an external document, because it has no access to tools that are not integrated.<sup>[6]</sup> Confirm actions in the real system.
- During research, Claude can use tools from your connectors automatically, without asking for approval each time.<sup>[7]</sup> Know which connectors are on for that chat before you start.
- With code execution and file creation, Anthropic recommends you monitor Claude while it works and stop it if you see it using or accessing data unexpectedly.<sup>[8]</sup>
- Scheduled tasks in Cowork run on their own cadence and you review the results when they are ready; you choose an approval mode when you set one up.<sup>[9]</sup> A recurring report that goes to others still needs someone to look at it before it is relied on.

## AI-content marks are signals, not verdicts

As of November 2026, supported Claude models embed an invisible watermark in generated text, and files Claude creates can carry Content Credentials (C2PA). Anthropic is explicit about the limits: a detected mark "is not fully conclusive" (Claude may have only proofread or translated someone else's work, and content may have changed after), and **no mark does not mean no AI** (older models, heavy editing, very short passages, stripped metadata). Watermark detection itself is in private preview for eligible organizations.<sup>[10]</sup>

Two exam consequences follow. First, marking is not disclosure: when the Usage Policy requires you to tell someone AI was involved, a hidden watermark does not do that. Second, a mark (or its absence) is not proof of anything about a person. A teacher who suspects an essay is AI-written cannot treat a detection result as a finding; a determination of academic misconduct is itself in the high-risk education area and needs a qualified person's judgment.<sup>[1][10]</sup>

## The traps, collected

| Tempting answer | Family | Why it loses |
|---|---|---|
| "The output looked thorough and Claude did not express doubt, so send it" | 1 | Review is set by consequence and policy, not by how the draft reads |
| "Add a line to the prompt telling Claude to be careful with legal content" | 3 | A prompt instruction is not a qualified reviewer |
| "Put an AI-generated disclaimer at the bottom" in place of review | 3 | Disclosure and review are two separate requirements |
| "Have a lawyer approve every Claude output in the company" | 4 | Disproportionate; internal drafting and general information are excluded, and blanket review produces rubber-stamping |
| "Stop using Claude for HR entirely" | 4 | The policy allows high-risk uses with the controls in place |
| "Ask a second model to review the recommendation" in a high-risk area | 1 | The policy requires a qualified *person* |
| "Use a watermark detector to decide whether the student cheated" | 1 | Marks are not conclusive, and the misconduct finding is a qualified human decision |

## On the exam

- First ask whether the output is advice or a decision about a specific person in a high-risk area. If yes: qualified human review **before** delivery, with authority to change it, plus disclosure to the person.
- Internal drafting, research, summarization, general information and fixed-rule processing are excluded from the high-risk requirements. Do not over-apply them.
- "Wholly favorable" means fully favorable. Partial or conditional approvals still need review.
- Outside high-risk areas, scale review to consequence, reach, reversibility and novelty.
- Pick the check that answers the risk: a recomputation for a number, a qualified person for a judgment.
- A review counts only if the reviewer is qualified, can change the outcome and sees the evidence.
- Confirm actions Claude says it took. Know which connectors are on before running research.
- Watermarks and Content Credentials are signals, not proof, and not a substitute for telling people AI was used.

## Notes

1. High-risk Use Case Requirements: the areas, qualified human-in-the-loop with authority to change before delivery, the definition of a qualified person and their responsibility, disclosure, exclusions (including internal drafting and fixed rules), the wholly favorable exception, and the law-enforcement prohibition reminder. Anthropic, "Usage Policy" (Anthropic, accessed 2026-11-05), https://www.anthropic.com/legal/aup
2. Do not rely on Claude as a singular source of truth; scrutinize high-stakes advice. Anthropic, "Claude is providing incorrect or misleading responses. What's going on?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/8525154-claude-is-providing-incorrect-or-misleading-responses-what-s-going-on
3. Verify complex or mission-critical calculations with specialized software or manual methods. Anthropic, "How does Claude handle mathematical equations and calculations?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/10366421-how-does-claude-handle-mathematical-equations-and-calculations
4. Hallucination-reduction techniques do not eliminate hallucinations; always validate critical information. Anthropic, "Reduce hallucinations" (Claude Docs, accessed 2026-11-05), https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
5. Keep a lawyer in the loop, verify output against primary sources, document AI use; AI output as the attorney's draft, not a substitute for advice. Anthropic, "Using Claude for Legal Work: Privilege, Confidentiality, and How to Think About Configuration" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/15707726-using-claude-for-legal-work-privilege-confidentiality-and-how-to-think-about-configuration
6. Claude can falsely claim to have sent emails or produced external documents; it cannot use tools that are not integrated. Anthropic, "Claude is producing links that don't work and falsely claiming that it has sent emails or produced external documents. What's going on?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/8241188-claude-is-producing-links-that-don-t-work-and-falsely-claiming-that-it-has-sent-emails-or-produced-external-documents-what-s-going-on
7. During research Claude can use connector tools automatically without asking for approval each time. Anthropic, "Use research on Claude" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/11088861-use-research-on-claude
8. Monitor Claude while using code execution and file creation and stop it if it accesses data unexpectedly. Anthropic, "Create and edit files with Claude" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude
9. Scheduled tasks run on a cadence, each as its own session; approval mode is set when creating a task; results are reviewed when ready. Anthropic, "Schedule recurring tasks in Claude Cowork" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork
10. Text watermarks and Content Credentials, detection in private preview, and the limitations: a detected mark is not fully conclusive and a missing mark does not mean content was not AI-generated. Anthropic, "How Claude marks AI-generated content" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/16266773-how-claude-marks-ai-generated-content
