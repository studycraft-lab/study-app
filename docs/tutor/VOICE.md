# Live voice: implementation and operating boundary

Live voice is experimental and defaults off. #49 remains awaiting real provider, deployment and device acceptance. Scripted rehearsal uses the same pack/player without an OpenAI call. Existing OpenRouter exercise grading is independent.

## Transport and authority

The authenticated child route resolves private, eligible published/pinned progress. The server chooses the pack, model, prompt and allowances. The browser exchanges WebRTC media directly with OpenAI through a server-authenticated SDP setup; no permanent key or ephemeral provider credential is returned. Microphone disclosure appears before starting. Editable typed input and text choices remain available. Model-assessed checkpoints are labelled formative.

A separate, continuously running Node controller creates the provider call and attaches a trusted sideband WebSocket before returning SDP. Completed tool calls pass the same bounded state machine as rehearsal. Duplicate, cancelled and stale events are rejected. The controller returns tool output, then waits for the authenticated browser to acknowledge rendering the saved revision before requesting speech continuation. Scene-level coordination is intended; speech/visual timing still needs device observation.

The controller owns independent deadline timers and a five-second durable reconciliation loop. End, permission withdrawal, an invalidated child, sideband loss and restart recovery request the supported provider hangup. The browser also releases tracks, audio and peer connections immediately; it never silently reconnects. App request lifetime and browser timers are not the enforcement mechanism.

## Setup: Codespaces and preview

1. Use a **separate preview Supabase project**. Apply all append-only migrations, including `20260915040000_create_tutor_voice_usage.sql`, in filename order. Never point a mutation-enabled preview at production data.
2. Inject server-only Supabase, parent/session and OpenAI credentials. Set the same model, voice, flags and allowances in the app and controller. Never use `NEXT_PUBLIC_` for these values. OpenAI API usage is billed separately from a ChatGPT subscription; no exact cost is inferred from missing usage.
3. Run exactly **one supervised controller instance** against this preview database. `npm run tutor:controller` reads injected process environment; it does not automatically load Next's `.env.local`. For local Node versions supporting env files: `node --env-file=.env.local --conditions=react-server --import tsx scripts/tutor-controller.ts`.
4. Defaults bind to `127.0.0.1:4310`; the local app can use that URL. A Vercel preview needs a reachable controller on a continuously running host, with HTTPS, the shared bearer secret and private/restricted ingress. This process must not be a Vercel request handler. Do not scale it to multiple replicas: there is no distributed controller ownership lease.
5. Set `TUTOR_ENABLED=true` for preview rehearsal. Prepare/import/preview/publish a synthetic or genuinely reviewed pack and start private child progress. For an explicitly supervised voice pilot, configure `TUTOR_LIVE_ENABLED=true`, enable the family permission in the parent library, and set `TUTOR_CONTROLLER_VERIFIED=true` only after verifying the deployment's restart, deadline and provider hangup path. Keep routine child use off until parent acceptance.
6. Use the authenticated HTTPS Codespaces forwarded **app** URL or Vercel preview URL on the intended tablet/browser. HTTPS is needed for microphone access outside localhost. A suspended Codespace is unsuitable as an unattended usage controller. Never expose an unauthenticated controller port.

`GET /health` on the controller requires its bearer secret, checks model access via OpenAI's model endpoint and database access (cached up to five minutes), and advertises the controller protocol. This is readiness, not proof of a successful voice call or a hard cap.

## Configuration and accounting

| Setting | Default / behavior |
| --- | --- |
| `TUTOR_ENABLED` | `false`; gates tutoring entry/routes |
| `TUTOR_LIVE_ENABLED` | `false`; global voice kill switch; restart/reload both processes when changing environment |
| `OPENAI_REALTIME_MODEL` | `gpt-realtime-2.1`; server-only, account access must be checked |
| `OPENAI_REALTIME_VOICE` | `marin`; verify on the chosen model |
| `TUTOR_SESSION_SECONDS` | 600; accepted 60–1200 |
| `TUTOR_DAILY_SECONDS` | 1200; accepted 60–3600 |
| `TUTOR_CONTROLLER_URL` | required trusted HTTPS endpoint; HTTP allowed only for localhost |
| `TUTOR_CONTROLLER_SECRET` | required independent high-entropy shared server secret |
| `TUTOR_CONTROLLER_VERIFIED` | `false`; blocks setup until deployment controls are verified |
| Starts | maximum three per child per minute |

SQL locks the child row, reserves the entire session allowance at start, and permits one reserved/active/termination-pending session per child. Reservations count against the UTC day of creation, including early ends and failures; they are not refunded from a browser report. Repeated client tokens are idempotent. A near-midnight reservation belongs to its start day. Duration can be derived from creation/end timestamps; the reservation begins before first audio, so these are not exact speech seconds.

Stored metadata is child/progress (which pins pack), model, client token, status, reservation/deadline, timestamps, error class, provider call ID and measured token totals when received. No audio or full transcript is stored by StudyCraft. Live captions are bounded in-memory UI state. Provider retention is governed by the configured OpenAI account; StudyCraft does not claim the provider retains nothing. Token totals may be partial after interruption/restart and are not a price estimate.

## Failure recovery and unresolved deployment limits

A failed hangup stays `termination_pending` and occupies the child's slot. Reconciliation retries known provider IDs, including after a controller restart. A create timeout can have an unknown provider outcome; without a returned call ID, automatic hangup cannot be confirmed. Such a reservation remains blocked for operator reconciliation. Check the provider account/support evidence before marking it resolved through an audited service-role operation; never clear it solely to bypass the limit. Do not record credentials or raw event/SDP/transcript payloads in logs.

Independent timers cannot execute while the host is down, and the provider can be unreachable. A supervisor/restart policy, external monitoring and observed provider termination are required. **This implementation does not claim a proven hard billing cap.** Known calls are terminated on recovery; unknown calls need operator investigation. Keep live mode disabled if the chosen hosting cannot resolve this limitation. No controller host, model access or real session was verified in this implementation environment.

## Verification evidence

Mocked transport tests cover mic denial, permission races, autoplay rejection, provider errors and cleanup. Mocked provider/sideband tests cover authenticated setup, tool completion/acknowledgement, duplicates, cancellation, stale revisions, independent deadlines and recovery. PGlite executes actual reservation SQL, ownership/permission checks, idempotency, one occupied slot, start throttling, UTC allowance reservations and board acknowledgements. PGlite uses one connection: this does not establish real multi-connection Supabase race behavior. No real microphone, OpenAI call, provider termination or tablet test has run.

Before acceptance, exercise simultaneous authenticated starts against preview Supabase, browser abandonment, controller restart, provider failure and actual session expiry. Record observed first audio, interruptions, board timing and measured usage separately from these automated tests. See the checkpoint for remaining inputs.

## Official protocol references

Checked 2026-09-15: [WebRTC and unified SDP setup](https://developers.openai.com/api/docs/guides/voice-webrtc), [Realtime conversations and function-call output](https://developers.openai.com/api/docs/guides/realtime-conversations), [create call](https://developers.openai.com/api/reference/typescript/resources/realtime/subresources/calls/methods/create), and [server hangup](https://developers.openai.com/api/reference/python/resources/realtime/subresources/calls/methods/hangup). The documented model example is configurable; documentation does not establish this account's model entitlement. Recheck these contracts when performing the real pilot.

## Activation after merge

No custom Vercel build command is required. Existing Supabase and parent authentication settings stay in place. The code is merged; database migrations and live infrastructure are separate operations.

1. Apply these new Supabase migrations once, in order, to the database for the selected environment: `20260915010000_create_tutor_content.sql`, `20260915020000_create_tutor_progress.sql`, `20260915030000_create_tutor_requests.sql`, `20260915040000_create_tutor_voice_usage.sql`.
2. In Vercel **Project → Settings → Environment Variables**, set `TUTOR_ENABLED=true`, `TUTOR_LIVE_ENABLED=false`, and `TUTOR_CONTROLLER_VERIFIED=false` for that environment. Redeploy: [environment changes apply only to new deployments](https://vercel.com/docs/environment-variables).
3. Sign in as parent, open `/parent/library/tutor`, import `lesson-packs/icse-6-biology/plastids/v1.json` into the matching The Cell chapter, rehearse and publish. A matching ICSE Grade 6 child can then use the lesson without microphone/provider calls.
4. For live voice, provision one continuously running Node controller using the setup above. Configure `OPENAI_API_KEY`, `TUTOR_CONTROLLER_URL` (its HTTPS URL) and `TUTOR_CONTROLLER_SECRET` in Vercel; configure the same key/secret, target Supabase database and voice settings on the controller. Do not use a localhost controller URL in Vercel. Existing OpenRouter credentials do not replace an OpenAI API key.
5. Verify model access, controller restart recovery and actual provider termination in the supervised pilot. Then set `TUTOR_CONTROLLER_VERIFIED=true` and `TUTOR_LIVE_ENABLED=true`, redeploy/restart the relevant processes, and enable the family's live-voice permission in the parent library. Default allowances are ten minutes per session and twenty reserved minutes per child per UTC day.

The continuously running controller is part of this implementation's architecture. A Vercel environment setting does not create or supervise it; ordinary [Vercel Functions have finite execution lifetimes](https://vercel.com/docs/functions/limitations). Real voice remains untested until that service and credentials are available.
