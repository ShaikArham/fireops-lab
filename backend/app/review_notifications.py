"""Privacy-minimising reviewer activity summaries for the public portfolio."""
import json
import logging
import os
import time
from datetime import UTC, datetime
from threading import Lock
from urllib.error import HTTPError, URLError
from urllib.request import Request as UrlRequest
from urllib.request import urlopen
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

router = APIRouter()
logger = logging.getLogger(__name__)
ALLOWED = {"website_visit", "video_play", "cv_view", "cv_download", "workspace_explore"}
_last_sent: dict[str, float] = {}
_lock = Lock()


class ActivitySummary(BaseModel):
    event: str
    events: list[str] = Field(min_length=1, max_length=5)
    timeline: list[dict[str, str]] = Field(default_factory=list, max_length=30)


@router.post("/api/reviewer-activity", status_code=202)
def notify_reviewer(summary: ActivitySummary, request: Request):
    origin = request.headers.get("origin", "")
    if origin != "https://shaikarham.github.io":
        raise HTTPException(status_code=403, detail="Origin not allowed.")
    if summary.event != "activity_summary" or any(event not in ALLOWED for event in summary.events):
        raise HTTPException(status_code=422, detail="Invalid activity summary.")
    key = os.getenv("RESEND_API_KEY", "").strip()
    sender = os.getenv("REVIEW_ALERT_FROM", "").strip()
    recipient = os.getenv("REVIEW_ALERT_TO", "").strip()
    if not all((key, sender, recipient)):
        raise HTTPException(status_code=503, detail="Notification delivery not configured.")
    # Coarse global cooldown: avoids flooding the mailbox and stores no visitor identifiers.
    now = time.monotonic()
    with _lock:
        if now - _last_sent.get("global", 0) < 20:
            return {"status": "rate_limited"}
        _last_sent["global"] = now
    safe_events = sorted(set(summary.events))
    safe_timeline = []
    for item in summary.timeline:
        action = item.get("action", "")
        section = item.get("section", "")
        timestamp = item.get("at", "")
        allowed_chars = " _-:./+TZ"
        valid = all(ch.isalnum() or ch in allowed_chars for ch in action + section + timestamp)
        if len(action) <= 48 and len(section) <= 48 and len(timestamp) <= 40 and valid:
            safe_timeline.append(f"- {timestamp} UTC | {section} | {action}")
    received_at = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")
    ireland_time = datetime.now(ZoneInfo("Europe/Dublin")).strftime("%d %b %Y, %H:%M:%S %Z")
    actions = {item.get("action", "") for item in summary.timeline}
    actions.update(safe_events)
    labels = {
        "website_visit": "Website opened",
        "video_play": "Introduction video played",
        "workspace_explore": "Workspace explored",
        "cv_view": "View CV clicked",
        "cv_download": "Download CV clicked",
    }
    summary_lines = [
        "FIREOPS LAB  |  VISITOR ACTIVITY",
        "",
        "ACTIVITY OVERVIEW",
        *(f"{label}: {'Yes' if event in actions else 'No'}" for event, label in labels.items()),
        "",
        f"Time (Ireland): {ireland_time}",
        "Visitor identity: Not available",
        "Location: Not collected",
        "",
        "RECENT ACTIVITY (visitor-reported, UTC)",
        *(safe_timeline or ["No additional activity recorded"]),
        "",
        "Note: A play event does not confirm the entire film was watched.",
        "A CV click does not confirm the document was read.",
        "Activity is anonymous and cannot identify a recruiter.",
    ]
    payload = json.dumps({
        "from": sender,
        "to": [recipient],
        "subject": "FireOps Lab | Visitor activity",
        "text": "\\n".join(summary_lines),
    }).encode()
    outbound = UrlRequest(
        "https://api.resend.com/emails",
        data=payload,
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "fireops-lab/1.0",
        },
        method="POST",
    )
    try:
        with urlopen(outbound, timeout=8) as response:
            if response.status not in (200, 201, 202):
                raise HTTPException(status_code=502, detail="Email provider rejected delivery.")
    except (HTTPError, URLError, TimeoutError) as exc:
        if isinstance(exc, HTTPError):
            provider_error = "unknown"
            response_type = exc.headers.get("Content-Type", "unknown").split(";")[0]
            response_body = exc.read(4096).decode("utf-8", errors="replace")
            failure_hint = "unclassified"
            response_size = len(response_body)
            response_prefix = response_body.strip().lower()[:80]
            if response_prefix in ("forbidden", "access denied", "unauthorized"):
                failure_hint = response_prefix.replace(" ", "_")
            for term in (
                "domain", "recipient", "sender", "permission",
                "api key", "cloudflare", "verify", "testing",
            ):
                if term in response_body.lower():
                    failure_hint = term.replace(" ", "_")
                    break
            try:
                provider_payload = json.loads(response_body)
                if isinstance(provider_payload, dict):
                    candidate = provider_payload.get("name", "unknown")
                    if (
                        isinstance(candidate, str)
                        and candidate.replace("_", "").isalnum()
                        and len(candidate) < 64
                    ):
                        provider_error = candidate
            except (ValueError, UnicodeError, OSError):
                pass
            logger.error(
                "Reviewer email rejected: HTTP %s, category %s, type %s, hint %s, size %s",
                exc.code,
                provider_error,
                response_type,
                failure_hint,
                response_size,
            )
        else:
            logger.error("Reviewer email provider connection failed: %s", type(exc).__name__)
        with _lock:
            _last_sent.pop("global", None)
        raise HTTPException(status_code=502, detail="Email delivery unavailable.") from exc
    return {"status": "accepted"}
