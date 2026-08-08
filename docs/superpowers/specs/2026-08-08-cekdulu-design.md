# CekDulu Product Design

**Status:** Approved in collaborative design review on 8 August 2026  
**Competition:** BITSMIKRO Innovative Vibecode 2026  
**Submission deadline:** 10 August 2026, 13:00 WITA

## 1. Product summary

CekDulu is a privacy-first web application that helps people inspect suspicious messages before clicking a link, sharing credentials, or transferring money. A user uploads a screenshot or pastes text. CekDulu extracts the text locally, lets the user correct it, redacts sensitive data, and sends only the redacted text to an AI analysis endpoint. The result explains observable risk signals, quotes the relevant phrases, and gives safe verification steps.

CekDulu is a risk-checking assistant, not a fraud verdict service. It never claims that a message is definitely safe or definitely fraudulent.

## 2. User and problem

### Primary user

The primary persona is **Ibu Rina, age 52**, who receives a message claiming to come from a courier, bank, marketplace, or public institution. The message pressures her to click a link, disclose information, or transfer money. She would normally wait for a family member to inspect it.

### Secondary user

A child or other family member can use CekDulu to inspect a message on someone else's behalf.

### Product promise

> In under 60 seconds, CekDulu helps a user understand why a message may be risky and what to do before taking action.

### Urgency hook

> When a message pressures Ibu Rina to transfer money within minutes, waiting for a family member can be the difference between verifying and becoming a victim—while IASC had already received 579,459 reports by 31 May 2026.

The figure comes from the OJK May 2026 Board of Commissioners meeting report.

## 3. Goals and non-goals

### Goals

- Accept a screenshot or pasted message text.
- Run OCR locally in the browser and allow correction.
- Redact phone numbers, account-like number sequences, email addresses, and URLs before network transmission.
- Explain observable risk signals in plain Indonesian.
- Highlight the exact redacted phrases that support each signal.
- Provide prioritized verification and safety actions.
- Link to official IASC/OJK guidance.
- Remain usable on desktop and mobile without requiring an account.
- Produce a clear vibecoding evidence trail throughout development.

### Non-goals

- Declaring a message definitely safe or definitely fraudulent.
- Identifying the owner of a phone number or bank account.
- Opening, crawling, or scanning a submitted URL.
- Automatically submitting a report to IASC, OJK, or law enforcement.
- Providing a conversational chatbot.
- Maintaining user accounts, a database, or message history.
- Shipping a browser extension.
- Building an analytics dashboard.

## 4. User experience

### Screen 1: Home

- Brand: **CekDulu**.
- Tagline: **Sebelum klik atau transfer, CekDulu.**
- Primary message: **Cek pesannya. Lindungi keputusanmu.**
- One primary action: upload a screenshot.
- Secondary path: paste message text.
- A short privacy explanation states that the image remains on the device and only redacted text is sent for analysis.
- A built-in sample provides a reliable demonstration path.

### Screen 2: Review and redact

- Display the OCR output in an editable field.
- Show which values will be replaced by redaction tokens.
- Require explicit confirmation before analysis.
- If OCR quality is poor, explain how to crop the image or paste/correct the text.

### Screen 3: Result

- Show a low, medium, or high risk level without a fake precision percentage.
- Summarize the concern in plain language.
- List evidence cards containing a quote, signal category, and explanation.
- Present two to four prioritized next actions.
- State the limits of the analysis.
- Provide an official IASC guidance link and an action to inspect another message.

### Visual direction

The approved visual direction is **Calm Guardian**: warm ivory backgrounds, dark blue editorial text, teal trust cues, amber warnings, rounded but restrained surfaces, generous spacing, and large readable type. The interface should reassure without minimizing risk. It must not imitate WhatsApp, a bank, or a government agency.

## 5. Feature Zero

Feature Zero is the first deployed end-to-end slice:

1. Select a built-in sample message.
2. Send its already-redacted text to the analysis endpoint.
3. Receive schema-valid structured output.
4. Render the risk level, evidence, actions, and limitations.

Feature Zero is complete only when it works from a fresh browser through a public deployment. OCR, screenshot upload, refined redaction, motion, and secondary content are built only after this slice works.

## 6. Architecture

The approved architecture is a privacy-first hybrid with no database.

```text
Screenshot or pasted text
        |
        v
Browser OCR
        |
        v
Editable text review
        |
        v
Browser redaction preview and confirmation
        |
        v
Serverless analysis endpoint
        |
        v
AI provider adapter -> JSON schema validation -> one retry if invalid
        |
        v
Risk result renderer
```

### Browser components

- **Message intake:** validates file type, file size, and pasted text length.
- **OCR adapter:** extracts text locally and reports progress or failure.
- **Text review:** lets the user correct OCR output.
- **Redactor:** replaces sensitive spans with typed tokens and produces a preview.
- **Analysis client:** sends only confirmed redacted text.
- **Result renderer:** displays only schema-valid output.
- **Graceful fallback:** when AI is unavailable, provides general safety guidance and a retry action without assigning a risk level.

### Serverless components

- **Request validator:** rejects malformed or oversized input.
- **Prompt builder:** supplies the safety policy, taxonomy, output contract, and redacted message.
- **Provider adapter:** isolates the configured text-generation provider from the application contract.
- **Response validator:** validates JSON and retries once after an invalid response.
- **Response filter:** rejects prohibited absolute-safety language before returning a result.

### AI response contract

```json
{
  "version": "1",
  "riskLevel": "low | medium | high",
  "summary": "Plain-language summary",
  "signals": [
    {
      "quote": "Exact quote from the redacted input",
      "category": "urgency | impersonation | credential_request | payment_request | unverified_link | other",
      "explanation": "Why this observable signal matters"
    }
  ],
  "actions": [
    {
      "priority": 1,
      "title": "Short action title",
      "instruction": "Concrete verification or safety step"
    }
  ],
  "limitations": ["What the system cannot verify"]
}
```

The quote must exist in the redacted input. The server rejects invented evidence.

## 7. Privacy and safety

- The raw screenshot never leaves the browser.
- The user sees and confirms the redacted text before analysis.
- The API key exists only in the serverless environment.
- The application stores no messages or screenshots.
- Application logs must exclude message bodies and redacted payload contents.
- Analytics, if added later, may capture only non-content operational events.
- URLs are treated as inert text and never fetched.
- The interface never invents official phone numbers; it links to official web guidance.
- A low-risk result says that no strong signals were found, not that the message is safe.

## 8. Error handling

| Failure | User-facing behavior |
|---|---|
| Unsupported or oversized image | Explain the supported format/limit and keep the user on intake. |
| OCR cannot read the screenshot | Offer crop guidance and an editable paste-text path. |
| No usable text remains | Disable analysis and ask the user to correct or paste the message. |
| Redaction removes too much context | Let the user review the redacted copy while preserving the sensitive tokens. |
| AI timeout or provider outage | Show general safety guidance and Retry; do not invent a risk classification. |
| Invalid AI schema | Retry once server-side, then use the same graceful fallback. |
| No strong signals found | Explain uncertainty and retain general verification guidance. |

No additional rule-based classifier is built for the MVP timeout path.

## 9. Evaluation design

Development fixtures and the holdout evaluation set are separate.

### Development fixtures

Ten development fixtures may be used for prompt and implementation tuning: two examples from each message category. Their role is to expose obvious prompt, schema, redaction, and UI defects during development.

### Holdout set

Fifteen unseen holdout messages are written and labeled before the official evaluation run. The set contains three examples from each category:

1. Clearly suspicious messages.
2. Subtle manipulation.
3. Ambiguous messages.
4. Legitimate urgency.
5. Normal messages.

The holdout cases are not used to tune the prompt. If the system changes after the official holdout run, those results are marked stale and a new independently written holdout set is required for a new claim.

### Acceptance criteria

- All 15 holdout responses satisfy the JSON schema.
- At least 13 of 15 risk levels match the team's expected classification.
- This result is reported only as **agreement with the team's expected classification**, never as fraud-detection accuracy.
- All designated phone, account-like, email, and URL values in redaction tests are absent from inspected API requests.
- No output contains an absolute claim such as “definitely safe” or “definitely fraudulent.”
- The deployed core flow completes in 60 seconds or less under the demo network conditions.
- A non-owner team member completes one fresh-browser rehearsal without assistance.

### Additional tests

- Unit tests for redaction patterns and typed replacement tokens.
- Contract tests for schema validation and retry behavior.
- OCR tests using light, dark, blurred, and cropped screenshots.
- UI tests for loading, success, empty, timeout, and invalid-output states.
- Desktop and mobile smoke tests.

## 10. Vibecoding evidence

Every meaningful AI-assisted development interaction is logged with:

- ID and timestamp;
- team member, AI tool, and model;
- goal, context, and constraints;
- full prompt;
- concise response summary;
- verification performed;
- decision: accepted, revised, or rejected;
- related file and commit.

The final story shows at least three real iterations:

1. Turning competition constraints into Feature Zero.
2. Fixing invalid schema or overconfident wording.
3. Finding a development-fixture mismatch, revising the prompt or implementation, and rerunning the development suite.

API keys and personal data are never included in the prompt log.

## 11. Demo success path

The live demo uses a clearly labeled synthetic message:

1. Upload the screenshot.
2. Show local OCR and correct one deliberate OCR error.
3. Show the redaction preview.
4. Run analysis.
5. Point to two highlighted signals.
6. Follow the prioritized verification guidance.
7. State the product limitation and privacy guarantee.

A prerecorded backup demonstrates the same deployed flow, but the product must also work live.

## 12. Scope-cut order

If schedule pressure rises, cut in this order:

1. Decorative animation and secondary marketing sections.
2. More than three built-in example messages.
3. Result export/share.
4. Extra educational content about scam categories.
5. Mobile-specific polish beyond a usable responsive layout.

Never cut deployment, the core input-to-result path, redaction confirmation, schema validation, graceful fallback, prompt logging, or the official-source link.

