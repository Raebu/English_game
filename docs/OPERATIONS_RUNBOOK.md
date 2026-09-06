# Operations runbook

## Before release

- Record the candidate commit SHA and current known-good production commit.
- Run the production acceptance checklist in `docs/PRODUCTION_ACCEPTANCE.md`.
- Confirm environment variables are configured only in the deployment platform and are absent from repository/client bundles.
- Confirm the AI tutor is either verified operational or visibly unavailable; never silently present a canned fallback as successful AI output.

## Smoke test

After deployment, verify the home/academy experience loads, a complete 10-question level can be finished, review/score/reward state behaves correctly after reload, and `/api/tutor` returns the expected success or explicit unavailable state. Check browser console/network errors on the core journey.

## Incident response

For a child-safety, privacy, credential, data-integrity or widespread availability incident, stop the affected external capability or roll back the deployment. Preserve logs/evidence without copying secrets or child content into tickets. Record the affected commit, start/end time, impact and corrective action.

## Rollback

Redeploy the last independently verified production commit using the hosting platform's normal rollback/redeploy mechanism. Repeat the smoke test against the restored deployment. Do not call rollback successful until the core learning journey is observed working.

## AI provider failure

Provider/configuration failures must remain explicit non-success responses. Investigate platform configuration/provider status; do not replace failure with a success-coded mock or canned response.
