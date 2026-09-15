# Tutor controller deployment

The app remains on Vercel. This image packages the existing continuous voice controller for one supervised Node/container host. Creating a paid host is a separate account/billing decision; this file does not provision one.

```sh
docker build -f deploy/tutor-controller.Dockerfile -t studycraft-tutor-controller .
```

The Dockerfile-specific build context includes only package metadata, schemas, server libraries and the controller entrypoint. Environment files, credentials, scans and Git history are excluded. AJV and its formats plugin are runtime dependencies because the standalone controller imports the pack validator. The image runs as the unprivileged `node` user; inject secrets at runtime, never through build arguments.

## Host contract

- One instance, continuously running; no scale-to-zero or multiple replicas.
- HTTPS reverse proxy to container port 4310. Set `TUTOR_CONTROLLER_URL` in the app to the HTTPS origin. All controller endpoints require the shared bearer secret.
- Set an automatic restart policy and allow graceful SIGTERM shutdown. Use stop-before-start replacement, not overlapping rolling replicas: reconciliation is designed for one controller owner per database.
- Runtime environment: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `OPENAI_API_KEY`, `TUTOR_CONTROLLER_SECRET`, `TUTOR_ENABLED`, `TUTOR_LIVE_ENABLED`; optional model/voice/allowances match the app. Keep live disabled until deployment checks pass.
- The Docker health check tests HTTP liveness without secrets. It does not establish model entitlement, database readiness or provider termination. Use authenticated `/health` and the real pilot for those checks.
- For a local smoke test, publish only `127.0.0.1:4310:4310`. Do not expose a plaintext controller port publicly.

Vercel's container support still uses request-driven Functions that scale to zero; it does not establish the required continuous process lifetime ([official comparison](https://vercel.com/kb/guide/docker-on-vercel-vs-render), checked 2026-09-15). A Dockerfile alone therefore does not make this controller suitable for that hosting model.

See [voice configuration and failure recovery](../docs/tutor/VOICE.md) and [pilot evidence](../docs/tutor/PILOT.md). Host failure and unknown provider creation outcomes remain explicit limits; a built image is not real voice acceptance.

## Local verification

Built successfully on 2026-09-15. A disposable container ran with no network, a read-only filesystem, a temporary `/tmp`, 256 MiB memory and one CPU. Verified non-root execution, absence of `.env.local` and `.git`, 401 for missing/incorrect tokens, 503 for authenticated unconfigured readiness, and SIGTERM exit code 0. This used a disposable test token and no provider/database credentials; real model, database and voice checks remain pending.
