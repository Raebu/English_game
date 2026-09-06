# Production acceptance

Genius Academy is not production-ready merely because the web build deploys. Release acceptance requires evidence for the child-facing learning loop and every enabled external capability.

## Required evidence

1. Build the exact candidate commit with `npm run build` and record the result.
2. Exercise the deployed learning loop: learner name, 10-question level, answer reveal/review, non-repeated questions, score, persistence and reward/build progress.
3. Verify malformed and oversized `/api/tutor` requests are rejected, responses are not cached, and provider/configuration failures return a non-success HTTP status rather than masquerading as a working AI integration.
4. If AI tutoring is enabled, verify the configured model and credential in the target environment and complete child-safety/privacy review for data sent to the provider. If it is not enabled, the UI must represent the tutor as unavailable rather than AI-backed.
5. Exercise Android packaging on a clean environment and physical supported device before Android release.
6. Verify accessibility with keyboard-only navigation, screen reader semantics, zoom/reflow and reduced-motion behaviour across the core journey.
7. Search the candidate tree for TODO/FIXME/stub/mock/demo/placeholder/fallback paths and classify every production-reachable result.
8. Record exact commit, deployment URL, test commands/results and rollback target.

## Release blockers

Any failed or unexecuted required check, unknown production credential/configuration, unreviewed child-data flow, broken core learning journey, or unverified rollback keeps the release blocked. Queued/cancelled CI is not a pass.
