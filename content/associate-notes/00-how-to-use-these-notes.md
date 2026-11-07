# How to Use These Notes

**Summary**: *These notes cover the seven domains of the Claude Certified Associate – Foundations (CCAO-F) blueprint. The exam is for people who use Claude to get business work done, not for people who build software on it. Each item is a short workplace situation with one detail that decides the answer, and the wrong options are habits a less careful user would actually have. Each chapter teaches the habit, gives an example from a real job, and takes apart the tempting wrong moves.*

## The exam asks what a careful professional does next

The exam has 60 items in 120 minutes, so you have two minutes per item. It is scored from 100 to 1,000 and 720 passes. Items are multiple-choice or multiple-response, and **each multiple-response item tells you how many answers to select**. There are no long shared case studies. A typical stem is two to four sentences: who you are, what you are trying to do with Claude, and one constraint.

The candidate the exam is written for uses Claude every week in a role like operations, marketing, project management, education or communications. That person writes structured prompts, builds Projects, checks Claude's work before it goes anywhere, and knows when a job needs a developer, an architect or a human expert instead. No coding or API knowledge is expected. If an option only makes sense to a software engineer, it is rarely the Associate answer.

Read every stem twice. On the second pass, mark three things.

1. **Where the output is going.** A draft for yourself, a summary for the compliance team and a reply sent to a customer need different levels of checking. The audience usually decides how much verification is enough.
2. **The constraint that dominates.** Accuracy, speed, cost, privacy, policy or the reader's needs. Stems usually state one outright ("policy restricts regulated personal data", "hundreds of replies a day", "the board meets tomorrow").
3. **What is actually wrong.** If Claude invented a citation, the problem is accuracy, and no amount of rewording fixes it. If the output is accurate but too long for executives, the problem is audience fit, and fact-checking again will not help.

The right answer usually **fixes the cause with the least drastic step that still meets every stated requirement**.

## Wrong answers come from four families

Learn the families, not individual items. Every chapter's "traps" sections tie back to them. The examples below are original.

| Family | What it looks like | Why it loses |
|---|---|---|
| 1. Trusting the model's self-report | "Claude sounded confident", "ask Claude to rate its confidence", "ask Claude if it made anything up" | Claude's confidence is not evidence. Only a check against a source you trust is |
| 2. Cosmetic fix for a substance problem | Reword, reformat, make it more formal, add a persona, ask for more detail | The output looks better and is still wrong, incomplete or missing the inputs it needed |
| 3. An instruction where a control is needed | "Tell Claude not to keep the file", "ask it to keep the data private", "remind it of the policy" | A sentence in a prompt does not satisfy a policy. Removing the data, using the approved workspace or an admin setting does |
| 4. Overreaction | Always use the most capable model, abandon the task, ban the tool, redo everything by hand | It throws away the value of the task when a proportionate fix exists |

**Family 1 example.** Claude drafts a market summary that quotes a competitor's revenue figure. A tempting answer is "ask Claude whether it is sure about the number." The better answer checks the figure against the competitor's published report before the summary goes out, or removes it.

**Family 2 example.** A training guide Claude wrote for new hires leaves out the escalation step for refunds, because the source procedure was never uploaded. A tempting answer is "ask Claude to make the guide more comprehensive." The better answer gives Claude the actual procedure, so the gap is closed with real content rather than a guess.

**Family 3 example.** A recruiter wants Claude to compare candidate CVs, and company policy says candidate data may only be processed in approved tools. A tempting answer is "paste the CVs into a personal account and tell Claude not to use them for anything else." The better answer uses the organization's approved Claude workspace, or does not upload the CVs at all.

**Family 4 example.** A team finds that one Claude-drafted newsletter contained a wrong event date. A tempting answer is "stop using Claude for newsletters." The better answer adds a check of dates and names against the events calendar before each send.

The real exam's wrong options are rarely absurd. Most of them are reasonable steps applied at the wrong moment, a real feature used for the wrong job, or the right idea taken too far. The practice questions on this site are written the same way.

## Select-N items reward two independent correct reasons

A multiple-response item says how many answers to select. Select exactly that many. The usual trap is picking two options that say the same thing in different words, or a real fix plus a cosmetic one.

- First rule out anything that breaks a stated constraint, such as policy, audience or deadline.
- Of what remains, look for options that address **different parts** of the problem: for example, one that fixes the input and one that adds the right check on the output.
- If two remaining options are near-duplicates, at most one of them is right.

## Associate is the level that knows when to hand off

The guide is explicit: Associates complete business tasks with minimal guidance and **escalate more complex or technical work to Claude Architects and Developers**. Expect items where the right answer is to involve someone else. Typical cases:

- A workflow needs a custom integration, an automated pipeline or an API connection that no built-in feature or connector provides.
- The output carries legal, medical, financial or safety consequences and needs a qualified human to sign off.
- The data involved is covered by a policy or regulation you are not sure applies.

Equally, expect items where escalating is the overreaction because a built-in feature (a Project, a connector, a Skill, a scheduled task) already solves it. The skill being tested is telling those two apart.

## The chapters follow the blueprint's seven domains

| Chapter | Title | Domain | Weight |
|---|---|---|---|
| [1](/ccao-f/read/notes/01-prompts-that-define-the-job) | Prompts That Define the Job | Prompting and Task Execution | 14% |
| [2](/ccao-f/read/notes/02-choosing-the-feature) | Choosing the Feature | Product and Model Selection | 12% |
| [3](/ccao-f/read/notes/03-choosing-the-model) | Choosing the Model | Product and Model Selection | 12% |
| [4](/ccao-f/read/notes/04-context-and-memory) | Context and Memory | Product and Model Selection | 12% |
| [5](/ccao-f/read/notes/05-projects-knowledge-and-connectors) | Projects, Knowledge and Connectors | Configuration and Knowledge Management | 12% |
| [6](/ccao-f/read/notes/06-checking-what-claude-wrote) | Checking What Claude Wrote | Output Evaluation and Validation | 21% |
| [7](/ccao-f/read/notes/07-when-a-human-must-review) | When a Human Must Review | Output Evaluation and Validation | 21% |
| [8](/ccao-f/read/notes/08-shaping-output-for-the-reader) | Shaping Output for the Reader | Output Evaluation and Validation | 21% |
| [9](/ccao-f/read/notes/09-finding-and-designing-use-cases) | Finding and Designing Use Cases | Workflow Integration and Solution Design | 16% |
| [10](/ccao-f/read/notes/10-fitting-claude-into-the-workflow) | Fitting Claude into the Workflow | Workflow Integration and Solution Design | 16% |
| [11](/ccao-f/read/notes/11-responsible-use-privacy-and-policy) | Responsible Use, Privacy and Policy | Governance, Risk, and Responsible Use | 15% |
| [12](/ccao-f/read/notes/12-troubleshooting-and-optimization) | Troubleshooting and Optimization | Troubleshooting and Optimization | 10% |
| [13](/ccao-f/read/notes/13-final-review) | Final Review | All | — |

Output Evaluation and Validation is the heaviest domain at 21%, roughly one item in five, so it gets three chapters. If you only have time to study part of these notes well, study chapters 6 to 8 and 11 first: checking output and responsible use together make up more than a third of the exam.

## Each chapter has the same parts

- **One section per objective**, using the objective's wording from the exam guide, with what good practice looks like and an example from a real job.
- **The traps.** How the wrong options for that objective are built, tied back to the four families.
- **"On the exam."** A short list of the rules that decide items, to check yourself against in the last week.
- **Endnotes.** Every Claude product fact (what a feature does, which plans have it, limits, data handling) is tied to an Anthropic Help Center, Privacy Center or documentation page. Features, plan names and limits change often. If a note and the current Help Center disagree, the Help Center wins.

Some objectives, such as communicating with stakeholders or editing for an audience, are about general professional skill rather than a Claude feature. Sections that rely on general practice are marked *General practice, not from Anthropic documentation.* Treat them as sound defaults, not as product facts.

## Use the question bank in short loops

The practice page has one question set per domain and an Exam Simulation that draws 60 questions in the blueprint's proportions with a 120-minute timer.

1. Read a chapter, then answer that domain's set in practice mode, which shows the explanation after each answer.
2. For every miss, name the family the wrong option you picked belongs to. Patterns in your misses tell you more than the score does.
3. Sit the Exam Simulation once you have covered every chapter. The simulation hides each question's domain while you answer, as the real exam does.
4. In the last week, reread the "On the exam" lists and [chapter 13](/ccao-f/read/notes/13-final-review).

These notes are unofficial and not affiliated with Anthropic. The official exam guide is the authority on what the exam covers.
