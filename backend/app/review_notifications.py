"""Privacy-minimising reviewer activity summaries for the public portfolio."""
import json
import logging
import os
import time
from threading import Lock
from urllib.error import HTTPError, URLError
from urllib.request import Request as UrlRequest
from urllib.request import urlopen

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
    payload = json.dumps({
        "from": sender,
        "to": [recipient],
        "subject": "FireOPS Lab: portfolio activity",
        "text": "Anonymous FireOPS Lab activity summary\\n\\n"
                + "\\n".join("- " + event.replace("_", " ") for event in safe_events)
                + "\\n\\nNo visitor identity is collected. "
                + "Events are client-reported and not proof of recruiter identity.",
    }).encode()
    outbound = UrlRequest(
        "https://api.resend.com/emails",
        data=payload,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
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
                "Reviewer email provider rejected request: HTTP %s, category %s, type %s, hint %s",
                exc.code,
                provider_error,
                response_type,
                failure_hint,
            )
        else:
            logger.error("Reviewer email provider connection failed: %s", type(exc).__name__)
        with _lock:
            _last_sent.pop("global", None)
        raise HTTPException(status_code=502, detail="Email delivery unavailable.") from exc
    return {"status": "accepted"}
