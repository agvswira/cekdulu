# CekDulu Repository Instructions

## Current status: setup gate active

Product implementation is paused.

- Do not install dependencies, scaffold the application, create product source code, execute implementation tasks, run deployment, or start the holdout evaluation.
- Documentation and setup changes are allowed only when the user explicitly requests them.
- Release this gate only after the user explicitly states that setup is complete and authorizes implementation.
- Do not infer readiness from credentials, package files, environment variables, or tooling that appears in the workspace.

## Sources of truth by domain

Use the document assigned to the relevant domain. There is no single linear precedence list.

| Domain | Source |
|---|---|
| Official competition facts, requirements, and organizer ambiguities | `docs/hackathon/BITSMIKRO_CONTEXT_FILTERED.md` |
| Product angle, urgency, rubric proof, ownership, scope cuts, deadlines, and submission checklist | `docs/hackathon/HACKATHON.md` |
| Approved product behavior, UX, architecture, privacy, safety, and evaluation design | `docs/superpowers/specs/2026-08-08-cekdulu-design.md` |
| Implementation order, file boundaries, interfaces, tests, and task commits | `docs/superpowers/plans/2026-08-08-cekdulu-implementation.md` |
| Repository-agent behavior and the setup gate | `AGENTS.md` |
| Vibecoding evidence created during implementation | `docs/ai/PROMPT_LOG.md` |

If documents disagree within the same domain, stop and report the exact conflict to the user. Do not invent a cross-domain precedence rule or silently resolve an official ambiguity.

## UI/UX Skill Boundary

- Use `ui-ux-pro-max` only for UI/UX implementation or review, and treat its recommendations as advisory input that must be filtered against the approved CekDulu design spec.
- Do not use the skill to change the approved product scope, the Calm Guardian visual direction, or any privacy or safety requirement.
- Do not change the approved user flow based on a skill recommendation without explicit user approval.

## Sol Advisor Boundary

- Superpowers remains the primary engineering workflow.
- Sol Advisor is an optional orchestration lane only for complex or high-risk work, difficult debugging, or independent/final review.
- Routine or local tasks do not require Sol Advisor.
- `ui-ux-pro-max` remains the specialist UI/UX skill.
- Sol Advisor must not change the approved scope, Calm Guardian direction, privacy or safety requirements, approved user flow, design spec, or implementation plan without explicit user approval.
- Treat worker or subagent reports as claims until the parent inspects the actual diff and runs verification independently.
- Luna/Max requires explicit user authorization.

## Product invariants

- CekDulu is a risk-checking assistant, not a definitive fraud detector.
- Never claim that a message is definitely safe or definitely fraudulent.
- Raw screenshots remain in the browser.
- Only redacted text confirmed by the user may cross the API boundary.
- An AI timeout returns general safety guidance and Retry without a risk classification.
- The MVP has no account, database, message history, URL crawling, owner lookup, automatic reporting, or conversational chatbot.

## Evaluation integrity

- Keep development fixtures and holdout cases separate.
- The prompt-owning workflow must not inspect holdout message contents before the official run.
- Describe `13/15` only as agreement with the team's expected classification, never as fraud-detection accuracy.
- Never place holdout content, private screenshots, raw user messages, or personal data in prompts or the prompt log.
- If the system changes after the official holdout run, treat the result as stale until a new independently written holdout is run.

## Workflow after the setup gate is released

- Follow `docs/superpowers/plans/2026-08-08-cekdulu-implementation.md` in order, beginning with Feature Zero.
- Use the test-first cycle and verification commands specified in each task.
- Do not claim success without fresh verification evidence.
- Make focused commits and preserve unrelated user changes.
- Do not modify `docs/hackathon/BITSMIKRO_CONTEXT_FILTERED.md` unless the user explicitly requests it.
- Do not expand scope beyond the approved product design and `docs/hackathon/HACKATHON.md` commitments.

## Vibecoding prompt log

- Logging begins with implementation Task 1 after the setup gate is explicitly released.
- Do not create retrospective entries for kickoff, brainstorming, design, planning, or repository setup.
- Append one compact entry for each meaningful implementation decision before the related task commit.
- Use this compact entry format:

  ```md
  ## P-001 · Task 1 · YYYY-MM-DD HH:MM WITA

  **Tujuan:** Satu kalimat yang menjelaskan hasil yang ingin dicapai.

  **Tool/model:** Cantumkan hanya jika diketahui secara langsung.

  <details>
  <summary>Prompt lengkap</summary>

  Prompt asli tanpa perubahan.

  </details>

  **Hasil:** Ringkasan satu sampai tiga pernyataan singkat.

  **Verifikasi:** Perintah atau pemeriksaan → hasil yang benar-benar diamati.

  **Keputusan:** Diterima, direvisi, atau ditolak beserta alasan singkat.

  **Artefak:** `path/file` · commit `hash` setelah commit tersedia.
  ```
- Do not record a team member, author, operator, or task owner.
- Record tool/model only when directly exposed by the active environment/session or explicitly supplied by the user. Omit the field when unknown; never infer it.
- Preserve the full prompt inside a collapsed block, keep summaries concise, and record the verification result and decision.
- Treat the log as append-only. Correct an earlier entry with a new entry that references it.
- Never record API keys, secrets, personal data, raw private messages, or holdout cases.

## Repository hygiene

- Preserve untracked and unrelated user files.
- Use `apply_patch` for file edits.
- Never add secrets to Git.
- Before committing, inspect the diff and run checks appropriate to the files changed.
- Product implementation remains paused until the setup gate is explicitly released.
