import asyncio
from email.utils import parsedate_to_datetime
from datetime import datetime, timezone
from typing import Callable, Awaitable, Optional
import httpx

RETRYABLE_STATUS_CODES = {408, 425, 429, 500, 502, 503, 504}


def _retry_after_seconds(response: httpx.Response) -> Optional[float]:
    raw = response.headers.get("Retry-After")
    if not raw:
        return None
    try:
        return max(0.0, float(raw))
    except ValueError:
        try:
            dt = parsedate_to_datetime(raw)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return max(0.0, (dt - datetime.now(timezone.utc)).total_seconds())
        except Exception:
            return None


async def post_with_retry(
    client: httpx.AsyncClient,
    url: str,
    *,
    max_attempts: int = 4,
    base_delay: float = 1.0,
    max_delay: float = 8.0,
    sleep_fn: Callable[[float], Awaitable[None]] = asyncio.sleep,
    **kwargs
) -> httpx.Response:
    """POST with bounded exponential backoff for rate limits and transient network/server failures."""
    attempts = max(1, int(max_attempts))
    last_exc = None

    for attempt in range(attempts):
        try:
            response = await client.post(url, **kwargs)
            if response.status_code not in RETRYABLE_STATUS_CODES or attempt == attempts - 1:
                return response
            retry_after = _retry_after_seconds(response)
            delay = retry_after if retry_after is not None else min(max_delay, base_delay * (2 ** attempt))
            await sleep_fn(delay)
        except (httpx.TimeoutException, httpx.NetworkError, httpx.RemoteProtocolError) as exc:
            last_exc = exc
            if attempt == attempts - 1:
                raise
            await sleep_fn(min(max_delay, base_delay * (2 ** attempt)))

    if last_exc:
        raise last_exc
    raise RuntimeError("No se pudo completar la solicitud HTTP tras los reintentos.")
