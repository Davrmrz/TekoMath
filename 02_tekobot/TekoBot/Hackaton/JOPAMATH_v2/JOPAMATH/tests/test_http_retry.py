import httpx
import pytest
from app.providers.http_utils import post_with_retry

@pytest.mark.asyncio
async def test_http_retry_recovers_from_429_without_losing_request():
    calls = {"n": 0}
    async def handler(request: httpx.Request):
        calls["n"] += 1
        if calls["n"] == 1:
            return httpx.Response(429, headers={"Retry-After": "0"}, text="rate limited")
        return httpx.Response(200, json={"ok": True})

    transport = httpx.MockTransport(handler)
    sleeps=[]
    async def no_sleep(seconds: float):
        sleeps.append(seconds)

    async with httpx.AsyncClient(transport=transport) as client:
        response = await post_with_retry(client, "https://example.test/api", json={"x":1}, max_attempts=3, sleep_fn=no_sleep)
    assert response.status_code == 200
    assert calls["n"] == 2
    assert sleeps == [0.0]

@pytest.mark.asyncio
async def test_http_retry_stops_after_bound():
    calls={"n":0}
    async def handler(request: httpx.Request):
        calls["n"] += 1
        return httpx.Response(503, text="unavailable")
    async def no_sleep(seconds: float):
        return None
    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        response=await post_with_retry(client, "https://example.test/api", max_attempts=3, sleep_fn=no_sleep)
    assert response.status_code == 503
    assert calls["n"] == 3
