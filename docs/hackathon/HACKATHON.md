# BITSMIKRO Innovative Vibecode 2026 — CekDulu

## Decision snapshot

- **Product:** CekDulu
- **Tagline:** Sebelum klik atau transfer, CekDulu.
- **Format:** Deployed privacy-first web application
- **Primary user:** Parents who receive suspicious messages
- **Secondary user:** Family members helping them inspect a message
- **Submission deadline:** 10 August 2026, 13:00 WITA
- **Pitch:** 10 minutes plus 2–5 minutes Q&A
- **Pitch date conflict:** Guide Book says 14 August; Technical Meeting says 15 August. Plan to be pitch-ready by 14 August until organizers confirm.
- **Design:** Calm Guardian
- **Architecture:** Local OCR/redaction plus a serverless AI analysis endpoint; no database

## One-sentence angle

CekDulu turns a suspicious-message screenshot into an explainable risk check and safe next actions while keeping the original image on the user's device.

## Urgency hook

> When a message pressures Ibu Rina to transfer money within minutes, waiting for a family member can be the difference between verifying and becoming a victim—while IASC had already received 579,459 reports by 31 May 2026.

Source: OJK, May 2026 Board of Commissioners Meeting report.

## Problem statement

Suspicious messages exploit urgency, impersonation, fear, and unfamiliar links. A recipient may sense that something is wrong but cannot explain the signals or decide what to verify first. Waiting for a more digitally experienced family member creates a dangerous delay.

## Proposed solution

CekDulu accepts a screenshot or pasted text, performs OCR locally, lets the user correct and redact sensitive values, and asks AI to produce a structured risk explanation. The result shows a cautious risk level, quotes the observed signals, gives prioritized verification steps, states its limitations, and links to official IASC guidance.

CekDulu never claims that a message is definitely safe or definitely fraudulent.

## Feature Zero

The first deployed slice uses a built-in synthetic message:

1. Select the sample.
2. Send its redacted text to the serverless analysis endpoint.
3. Validate the AI response against the fixed schema.
4. Render risk level, evidence, actions, and limitations.

Feature Zero must work from a fresh browser before OCR or visual polish begins.

## Product scope

### Must ship

- Screenshot and paste-text intake
- Browser-side OCR and editable review
- Browser-side redaction preview and confirmation
- Serverless AI analysis with a fixed JSON contract
- Low, medium, and high risk presentation without fake precision
- Evidence quotes and plain-language explanations
- Prioritized verification and safety actions
- Clear limitations
- Graceful timeout fallback with general safety guidance and Retry
- Built-in synthetic demo message
- Official IASC/OJK guidance link
- Public deployment
- Usable desktop and mobile layouts
- Prompt/vibecoding log

### Explicitly out of scope

- Account and login
- Database or message history
- Phone/account-owner lookup
- URL crawling
- Automatic reporting
- Chatbot conversation
- Browser extension
- Analytics dashboard
- Definitive safe/scam verdicts
- Rule-based risk classifier for the timeout path

## AI strategy

### AI used during development

All meaningful AI-assisted work is documented with the prompt, response summary, verification, decision, and related file/commit. The final evidence must show real iterations, including an output that was rejected or revised.

### AI inside the product

AI connects multiple observable signals, explains them in simple Indonesian, and returns prioritized actions in a fixed schema. It is not used to invent facts, identify an account owner, open links, or issue an absolute fraud verdict.

## Rubric reverse-engineering

### Product rubric

| Criterion | Weight | Demo-able proof point |
|---|---:|---|
| Product Functionality | 25% | From a fresh deployment, upload a synthetic screenshot and complete OCR, redaction, analysis, and result rendering in under 60 seconds. |
| Prompting Quality | 20% | Open the real prompt log and show three prompt→verification→revision stories tied to files/commits. |
| Code Quality / Complexity | 20% | Show isolated OCR, redaction, provider, schema-validation, and result-rendering units plus their tests. |
| Product UI/UX | 15% | Ibu Rina can finish the core flow without instruction; loading, error, and privacy states are explicit. |
| Alignment with Proposal | 20% | Every claimed proposal feature maps to a shipped screen, test, and demo step; no unbuilt feature is presented as complete. |

### Proposal rubric

| Criterion | Weight | Evidence |
|---|---:|---|
| Completeness of Structure | 20% | All required headings are present and checked before PDF export. |
| Content Matches Subheading | 15% | Background contains the problem/evidence; solution and features stay in their respective sections. |
| Clarity of Explanation | 20% | Each section uses problem→decision→evidence language and defines technical terms. |
| Indonesian Language Quality | 15% | One final human editing pass ensures consistent, natural Indonesian. |
| Spelling and Punctuation | 10% | Perform a dedicated PUEBI/spelling pass after content freeze. |
| Coherence Between Sections | 10% | The same persona, problem, feature names, and claims appear throughout. |
| Document Neatness | 10% | Use consistent headings, grids, captions, page numbers, and image treatment. |

The official sources conflict on section 3.5 (`Fitur Utama` versus `Tampilan Halaman Aplikasi`) and chapter structure. Preserve this conflict in working notes and seek organizer confirmation. If no confirmation arrives, include both feature descriptions and application screens without claiming that the ambiguity was officially resolved.

### Pitch rubric

| Criterion | Weight | Demo-able proof point |
|---|---:|---|
| Problem and Solution Explanation | 15% | Introduce Ibu Rina, the pressured message, and CekDulu's before/after outcome within 60 seconds. |
| Product Demo | 25% | Use a 2–3 minute live synthetic-message flow with a prerecorded backup of the same deployed version. |
| AI Utilization | 20% | Show both the in-product structured analysis and one genuine vibecoding iteration. |
| Product Mastery | 15% | Explain privacy boundaries, failure states, expected-classification evaluation, and why CekDulu avoids definitive verdicts. |
| Communication and Presentation | 25% | Deliver a timed 10-minute story with clean handoffs and a single memorable call to “CekDulu.” |

## Evaluation protocol

### Development fixtures

Use 10 development fixtures for tuning: two per category.

### Holdout test

Freeze 15 unseen holdout cases before the official run: three each covering clearly suspicious messages, subtle manipulation, ambiguous messages, legitimate urgency, and normal messages.

Acceptance targets:

- 15/15 schema-valid holdout outputs
- At least 13/15 risk labels agree with the team's expected classification
- Never describe this result as fraud-detection accuracy
- All designated sensitive values absent from inspected API requests
- Zero absolute “safe” or “fraud” claims
- Core deployed flow completed in at most 60 seconds

The holdout set is not used for tuning. A post-holdout system change invalidates the claim until a new independently written holdout set is run.

## Team ownership

Assignments are provisional because individual strengths were not supplied; they balance the workstreams and may be swapped without changing scope.

| Member | Build ownership | Documentation ownership | Pitch ownership |
|---|---|---|---|
| Wira | Serverless AI adapter, prompt contract, response schema | AI workflow and prompt-iteration narrative | Problem urgency and AI utilization |
| Mega | Calm Guardian UI, intake/review/result screens | Proposal structure, language, and visual consistency | Solution, innovation, and UI/UX |
| Nata | Browser OCR, redaction, integration, tests, deployment | Evaluation evidence, setup guide, demo backup | Live demo, technology, challenges, and limitations |

Every member logs their own AI prompts. Every member must be able to explain the complete user flow and safety boundary.

## Pre-agreed scope cuts

Cut in this order:

1. Decorative motion and secondary landing-page sections.
2. More than three built-in samples.
3. Result export/share.
4. Extra educational content about scam categories.
5. Mobile-specific polish beyond basic usability.

Never cut deployment, core input→result, redaction confirmation, schema validation, graceful timeout handling, prompt logging, official guidance, or the synthetic live demo.

## Back-solved submission plan

The plan begins from the 8 August 2026, 11:30 WITA design freeze and protects a 90-minute submission buffer.

| Deadline | Checkpoint | Owner focus | Exit condition |
|---|---|---|---|
| 8 Aug, 13:00 | Design and contract freeze | All | Approved spec, fixed output schema, proposal claims limited to must-ship scope |
| 8 Aug, 18:00 | Feature Zero deployed | Wira + Mega | Built-in sample reaches a schema-valid rendered result on a public URL |
| 8 Aug, 23:00 | Privacy path integrated | Nata + Wira | Text review, redaction preview, API boundary, and graceful timeout state work |
| 9 Aug, 12:00 | Core UI and OCR complete | Mega + Nata | Screenshot path, Calm Guardian screens, and mobile smoke test work |
| 9 Aug, 16:00 | Feature freeze | All | Must-ship scope complete; only defects and submission artifacts remain |
| 9 Aug, 19:00 | Official holdout run | Wira + Nata | Locked 15-case results captured without tuning on holdout cases |
| 9 Aug, 22:00 | QA and demo recording | All | Fresh-browser rehearsal passes and backup video is captured |
| 10 Aug, 08:00 | Documentation freeze | Mega + all | Proposal, prompt log, setup guide, and alignment matrix are final |
| 10 Aug, 09:00 | Social requirement complete | Mega | Required Instagram post and link are verified |
| 10 Aug, 10:30 | Package freeze | Nata | Deployment, source package, PDF, demo, prompt evidence, and links verified |
| 10 Aug, 11:30 | Submission verified | All | Uploaded files open correctly and all external links work |
| 10 Aug, 13:00 | Hard deadline | All | 90-minute contingency remains after planned verification |

Team members should preserve two sleep blocks rather than relying on overnight work; parallel ownership is intended to keep the checkpoints achievable.

## Pitch-readiness plan if selected in the top five

Use 14 August as the safe readiness target until the organizer resolves the 14/15 August conflict.

- **10 Aug afternoon:** archive final evidence and rest.
- **11 Aug:** build the pitch deck around urgency, proof, and demo.
- **12 Aug:** write and time the 10-minute script; prepare 2–5 minute Q&A answers.
- **13 Aug:** rehearse with deployment failure and API-timeout scenarios.
- **14 Aug:** remain ready to pitch.

## Submission checklist

- Public deployment link
- Functional core flow
- Source code and supporting assets
- Setup/configuration documentation
- Proposal PDF
- Demo video showing local setup and all core features
- Prompt/share-chat evidence
- Holdout evaluation artifact with careful claim wording
- Instagram UI/demo post with `@bitsmikro` and `@mikroskil`
- Instagram post link included in submission attachments
- Package under 1 GB and verified on a clean device/browser

## Competition ambiguities to confirm

- Final pitching date: 14 or 15 August 2026
- Proposal section 3.5: `Fitur Utama` or `Tampilan Halaman Aplikasi`
- Proposal chapter layout: current template/Technical Meeting or older Guide Book structure
- Originality wording: not previously won versus not previously entered

Do not silently resolve any of these as an official rule.
