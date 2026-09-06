# Privacy engineering baseline

This document records the repository's current technical data flows. It is an engineering description, not legal approval.

## Local learner state

The web experience stores learner progress and preferences in browser storage. Examples include the learner-selected display name, mission progress, scores, mastery/progress state and parent-configured daily workload. This state is client-side and is not a production database implementation.

The Android wrapper has cloud/device backup disabled in the manifest so learner state is not intentionally exported through Android backup.

## AI tutor

The AI tutor is optional and fails closed when provider configuration is absent or the provider fails.

When enabled, the server sends only:
- the learner's current question, capped at 1,500 characters;
- the requested school year, constrained to Years 1–6;
- up to five bounded priority-skill labels and mastery percentages.

The learner's display name is not sent to the AI provider. The tutor prompt instructs the model not to ask for or infer full name, contact details, school or other identifying information.

Provider responses are not cached by the tutor API. The repository does not implement server-side conversation persistence.

## Analytics and advertising

No analytics, advertising or behavioural-tracking integration is asserted by this document. If any such integration is added, this baseline must be updated before release and the child-data/privacy review reopened.

## Release gate

Production release still requires an authorised privacy/safety determination covering controller/processor roles, provider terms, retention, transparency/parental information, age-appropriate design and any applicable consent requirements. Engineering controls are evidence for that review, not a substitute for it.
