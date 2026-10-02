# Generacion Remota De Ejercicios

`generate-exercise.ts` is a Vercel serverless function. It keeps the Gemini credential on the server, requests structured JSON, then applies the shared schema, safety, and mathematical validator before returning an exercise.

## Configuration

Set these in the Vercel project environment settings:

- `GEMINI_API_KEY`: server-only secret. Never prefix it with `VITE_`.
- `GEMINI_MODEL`: optional model override; defaults to `gemini-2.5-flash`.
- `VITE_ENABLE_GEMINI_EXERCISES`: set to `true` to show the opt-in generation button in game setup.

For local development with the serverless endpoint, use `vercel dev` and provide `GEMINI_API_KEY` through a local, untracked environment configuration. A plain Vite server has no API function and will use the local exercise fallback.

The function accepts same-origin JSON POST requests, limits request and context sizes, applies a per-instance rate limit, and times out the upstream request after 4.5 seconds. Logs contain only provider status, failure category, and elapsed time. The in-memory rate limit is best-effort across serverless instances; use a shared rate-limit store if public traffic grows.
