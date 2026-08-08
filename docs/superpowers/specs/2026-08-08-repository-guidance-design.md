# Repository Guidance and Prompt Log Design

**Status:** Structure approved on 8 August 2026  
**Scope:** Root `AGENTS.md` and `docs/ai/PROMPT_LOG.md` only  
**Product implementation:** Paused until the user explicitly confirms setup completion and authorizes execution

## Purpose

Add durable repository instructions for Codex and create an honest vibecoding evidence ledger before product implementation begins. The files must prevent premature implementation, keep project documentation aligned by domain, and ensure future prompt records contain only directly known metadata.

## Non-goals

- Do not install dependencies, scaffold the application, run implementation tasks, or create product code.
- Do not add retrospective prompt entries for kickoff, brainstorming, design, or planning.
- Do not infer the AI tool, model, team member, timestamp, or commit when that information is not directly available.
- Do not duplicate the full product specification or implementation plan inside `AGENTS.md`.

## Domain-based sources of truth

`AGENTS.md` will direct agents to the authoritative document for each domain rather than define a single linear precedence chain.

| Domain | Source of truth | Boundary |
|---|---|---|
| Official competition facts, requirements, and unresolved organizer conflicts | `BITSMIKRO_CONTEXT_FILTERED.md` | Preserve ambiguities; do not invent or silently resolve rules. |
| Product angle, urgency, rubric proof points, team ownership, scope cuts, deadlines, and submission checklist | `HACKATHON.md` | Governs competition strategy and delivery commitments. |
| Approved product behavior, UX, architecture, privacy, safety, and evaluation design | `docs/superpowers/specs/2026-08-08-cekdulu-design.md` | Governs what CekDulu is and is not. |
| Implementation order, file boundaries, interfaces, test commands, and task-level commits | `docs/superpowers/plans/2026-08-08-cekdulu-implementation.md` | Governs execution only after the setup gate is released. |
| Agent operating rules and setup/authorization gate | `AGENTS.md` | Governs how repository agents work; it does not redefine product requirements. |
| Vibecoding evidence created during implementation | `docs/ai/PROMPT_LOG.md` | Append-only evidence; it does not act as a specification. |

If two documents disagree within the same domain, the agent stops, reports the exact conflict, and asks the user. The agent does not invent a cross-domain precedence rule.

## Root AGENTS.md structure

### 1. Current status and setup gate

- State that product implementation is paused.
- Do not install dependencies, scaffold, create source code, execute implementation tasks, or deploy.
- Documentation/setup changes are allowed only when explicitly requested.
- The gate is released only when the user explicitly states that setup is complete and authorizes implementation.
- Never infer readiness merely because credentials, package files, or tooling appear in the workspace.

### 2. Domain source map

Include the domain table above in a compact form and require conflicts to be surfaced rather than silently resolved.

### 3. Product invariants

- CekDulu remains a risk-checking assistant, not a definitive fraud detector.
- Raw screenshots remain in the browser.
- Only user-confirmed redacted text crosses the API boundary.
- AI timeout yields general safety guidance and Retry without a risk classification.
- No database, account, URL crawling, automatic reporting, or inferred owner identity in the MVP.

### 4. Evaluation integrity

- Development fixtures and holdout data stay separate.
- The prompt-owning workflow must not inspect holdout message contents before the official run.
- `13/15` may be described only as agreement with team expected classification, never as fraud-detection accuracy.
- Holdout content and sensitive user messages must not appear in the prompt log.

### 5. Workflow after gate release

- Follow the approved implementation plan in order, beginning with Feature Zero.
- Use test-first steps and run the specified verification commands before success claims.
- Make focused commits and preserve unrelated user changes.
- Do not modify the untracked competition brief unless explicitly instructed.

### 6. Vibecoding logging

- Start logging with the first implementation task.
- Append the real entry before the related task commit.
- Never reconstruct prior prompts or fabricate missing metadata.
- Tool/model metadata is optional and included only when explicitly known from the active environment or supplied by the user.

## Prompt log structure

The initial file contains policy and an empty ledger, not historical entries.

### Initial status

> Logging has not started. The first entry is created when implementation Task 1 begins after the setup gate is explicitly released.

### Required entry fields

- Entry ID
- Timestamp with timezone
- Team member, only when directly known
- Implementation task/reference
- Goal
- Context and constraints
- Full prompt
- Response summary
- Verification performed and observed result
- Decision: accepted, revised, or rejected
- Related files
- Related commit, added when created

### Optional metadata

- Tool
- Model

Tool and model are recorded only when directly exposed by the active environment/session or explicitly supplied by the user. If unknown, the fields are omitted; values such as “probably,” inferred aliases, or guessed model families are prohibited.

### Log integrity rules

- Append-only: corrections use a new entry that references the earlier entry.
- No API keys, secrets, private screenshots, raw user messages, personal data, or holdout cases.
- Administrative conversation that does not influence product implementation is not logged.
- Summaries must distinguish generated suggestions from verified outcomes.
- An entry is not complete until its verification evidence and decision are recorded.

## Acceptance criteria

- Root `AGENTS.md` exists and is within the default 32 KiB project-instruction limit.
- The setup gate is unambiguous and product implementation remains paused.
- Sources of truth are mapped by domain, with no global precedence list.
- `docs/ai/PROMPT_LOG.md` exists with an empty implementation ledger and no retrospective entries.
- Tool/model metadata is explicitly optional and never inferred.
- Both files prohibit secrets, personal data, and holdout content in the log.
- Both files agree with `HACKATHON.md`, the approved product design, and the implementation plan.

