# FireOps Lab full website walkthrough

**Review-cut runtime:** 69.24 seconds at normal 1× speed

**Final narrated target:** 60–90 seconds

**Audience:** Fire Operations Analyst hiring team

**Deliverables:** MP4, WebP thumbnail, VTT captions and written transcript

**Status:** Silent review cut captured, encoded and visually inspected. The matching 1280×720 WebP thumbnail and descriptive VTT are prepared. Human narration and speech-aligned captions remain pending.

## Narration draft

Use the proposed human narration in [video-transcript-draft.md](video-transcript-draft.md) for the final voice recording. The current MP4 is silent; do not describe the script as audio already recorded.

## Full-site shot list

| Time | Website area | Capture and proof point |
|---|---|---|
| 0–8s | Homepage and project boundary | Show the hero, independent-project label and fictional-data notice. |
| 8–23s | Payment operations | Show CSV validation, the batch list and a simulated lifecycle event. Keep the “does not move money” boundary visible. |
| 23–32s | Reconciliation | Select the exception-day batches, run reconciliation, and show the result count and source comparisons. |
| 32–41s | Case investigation | Open an exception, show assignment, analyst note, resolution reason and audit history. |
| 41–51s | Transaction monitoring | Show a rule, threshold, evidence, benign explanation and human review. Do not label an alert a confirmed crime or regulatory finding. |
| 51–59s | Operational insights | Show run-scoped measures and the CSV export control. |
| 59–69s | Closing and limits | Show the method/limits section. State that the capture API is local and GitHub Pages remains read-only. |

## Capture setup

- Record the locally running frontend and API against a fresh temporary database and the checked-in synthetic fixtures. Do not use personal or live financial information.
- Keep the capture on the current code branch. The public GitHub Pages site is read-only and must not be described as running the API-backed workflows.
- Record the proposed narration in Audacity using the user's human voice. Keep a natural speaking pace and normal 1× playback; do not time-stretch, pitch-shift or speed up the video.
- Compose titles, transitions and captions in Remotion. Use FFmpeg for H.264/AAC MP4 encoding and WebP thumbnail output. Prefer system fonts, self-created graphics and software already available at no cost.
- Align captions to the accepted human narration with WhisperX if it can run locally without a paid service; otherwise time the VTT against the recorded audio and verify it by listening.
- Add a short transcript and the required synthetic-data and independence disclosures alongside the video.

## Acceptance checks

- MP4 duration is 60–90 seconds and plays at normal 1× speed.
- Spoken audio is clear, complete and matches the written transcript.
- Final VTT cues cover the narration, parse successfully and match the spoken wording and timing. The current VTT is descriptive text for the silent review cut.
- Thumbnail is a readable WebP and matches a real frame in the final video.
- Desktop and mobile playback both work; captions can be enabled and remain legible at mobile width.
- Video, thumbnail, captions and transcript are linked from the website only after all assets exist and have been inspected.
- Save the final capture/playback evidence in the release checklist. Do not mark the video gate complete from the script alone.
