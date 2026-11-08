# FireOps Lab introduction video — narration and capture plan

**Target runtime:** 75 seconds at normal 1× speed  
**Deliverables:** MP4, WebP thumbnail, VTT captions, written transcript  
**Production:** OBS Studio screen capture, Audacity narration, Remotion composition, FFmpeg encoding/optimisation, WhisperX caption alignment. Keep all tools and services free; use no subscription-only assets.

## Narration draft

Every payment leaves a trail across systems. When references do not line up, a settlement arrives late, or a record is duplicated, an operations analyst needs clear evidence and a reliable way to decide what happens next.

FireOps Lab is an independent payment-operations simulator built around that work. It uses fictional data and explainable rules.

Here, I select payment and settlement batches and run a reconciliation. Exact matches, late records, amount differences, duplicates and missing references are classified side by side, with the source evidence available for review.

An exception can then be investigated through a controlled case workflow. Notes, decisions and status changes stay in an audit history.

The monitoring view surfaces rule evidence and possible benign explanations. An analyst makes the decision; an alert is not treated as proof of fraud or money laundering.

Operational reports stay tied to the selected run and can be exported for follow-up.

FireOps Lab is a portfolio project, not a live payment service and not affiliated with Fire. Explore the read-only demo and the code on GitHub.

## Shot plan

| Time | Screen or visual | Required capture |
|---|---|---|
| 0–7s | Payment records split across two sources; restrained title | Use actual app/table visuals or simple Remotion typography. No fake bank branding or real customer information. |
| 7–15s | FireOps Lab title and synthetic-data label | Capture the real project header and read-only notice. |
| 15–31s | Reconciliation workspace | Show selecting both batches and running the fixture. Hold long enough to read exact match, late, mismatch, duplicate and unmatched classifications. |
| 31–45s | Exception investigation | Open a real synthetic exception. Show source evidence and audit activity without implying a regulated production case. |
| 45–58s | Transaction monitoring | Show rule, evidence and benign explanation, then the human review/disposition control. Do not label an alert as a confirmed crime. |
| 58–68s | Operational insights and export | Show run-scoped figures and download the corresponding report. Verify displayed totals against the selected run before recording. |
| 68–75s | Project name, GitHub and public preview links | End with a concise call to explore. Keep the independence and fictional-data statement visible. |

## Recording and edit checks

- Capture actual application screens in OBS at readable desktop resolution; do not fabricate workflow states in motion graphics.
- Record narration in Audacity, then align captions to the accepted final audio.
- Compose titles, transitions and captions in Remotion. Use FFmpeg to encode MP4 and WebP thumbnail.
- Keep narration and screen recording at normal speed. Do not speed up, time-stretch or pitch-shift narration.
- Confirm the final runtime is 60–90 seconds, the audio is intelligible, captions match the audio, the VTT is valid, and the transcript matches.
- Play the MP4 at 1× in a desktop browser and a mobile browser/device; inspect caption display and the thumbnail.
- Do not mark video delivery complete until the actual exported assets and playback checks are recorded in the release checklist.

**Status:** Script/shot-plan draft only. No final recording or video asset is claimed.
