# Chapter 6: Claude Code in Review and CI

**Summary**: *Running Claude Code without a person watching changes the design priorities. The run needs a clear definition of done, a check it can run itself, tools limited to what the job needs, a hard stop on turns or spend, and output a program can parse. Review works best when the reviewer did not write the code and cannot change it.*

## Headless mode is `-p` plus the flags that make it safe

`claude -p "<prompt>"` (or `--print`) runs Claude Code non-interactively. It exits with **code 0 on success and non-zero on failure**, so scripts can branch on the result.<sup>[1]</sup> The flags below come up most in CI questions.<sup>[1][2]</sup>

| Flag | What it does | Exam angle |
|---|---|---|
| `--output-format text \| json \| stream-json` | Chooses plain text, one JSON result, or a stream of JSON events | Use `json` when a program reads the result |
| `--json-schema '<schema>'` | Asks for validated JSON matching a schema after the agent finishes. Print mode only | The parsed result is in the `structured_output` field |
| `--max-turns N` | Stops after N agent turns with an error. Print mode only | Prevents runaway loops |
| `--max-budget-usd X` | Stops once estimated spend reaches X. Print mode only | Caps cost per run |
| `--tools "Read,Grep,Glob"` | **Restricts** which built-in tools exist | The way to make a reviewer read-only |
| `--allowedTools` | **Pre-approves** tools so they run without prompts | Does not remove other tools |
| `--disallowedTools` | Removes tools | Use to block specific tools |
| `--permission-mode` | Starts in `default`, `acceptEdits`, `plan`, `auto`, `dontAsk` or `bypassPermissions` | `dontAsk` refuses anything not pre-approved instead of prompting |
| `--append-system-prompt` | Adds to Claude Code's system prompt | `--system-prompt` **replaces** it |
| `--bare` | Skips discovery of hooks, skills, plugins, MCP servers, auto memory and CLAUDE.md | Faster, reproducible starts. Recommended for scripts |
| `--mcp-config`, `--settings`, `--agents` | Load MCP servers, settings or subagents from explicit files or JSON | Pin exactly what the run gets |

Two warnings from the headless page matter. Without `--bare`, a `-p` run **loads the project's hooks and `.mcp.json` servers with no trust dialog**, even in a folder you never trusted.<sup>[1]</sup> And `--bare` skips CLAUDE.md, so project standards you need must be passed explicitly, for example with `--append-system-prompt` or `--settings`.<sup>[1]</sup>

### Structured output needs a presence check

With `--json-schema`, the validated result arrives in **`structured_output`** on the result message.<sup>[3]</sup> The SDK guide warns that a run can end with subtype `success` but **no `structured_output`**, for example if the agent never produced one. Treat that as a failure. A run that cannot produce valid output after retries ends with subtype **`error_max_structured_output_retries`**.<sup>[3]</sup> Make optional any field the task might not be able to fill, so the agent is not pushed to invent a value.<sup>[3]</sup>

## A review configuration has four parts

Here is a review job that holds up in CI.

1. **Project standards, stated explicitly.** Pass the standards the review applies (what counts as a defect, what to ignore) through CLAUDE.md, an appended system prompt or a review guidance file. Anthropic's managed Code Review service reads `REVIEW.md` and `CLAUDE.md`, and it takes `REVIEW.md` from the **base branch, never from the pull request**, so a PR cannot rewrite its own review rules.<sup>[4]</sup>
2. **Restricted tools.** Give the reviewer `Read`, `Grep` and `Glob` and nothing that writes. The best-practices guide notes that this limit is enforced by Claude Code, not merely requested in a prompt.<sup>[5]</sup>
3. **Structured output.** Use a schema with one entry per finding: file, line, severity, category, explanation, and evidence. Then the CI step can post comments, fail the build on blocking findings, or open tickets.
4. **Limits.** Set `--max-turns` and `--max-budget-usd` so a bad run ends quickly and cheaply.

Anthropic's managed **Code Review** product shows the same design at larger scale. Several agents look for problems in parallel, a **verification step filters out false positives**, findings are ranked by severity, and the results are posted as comments. By default it focuses on **correctness**, not style. It never approves or blocks a pull request on its own.<sup>[4]</sup> The `/code-review` command runs a similar review locally.<sup>[5]</sup>

For GitHub, the `anthropics/claude-code-action` runs Claude Code in Actions. `/install-github-app` sets it up, and `claude_args` passes CLI flags through.<sup>[6]</sup>

## Independent review means a fresh context with the right input

A reviewer that shares the author's context tends to accept the author's reasoning. The best-practices guide recommends review by **something that did not write the code**. `/code-review` reviews the diff in a fresh subagent that never saw the conversation, so it is not swayed by the reasoning that produced the code. A **second session** works too: one session writes, another reviews the file without having watched it being written.<sup>[5]</sup>

The guide also notes a limit. By default the reviewer is the same model, or a smaller one, on the same task. You get a fresh pair of eyes, not a smarter answer.<sup>[5]</sup> So give the reviewer something concrete to check against, such as the `SPEC.md` from an interview, and tell it what to report ("gaps that affect correctness") and what to skip ("style").<sup>[5]</sup>

## False positives drop when conventions are written down

A CI reviewer that keeps flagging intentional patterns is missing context, not intelligence. The durable fix is to **record the convention** where every review run reads it: a project CLAUDE.md line, a path-scoped rule, or the review guidance file. Re-explaining it in each PR comment does not last. Combine that with **explicit inclusion and exclusion criteria** in the review prompt (report security and correctness issues, skip formatting the linter already enforces), and with a verification pass that checks each finding against the code before it is posted.<sup>[4]</sup>

## Examples, tests and interviews make iteration converge

The blueprint groups three iteration techniques under Claude Code workflows.

- **Give Claude a check to run.** Claude stops when work *looks* done. With something that returns pass or fail (a test file, a build exit code, a linter), it can make a change, run the check, read the failure and fix it on its own.<sup>[5]</sup> A strong request names the check: "write a failing test that reproduces the timeout bug, then fix it."<sup>[5]</sup>
- **Show examples.** A concrete example of the desired output, or a screenshot of the design or error, beats an abstract description.<sup>[5]</sup> When asking for tests, point Claude at existing test patterns in the repository and ask for the edge cases you care about.<sup>[7]</sup>
- **Interview first.** When requirements are unclear, ask Claude to interview you until it could write the spec, save it as `SPEC.md`, and build in a fresh session.<sup>[5]</sup>

To **enforce** a passing check before Claude finishes, rather than just mention it, use a `Stop` hook that exits with code 2 when the check fails.<sup>[5]</sup>

## Worked example: a PR reviewer that edits code and floods comments

A team runs `claude -p "review this PR"` in CI with `--allowedTools "Read,Grep,Glob"`. Problems: the reviewer sometimes edits files, it posts dozens of style comments, its output is prose that a script cannot parse, and one run looped for 40 minutes.

| Problem | Cause | Fix |
|---|---|---|
| It edits files | `--allowedTools` only pre-approves. Edit tools still exist | `--tools "Read,Grep,Glob"`, or `--disallowedTools` for the edit tools |
| Style noise | No inclusion or exclusion criteria, and conventions not written down | State "report correctness and security, skip style", and record team conventions in CLAUDE.md or a guidance file |
| Unparseable output | Text output | `--output-format json` with `--json-schema`. Check that `structured_output` exists |
| 40-minute run | No limits | `--max-turns` and `--max-budget-usd` |
| Unexpected hooks ran | `-p` without `--bare` loads project hooks and MCP servers | `--bare`, plus explicit `--settings` or `--mcp-config` |

## How wrong answers are built

- **"Use `--allowedTools` to make the reviewer read-only."** It approves. Use `--tools` or `--disallowedTools`.
- **"Have the same session review its own code."** Its context already holds the author's reasoning. Use a fresh subagent or second session.
- **"Parse the text output with a regex."** Use `--output-format json` and `--json-schema`.
- **"Trust `subtype: success`."** Also check that `structured_output` is present.
- **"Let the PR include an updated `REVIEW.md`."** Managed review reads guidance from the base branch only.
- **"Interactive-only flags in CI."** `--max-turns` and `--max-budget-usd` are print-mode flags, so they belong in CI.
- **"Ask the model to be stricter about style."** Noise drops with written conventions and explicit exclusions, not with sterner wording.

## What to remember

- `-p` runs headless. The exit code tells the script whether the run failed.
- `--tools` restricts. `--allowedTools` pre-approves. `--disallowedTools` removes.
- `--output-format json` plus `--json-schema` puts validated JSON in `structured_output`. Check that it is there.
- `--max-turns` and `--max-budget-usd` cap a run. Both are print mode only.
- `--bare` skips hooks, skills, MCP and CLAUDE.md for reproducible runs, so pass standards explicitly.
- Independent review means a fresh context, a spec to check against, and read-only tools.
- Give Claude a pass or fail check. Enforce it with a `Stop` hook when it must pass.

## Endnotes for this chapter

1. The headless page covers `-p`, exit codes, `--bare` and what it skips, and warns that `-p` without `--bare` loads project hooks and MCP servers without a trust prompt. Anthropic, "Run Claude Code programmatically" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/headless
2. The CLI reference documents `--json-schema`, `--max-turns`, `--max-budget-usd`, `--tools`, `--allowedTools`, `--output-format` and `--permission-mode`. Anthropic, "CLI reference" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/cli-reference
3. Structured agent output appears in `structured_output`; a success without it should be treated as failure, repeated validation failures end in a dedicated error subtype, and uncertain fields should be optional. Anthropic, "Get structured output from agents" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/agent-sdk/structured-outputs
4. Managed Code Review uses parallel agents, a false-positive verification step and severity ranking, focuses on correctness by default, reads `REVIEW.md` from the base branch, and never approves or blocks. Anthropic, "Code Review" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/code-review
5. The best-practices guide recommends giving Claude a check to run, using examples and interviews, reviewing in a fresh subagent or session, limiting reviewers to read tools, and enforcing checks with a Stop hook. Anthropic, "Best practices for Claude Code" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/best-practices
6. Claude Code runs in GitHub Actions through `anthropics/claude-code-action`, set up with `/install-github-app` and configured with `claude_args`. Anthropic, "Claude Code GitHub Actions" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/github-actions
7. When generating tests, Claude follows existing test patterns and can be asked for specific edge cases. Anthropic, "Common workflows" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/common-workflows
