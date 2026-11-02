# Chapter 5: Claude Code Configuration

**Summary**: *Claude Code has six places to put a project's knowledge and rules: CLAUDE.md, `.claude/rules/`, skills, subagents, hooks and permission settings. They differ in two ways: when their content loads into context, and whether they are enforced or only advised. Most configuration questions come down to matching a requirement to the mechanism with the right loading behavior and the right strength.*

## The first question is guidance or enforcement

Claude Code's best-practices guide splits configuration into two groups.<sup>[1]</sup>

- **Deterministic:** hooks, permission deny rules and managed settings. They act **every time**, whatever the model decides.
- **Non-deterministic:** prompts, CLAUDE.md and skills. The model reads them and **usually** follows them.

The memory docs say the same about CLAUDE.md in particular: it is **context, not enforcement**. To block an action, use a `PreToolUse` hook or a permission rule.<sup>[2]</sup> The same guide warns against overdoing enforcement. Each hook and deny rule will sometimes fire when it should not and has to be maintained, so keep the enforced set small and reserve it for rules that must never be broken.<sup>[1]</sup>

## CLAUDE.md files stack, they do not override

CLAUDE.md files exist at several levels.<sup>[2]</sup>

| Level | Location | Shared with |
|---|---|---|
| Managed policy | `/Library/Application Support/ClaudeCode/CLAUDE.md` (macOS), `/etc/claude-code/CLAUDE.md` (Linux) | Everyone on the machine or in the org |
| User | `~/.claude/CLAUDE.md` | Only you, in every project |
| Project | `./CLAUDE.md` or `./.claude/CLAUDE.md` | The team, through version control |
| Local | `./CLAUDE.local.md` | Only you, in this project. Add it to `.gitignore` |

Every level that applies is **concatenated** into context. A project file does not replace the user file. Files load from the filesystem root down to the working directory. CLAUDE.md files in **subdirectories load on demand**, when Claude works with files there.<sup>[2]</sup>

A common exam trap uses the user file. A team convention written in `~/.claude/CLAUDE.md` reaches only that one developer. A new teammate does not get it. Team conventions belong in the project CLAUDE.md, committed to the repository.

### Imports organize files but do not save context

`@path/to/file` inside a CLAUDE.md pulls in another file. Relative paths resolve from the **importing file**. Imports can nest up to **four hops** deep. Imports outside the project ask for approval the first time.<sup>[2]</sup> Imported content still loads at launch, so **imports do not reduce context cost**. They only split a large file into readable parts.<sup>[2]</sup> Anthropic suggests keeping each CLAUDE.md **under about 200 lines**.<sup>[1]</sup>

## Path-scoped rules load only when matching files are touched

`.claude/rules/*.md` holds rule files.<sup>[2]</sup>

- A rule file **without** frontmatter loads at launch, like CLAUDE.md.
- A rule file **with** a `paths:` list of globs loads only when Claude **reads, writes or edits** a matching file. `paths` is the only frontmatter field that rules use.

```markdown
---
paths:
  - "db/migrations/**/*.sql"
---
Migrations are append-only. Never edit a migration that has been merged; add a new one.
```

Path rules are the right answer when a convention applies to one area and would waste context everywhere else. User-level rules can live in `~/.claude/rules/`. In a monorepo, the `claudeMdExcludes` setting skips CLAUDE.md files for packages you never work in.<sup>[2][3]</sup>

One limitation follows from how they load: path-scoped rules arrive as message history, so **compaction can summarize them away** in a long session. A rule that must hold all session long belongs in an unscoped location.<sup>[4]</sup>

## Skills are procedures loaded on demand

A **skill** is a folder with a `SKILL.md` file (plus optional scripts and references). Claude sees **each skill's description in every session** but reads the **full content only when the skill is used**.<sup>[5]</sup> That makes skills the place for long procedures and reference material that would bloat CLAUDE.md.

Custom slash commands have been merged into skills. `.claude/commands/review.md` and `.claude/skills/review/SKILL.md` both create `/review`.<sup>[5]</sup> Project skills live in `.claude/skills/` and are shared through the repository. Personal skills live in `~/.claude/skills/`. When two skills share a name, enterprise wins over personal, and personal wins over project.<sup>[5]</sup>

Frontmatter fields that come up in questions:<sup>[5]</sup>

| Field | Effect |
|---|---|
| `description` | How Claude decides to use the skill on its own |
| `disable-model-invocation: true` | Only a person can start it with `/name`. Use it for skills with side effects, such as deploys |
| `user-invocable: false` | Hidden from the `/` menu. Claude can still use it |
| `allowed-tools` | **Pre-approves** these tools while the skill runs. It does **not** restrict other tools |
| `context: fork` (with `agent`) | Runs the skill as the prompt of an isolated subagent that does not see the conversation |
| `paths` | Limits when the skill is offered automatically, by file glob |
| `argument-hint`, `$ARGUMENTS` | Arguments passed after the command name |

`context: fork` only makes sense for skills that contain a complete task. A skill that is only guidelines gives the forked subagent nothing to do.<sup>[5]</sup>

## Hooks run your code at fixed points

**Hooks** are commands (or HTTP calls, prompts or agents) that run on lifecycle events. Command and HTTP hooks are deterministic. Prompt and agent hooks involve a model, so they are not.<sup>[6]</sup>

| Event | Typical use |
|---|---|
| `PreToolUse` | Allow, deny or ask before a tool runs. Can rewrite the input with `updatedInput` |
| `PostToolUse` | Add context after a tool runs, or **replace its output** with `updatedToolOutput` |
| `Stop` | Check whether the work is really done. Exit code 2 sends Claude back to work |
| `UserPromptSubmit`, `SessionStart` | Add context at the start of a turn or session |
| `PreCompact` | Act before compaction |
| `SubagentStart`, `SubagentStop` | Act around subagents |

Exit code **2 blocks** the action and returns the hook's stderr to Claude.<sup>[6]</sup> `PostToolUse` with `updatedToolOutput` is the **normalization** case. For example, rewrite inconsistent date formats from different tools into one format before Claude sees them. The field works for any tool. The older `updatedMCPToolOutput` covers MCP tools only.<sup>[7]</sup>

## Permission settings decide what is allowed at all

Settings files have a strict order of precedence: **managed** settings, then `--settings` on the command line, then `.claude/settings.local.json`, then `.claude/settings.json`, then `~/.claude/settings.json`.<sup>[8]</sup> Permission rules are checked **deny first, then ask, then allow**. The first match in that order wins, and a deny from any scope beats an allow from any other scope.<sup>[10]</sup> Deny rules apply in every permission mode, which makes them the right tool for protecting files such as `.env`.<sup>[1]</sup>

## Which mechanism?

| Requirement | Best mechanism | Why not the others |
|---|---|---|
| "Use pnpm, not npm" for the whole team | **Project CLAUDE.md** | Short, always relevant, shared through git |
| A personal preference, such as terse answers | **User CLAUDE.md** or `CLAUDE.local.md` | Should not be imposed on the team |
| SQL migration rules that matter only in `db/` | **`.claude/rules/` with `paths:`** | CLAUDE.md would spend context everywhere |
| A 12-step release checklist the team runs on request | **Project skill**, with `disable-model-invocation` if it has side effects | Too long for CLAUDE.md and only needed sometimes |
| Never read `.env` files, in any mode | **Permission deny rule** | CLAUDE.md is only advice |
| Run the formatter after every edit | **`PostToolUse` hook** | Must happen every time, at zero context cost |
| Block `git push --force`, with a reason shown to Claude | **`PreToolUse` hook** or a deny rule | Prompts can be ignored |
| Verbose security analysis with read-only tools | **Subagent** with a limited `tools` list | Keeps output and tool power out of the main session |
| Org-wide rules no one can override | **Managed settings** (enforcement) and **managed CLAUDE.md** (guidance) | Project files can be edited by developers |

The features overview adds two rules of thumb. If Claude gets a convention wrong **twice**, add it to CLAUDE.md. If you keep **typing the same prompt** to start a task, save it as a skill.<sup>[9]</sup>

## Worked example: one repository, four complaints

A team's root CLAUDE.md has grown to 600 lines. Developers report four problems.

1. **"Claude ignores the migration rules."** Those rules sit at line 480, buried among unrelated material. Move them to `.claude/rules/migrations.md` with `paths: ["db/migrations/**"]`, so they load exactly when they apply.
2. **"Claude sometimes edits `.env.production`."** CLAUDE.md says not to, but that is advice. Add a `Read` and `Edit` deny rule for `.env*` in `.claude/settings.json`.
3. **"The release procedure takes up half the file."** Move it to `.claude/skills/release/SKILL.md` with `disable-model-invocation: true`, so it runs only when someone types `/release`.
4. **"A new hire's Claude doesn't know our test command."** It was in a senior developer's `~/.claude/CLAUDE.md`. Move it to the project CLAUDE.md.

The CLAUDE.md that remains is short and always relevant.

## How wrong answers are built

- **"Write 'NEVER' in capitals in CLAUDE.md."** It is still advice. Anthropic's guide also notes that capitalized emphasis is no longer needed with current models.<sup>[1]</sup> Enforce with a hook or deny rule.
- **"Use `@imports` to cut context usage."** Imported files load at launch. Use path rules or skills to defer loading.
- **"Put the team rule in `~/.claude/CLAUDE.md`."** That file is personal and not shared.
- **"Restrict a skill's tools with `allowed-tools`."** That field only pre-approves.
- **"Add an allow rule to override a deny."** Deny always wins.
- **"Use a hook for a style preference."** Hooks are for rules that must hold every time. Preferences belong in CLAUDE.md.
- **"A project skill overrides a personal skill with the same name."** Personal wins over project.

## What to remember

- Deterministic: hooks, deny rules, managed settings. Advisory: CLAUDE.md, rules, skills, prompts.
- CLAUDE.md levels concatenate from root to working directory. Subdirectory files load on demand.
- `@import` resolves relative to the importing file, nests up to four hops, and does not save context.
- Rules with `paths:` load when a matching file is read, written or edited. Compaction can drop them.
- Skills: description always loaded, body on demand. `disable-model-invocation` for side effects. `allowed-tools` pre-approves.
- Hooks: exit code 2 blocks. `updatedToolOutput` in `PostToolUse` normalizes tool results.
- Settings precedence: managed, CLI, local, project, user. Deny, then ask, then allow.

## Endnotes for this chapter

1. The best-practices guide separates deterministic controls from advisory ones, recommends a small enforced set, short CLAUDE.md files, deny rules for secrets, and notes that capitalized emphasis is no longer needed. Anthropic, "Best practices for Claude Code" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/best-practices
2. The memory docs describe CLAUDE.md locations, concatenation, on-demand subdirectory loading, `@` imports and their limits, `.claude/rules/` with `paths:`, and say CLAUDE.md is context rather than enforcement. Anthropic, "How Claude remembers your project" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/memory
3. `claudeMdExcludes` skips CLAUDE.md files for packages a developer never works in. Anthropic, "Set up Claude Code in a monorepo or large codebase" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/large-codebases
4. Path-scoped rules enter as message history and are summarized away by compaction, while root CLAUDE.md and unscoped rules are re-injected. Anthropic, "Explore the context window" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/context-window
5. Skills load descriptions up front and content on demand, absorb custom commands, and support fields such as `disable-model-invocation`, `allowed-tools` and `context: fork`. Anthropic, "Extend Claude with skills" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/skills
6. The hooks reference lists lifecycle events, explains that exit code 2 blocks, and distinguishes command and HTTP hooks from prompt and agent hooks. Anthropic, "Hooks reference" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/hooks
7. A PostToolUse hook can replace a tool's output for any tool with `updatedToolOutput`, while the older field covers MCP tools only. Anthropic, "Intercept and control agent behavior with hooks" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/agent-sdk/hooks
8. Settings files follow a fixed precedence from managed settings down to user settings. Anthropic, "Settings files and precedence" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/settings
9. The features overview compares when each extension loads and gives triggers such as adding a twice-missed convention to CLAUDE.md and saving a repeated prompt as a skill. Anthropic, "Extend Claude Code" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/features-overview
10. Permission rules are evaluated deny, then ask, then allow, and a deny in any scope blocks an allow in another. Anthropic, "Configure permissions" (Claude Code Docs, accessed 2026-11-01), https://code.claude.com/docs/en/permissions
