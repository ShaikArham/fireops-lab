# FireOps Lab full website walkthrough

**Target runtime:** 90 seconds at normal 1× speed
**Audience:** Fire Operations Analyst hiring team
**Deliverables:** MP4, WebP thumbnail, VTT captions and written transcript
**Status:** Narration and capture plan prepared. Final recording and playback verification are still pending.

## Narration draft

Every payment creates records in more than one system. When references, amounts or dates disagree, an operations analyst needs clear evidence and a reliable next step.

FireOps Lab is an independent payment-operations simulator with fictional data.

The local demo validates CSVs and records a simulated payment lifecycle; it never moves money. Our exception-day fixture has twelve hundred and fifty instructions and twelve hundred and thirty settlements. Explicit reference, amount and date rules produce exact matches, late matches, mismatches, duplicates and unmatched records. Ambiguous duplicates stay for review.

From an exception, I can open a case, assign an owner, record evidence and retain status changes in an audit history.

Monitoring rules show their thresholds and possible benign explanations. Alerts prompt human review; they do not prove fraud or money laundering.

Run-scoped insights explain the operational measures and export the same results.

The public Pages preview is read-only. FireOps Lab is not a live payment service and is not affiliated with Fire. Explore the demo and code on GitHub.

## Full-site shot list

| Time | Website area | Capture and proof point |
|---|---|---|
| 0–10s | Opening and problem | Show the FireOps Lab title, then frame two fictional source files. Keep the problem statement legible. |
| 10–20s | Homepage and project boundary | Show the hero, independent-project label and fictional-data notice. |
| 20–34s | Payment operations | Show CSV validation, the batch list and a simulated lifecycle event. Keep the “does not move money” boundary visible. |
| 34–50s | Reconciliation | Select the normal and exception-day batches, run reconciliation, and show exact, late, mismatch, duplicate and unmatched outcomes with source evidence. |
| 50–63s | Case investigation | Open an exception, show its source records, assignment, analyst note and audit history. Do not include personal or live financial data. |
| 63–76s | Transaction monitoring | Show a rule, threshold, evidence, benign explanation and human review. Never label the alert a confirmed crime or regulatory finding. |
| 76–84s | Operational insights | Show run-scoped definitions and the CSV export control. If the local API is used, verify the metrics against the selected run before capture. |
| 84–90s | Closing and limits | Show the method/limits section and repository link. State that the public GitHub Pages preview is read-only and the API is not hosted there. |

## Capture setup

- Record the locally running frontend and API against a fresh temporary database and the checked-in synthetic fixtures. Do not use personal or live financial information.
- Keep the capture on the current code branch. The public GitHub Pages site is read-only and must not be described as running the API-backed workflows.
- Record the narration in Audacity. Keep a natural speaking pace and normal 1× playback; do not time-stretch, pitch-shift or speed up the video.
- Compose titles, transitions and captions in Remotion. Use FFmpeg for H.264/AAC MP4 encoding and WebP thumbnail output. Prefer system fonts, self-created graphics and software already available at no cost.
- Align captions to the final narration with WhisperX if it can run locally without a paid service; otherwise time the VTT against the recorded audio and verify it by listening.
- Add a short transcript and the required synthetic-data and independence disclosures alongside the video.

## Acceptance checks

- MP4 duration is 60–90 seconds and plays at normal 1× speed.
- Audio is clear, complete, and matches the written transcript.
- VTT cues cover the narration, parse successfully, and match the spoken wording and timing.
- Thumbnail is a readable WebP and matches a real frame in the final video.
- Desktop and mobile playback both work; captions can be enabled and remain legible at mobile width.
- Video, thumbnail, captions and transcript are linked from the website only after all assets exist and have been inspected.
- Save the final capture/playback evidence in the release checklist. Do not mark the video gate complete from the script alone.
