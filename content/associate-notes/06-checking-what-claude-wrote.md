# Chapter 6: Checking What Claude Wrote

**Summary**: *A fluent answer is a presentation, not proof. Anthropic says plainly that Claude can write things that look correct and are badly mistaken, and that it should not be your only source of truth. Checking is therefore part of the task, not an extra. You judge accuracy and completeness against the job the output has to do, you learn the specific shapes that hallucination, inconsistency and bias take, and you check claims against evidence you trust, never against Claude's own confidence.*

This chapter covers objectives 2.1 (accuracy and completeness), 2.2 (hallucinations, inconsistencies and biases) and 2.3 (fact-checking and validation). Deciding *who* must review is [Chapter 7](/ccao-f/read/notes/07-when-a-human-must-review). Rewriting for an audience is [Chapter 8](/ccao-f/read/notes/08-shaping-output-for-the-reader). Fixing the prompt that caused a bad output is [Chapter 12](/ccao-f/read/notes/12-troubleshooting-and-optimization).

## Why Claude gets things wrong

You can only check well if you know where errors come from. Anthropic's Help Center names the causes directly.

- **Plausible text that is not grounded.** Claude can produce quotes that "look authoritative or sound convincing" but are not grounded in fact. Anthropic calls this hallucinating, and describes it as a byproduct of current limits of generative AI.<sup>[1]</sup>
- **Stale knowledge.** Each model has a training cutoff. Models "may not be aware of events or information" after it, and may not have accurate information about recent events.<sup>[2]</sup> As of November 2026 the newest models list a June 2026 cutoff; older ones are earlier.
- **Claimed capabilities it does not have.** Claude can "hallucinate its capabilities": it may say it sent an email or produced a document, or give links that do not work. It has no access to email, word processors or file transfers unless they are explicitly integrated.<sup>[3]</sup>
- **Calculation.** Claude can do maths, but "complex or mission-critical calculations should be verified using specialized mathematical software or manual methods."<sup>[4]</sup>
- **Its sources.** With web search on, the quality of Claude's answer depends on the pages it read, and original pages may hold context the synthesis left out.<sup>[1]</sup>
- **Missing input.** If the document, the rule or the data was never given to Claude, it cannot use it. It may write around the gap smoothly. (General practice: most "Claude got it wrong" incidents at work turn out to be "Claude was never told".)

Anthropic's conclusion is the rule the whole domain rests on: do not rely on Claude "as a singular source of truth" and "carefully scrutinize any high-stakes advice."<sup>[1]</sup>

## 2.1 Evaluating accuracy and completeness

### What good practice looks like

**Accuracy** asks whether each claim is true and supported: names, dates, figures, quotes, policy statements and the conclusions drawn from them. **Completeness** asks whether everything the task required is present: every region, every item on the checklist, every exception and caveat. They fail independently. A summary can be accurate in every sentence and still be wrong because it silently drops the one case that matters.

Good practice is to decide what "correct" means **before** you read the output, from the job the output will do (General practice):

1. **List the requirements from the request.** If you asked for all eight sites, the check is "are there eight?", not "does this read well?".
2. **Sort claims by consequence.** A wrong adjective in an internal brainstorm costs nothing. A wrong figure in a board pack, a wrong date in a customer notice or a wrong clause in a contract summary does.
3. **Match each claim type to a check.**

| Claim type | Check it against | Typical failure |
|---|---|---|
| Figures and totals | The source data, recomputed (spreadsheet, code execution, or by hand) | Arithmetic slip, wrong subset, rounding drift |
| Quotes and policy statements | The original document, word for word | Paraphrase presented as a quote; "some" turned into "all" |
| Current facts (prices, laws, people in roles) | A current authoritative source | Out of date after the training cutoff |
| Cited web sources | The cited page itself | Page exists but does not support the claim |
| Coverage | Your requirement list | Missing segment, step or exception |
| Actions ("I've emailed the team") | The system where the action would show up | Capability hallucination |

### Example

An operations lead asks Claude to summarize eight site incident logs into a weekly safety brief. The brief is clear and well organized. The lead counts sites: seven. One log was a scanned PDF with no readable text, and the brief simply does not mention that site. Every sentence in the brief is accurate. The brief is still wrong, because the job was "all eight sites". The fix is to supply a readable version of the eighth log (or record it as "no data received") and to ask Claude to list which sources it actually used, so gaps are visible next time.

A second check follows for the figures: the brief says incidents fell 18 percent. The lead recomputes from the logs rather than trusting the percentage, because a percentage is a claim with two inputs that can both be wrong.

### The traps

- **Confidence as evidence (family 1).** "The brief is detailed and Claude did not flag any concerns." Absence of a warning is not a check. Claude can be wrong without signalling it.<sup>[1]</sup>
- **Asking for "more comprehensive" (family 2).** If a section is missing because the source was missing, asking Claude to expand will produce plausible filler for the missing site. Give it the input.
- **Checking only what is there.** Reviewers naturally verify the sentences in front of them. Completeness failures are invisible unless you check against the requirement list.
- **Redoing everything by hand (family 4).** Rewriting the whole brief manually throws away the value. Check the claims that carry consequence; recompute the numbers; confirm coverage.

## 2.2 Hallucinations, inconsistencies and biases

### What good practice looks like

"Hallucination" on the exam is not one thing. Naming the exact failure points to the fix.

| Failure | What it looks like | Usual fix |
|---|---|---|
| **Fabrication** | An invented statistic, quote, study, case or URL | Ground in supplied sources; allow "I don't know"; verify or remove |
| **Unsupported citation** | A real source is cited, but it does not say what the claim says | Read the cited passage; ask for the exact supporting quote |
| **Overreach** | "Rose after" becomes "caused by"; "some refunds" becomes "all refunds" | Narrow the claim to what the evidence supports |
| **Staleness** | A once-true fact (a rate, a regulation, a job holder) stated as current | Check a current source; use web search for current facts |
| **Capability hallucination** | "I've sent the invite", a link that goes nowhere | Confirm in the real system; it cannot act outside its integrations<sup>[3]</sup> |
| **Internal inconsistency** | The summary says 42, the table says 39 | Reconcile against the source before anything else |
| **Cross-run inconsistency** | The same prompt gives different answers on different runs | Treat disagreement as a warning sign; verify the disputed point<sup>[5]</sup> |
| **Bias** | One-sided framing, stereotyped assumptions, skewed source selection | Check balance and sources; give criteria; get a qualified reviewer |

**Inconsistency is a cheap hallucination detector.** Anthropic's guidance on reducing hallucinations suggests running the same prompt more than once and comparing outputs: inconsistencies across outputs "could indicate hallucinations."<sup>[5]</sup> Inside one output, a number that does not match itself is a red flag that something upstream was misread.

**Bias** shows up in three practical ways (General practice, except where cited):

- **Source selection.** When Claude searches, it may lean on easy-to-find sources over authoritative ones. Anthropic's own engineers found their early research agents "consistently chose SEO-optimized content farms" over authoritative but lower-ranked sources, and human testers were the ones who noticed.<sup>[6]</sup> When you review researched output, look at *which* sources were used, not only whether they were cited.
- **Framing.** A comparison that lists five benefits of one vendor and one of another may reflect the prompt ("why should we choose X?") more than the evidence. Ask a neutral question and state the criteria.
- **Assumptions about people.** Drafts about customers, students or candidates can carry stereotyped assumptions. Where the output affects a person's job, credit, housing, education or similar, the Usage Policy requires a qualified human to review before it is used ([Chapter 7](/ccao-f/read/notes/07-when-a-human-must-review)).

Anthropic asks users to report outputs they believe are inaccurate, biased or harmful through the thumbs-down button or by email.<sup>[7]</sup> Reporting helps Anthropic; it does not fix your document. You still correct the output.

### Example

A marketing manager asks Claude, with web search, for a competitor brief: pricing, recent launches and analyst views. Three things go wrong. The brief quotes a competitor's price that changed two months ago (staleness: the cited page is an old press release). It cites an analyst firm for a market-share figure, but the cited page discusses the market without giving that number (unsupported citation). And all four "analyst views" come from one vendor-sponsored blog (source-selection bias). The manager does not ask Claude to "double-check its work". She opens each cited page, replaces the price with the one on the competitor's current pricing page, removes the market-share figure, and asks Claude to find independent analyst coverage or say that none was found.

### The traps

- **"Ask Claude whether it made anything up" (family 1).** The same model that produced a fabricated figure is not a reliable judge of whether it fabricated it. A check needs an outside reference.
- **Citations as proof.** A citation is a pointer. Anthropic tells users to review the cited sources, because original pages may contain context the synthesis left out.<sup>[1]</sup>
- **More formal tone to fix bias (family 2).** A neutral-sounding rewrite of a one-sided comparison is still one-sided. Change the question, the criteria or the sources.
- **Banning web search because one link was bad (family 4).** Anthropic notes that occasionally links "may not function".<sup>[8]</sup> The fix is checking links before they go out, not losing current information.

## 2.3 Fact-checking and validation techniques

### What good practice looks like

Think of validation in three moments: before Claude writes, while it writes, and after.

**Before: set Claude up to be checkable.** Anthropic's guidance on reducing hallucinations lists techniques that work as plain-language prompt habits:<sup>[5]</sup>

- **Allow uncertainty.** Explicitly permit Claude to say it does not have enough information. Anthropic says this "can drastically reduce false information."
- **Restrict to the provided documents.** Tell Claude to use only the material you supplied, not its general knowledge.
- **Quotes first.** For long documents, ask Claude to extract word-for-word quotes relevant to the question, then base its answer only on those quotes.

**While: use features that show their evidence.** Web search responses include citations "so you can easily verify sources yourself."<sup>[8]</sup> Research runs many searches that build on each other and can draw on connected tools, which suits questions that need breadth.<sup>[9]</sup> Dashboards show the query behind each chart and when its data was last refreshed, so you can see exactly what a number counts.<sup>[10]</sup> When thinking is on, you can expand the thinking summary; Anthropic says reviewing it "can be valuable for verifying how Claude arrived at its conclusion."<sup>[11]</sup> For numbers, code execution lets Claude do analysis by running code on your uploaded data rather than estimating.<sup>[12]</sup>

**After: verify claims against evidence.**

- **Claim-by-claim support.** Ask Claude to find a direct quote from the supplied documents for each claim, and to **remove** any claim it cannot support. Anthropic gives exactly this pattern for a press release, marking removals with empty brackets.<sup>[5]</sup> This is not "trusting the self-report": the test is whether a quote exists in a document you can read, and you can check the quotes.
- **Run it twice and compare.** Disagreement between runs locates the claims to check.<sup>[5]</sup>
- **Feed the output back.** Use the output as input to a follow-up that verifies or expands specific statements, which "can catch and correct inconsistencies."<sup>[5]</sup>
- **Check the original.** For anything high-stakes, open the cited page, the policy or the dataset. Anthropic advises using authoritative sources for critical decisions.<sup>[8]</sup>
- **Recompute.** For mission-critical numbers, use specialized software or manual methods.<sup>[4]</sup>

Anthropic's own caveat matters on the exam: these techniques "significantly reduce hallucinations" but "don't eliminate them entirely. Always validate critical information, especially for high-stakes decisions."<sup>[5]</sup>

**Proportion.** Validation effort should follow consequence (General practice). A brainstorm list for yourself needs a glance. An internal summary needs its figures and coverage checked. Anything going to customers, regulators, the board or into a decision about a person needs source checks and usually a qualified reviewer.

### The difference between a self-check and a self-report

This distinction decides several hard items. Both ask Claude to look at its own work.

| Self-report (weak) | Evidence-anchored self-check (useful) |
|---|---|
| "How confident are you, 1 to 10?" | "For each claim, quote the sentence in the attached policy that supports it; delete any claim without one." |
| "Did you make anything up?" | "List every figure with the row of the spreadsheet it came from." |
| "Are you sure this is right?" | "Run the calculation in code on the uploaded file and show the result." |

The left column produces another unverified statement. The right column produces something you can check against a source. Even the right column is a step, not the final check, for high-stakes work: you still read the quotes.

### Example

A secondary-school teacher uses Claude to write a revision sheet on a history unit from the department's textbook chapter. She uploads the chapter, tells Claude to use only that chapter, to say "not in the chapter" where it cannot answer, and to put the page number after each fact. Before printing, she spot-checks every date against the page cited and asks Claude in a fresh run to produce the same sheet; two dates differ between runs, so she checks both in the textbook and corrects one. The work took ten minutes instead of an hour, and she knows which facts were checked.

### The traps

- **Rating confidence (family 1).** A confidence score is a self-report, not a check.
- **"Use web search" as the whole answer.** Search adds current, cited information; it does not remove the need to read the citations, and it is the wrong tool when the authority is your own internal document.
- **Asking a more capable model to re-answer (family 4).** A second opinion from Opus without sources is another unverified answer. It may agree with the first answer and still be wrong. Use a source.
- **Verifying everything with the same intensity.** Spending an hour checking adjectives in an internal draft while a figure in the customer notice goes unchecked is a prioritization failure.

## On the exam

- Fluency, detail and confidence are never evidence. The only check is against a source you trust.
- Accuracy and completeness fail separately. Check coverage against the requirements, not against what is on the page.
- Name the failure (fabrication, unsupported citation, overreach, staleness, capability claim, inconsistency, bias) before choosing a fix.
- A cited source must be opened and must actually support the claim.
- Claude cannot act outside its integrations. "I've sent it" needs confirmation in the real system.
- Recompute important figures with a spreadsheet, code execution or by hand.
- Evidence-anchored self-checks ("quote the support or remove the claim") are useful. Confidence ratings and "are you sure?" are not.
- When the gap is a missing input, supply the input. Rewording or expanding will only produce plausible filler.

## Notes

1. Claude can hallucinate, produce convincing but ungrounded quotes, and be confused about current events; it should not be a singular source of truth; review web-search sources because originals hold context; feedback via thumbs down. Anthropic, "Claude is providing incorrect or misleading responses. What's going on?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/8525154-claude-is-providing-incorrect-or-misleading-responses-what-s-going-on
2. Each model's training cutoff, and that models may not know about later events. Anthropic, "How up-to-date is Claude's training data?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/8114494-how-up-to-date-is-claude-s-training-data
3. Claude can hallucinate its capabilities, produce links that do not work, and falsely claim to have sent emails; it has no access to tools that are not explicitly integrated. Anthropic, "Claude is producing links that don't work and falsely claiming that it has sent emails or produced external documents. What's going on?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/8241188-claude-is-producing-links-that-don-t-work-and-falsely-claiming-that-it-has-sent-emails-or-produced-external-documents-what-s-going-on
4. Complex or mission-critical calculations should be verified with specialized software or manual methods. Anthropic, "How does Claude handle mathematical equations and calculations?" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/10366421-how-does-claude-handle-mathematical-equations-and-calculations
5. Allowing "I don't know", direct quotes for grounding, citation-based claim verification with retraction, best-of-N comparison, iterative refinement, restricting to provided documents, and the caveat that these reduce but do not eliminate hallucinations. Anthropic, "Reduce hallucinations" (Claude Docs, accessed 2026-11-05), https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations
6. Human testers noticed early research agents choosing SEO content farms over authoritative sources. Anthropic, "How we built our multi-agent research system" (Anthropic, accessed 2026-11-05), https://www.anthropic.com/research/multi-agent-research-system
7. Report potentially inaccurate, biased or harmful outputs via the thumbs-down button or usersafety@anthropic.com. Anthropic, "Usage Policy" (Anthropic, accessed 2026-11-05), https://www.anthropic.com/legal/aup
8. Web search responses include citations; cross-reference cited sources; use authoritative sources for critical decisions; links may occasionally not function. Anthropic, "Enable and use web search" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/10684626-enable-and-use-web-search
9. Research runs multiple searches that build on each other and can use connected tools. Anthropic, "Use research on Claude" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/11088861-use-research-on-claude
10. Each dashboard chart shows its query and when its data was last refreshed; check the query to see how Claude got the number. Anthropic, "Get started with Claude Dashboards" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/17454700-get-started-with-claude-dashboards
11. Reviewing the thinking summary can help verify how Claude reached its conclusion. Anthropic, "Change the model, effort, and thinking settings" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings
12. Code execution for data analysis on uploaded files, and the advice to review and refine outputs. Anthropic, "Create and edit files with Claude" (Claude Help Center, accessed 2026-11-05), https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude
