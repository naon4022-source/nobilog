# Operator-only AI access approval candidate

This is not an application route and is not imported by the live Worker. On 2026-10-15 the operator helper recorded the user's confirmed age/guardian assertions for the dedicated preview's u1/u2 accounts. This does not enable AI by itself.

The user reported on 2026-10-14 that both learners are at least 13 and guardian consent has been confirmed. No birth date or identity document was requested or inspected. This report does not itself establish API funding, contracted-account eligibility or complete operational safety.

approvalStatement validates the minimum-age and guardian conditions. registerPreviewApproval accepts only the dedicated preview origin, preview accounts, and both AI providers disabled. It writes the existing service approval schema without reading the old record content. Repeated same statements are idempotent; a different statement or revoked record is preserved and reported as a conflict.

operatorConfirmed is a trusted operator-side calling precondition, not authentication and not a browser checkbox. Before integration, invoke this only from a controlled local operator helper or a separately authenticated operator channel. Never expose it through a learner API. Do not infer unknown age bands or approve other people from a shared preview password.

`ApprovalWriter.register` keeps the off-only guard for the family accounts. Plan-preview identities require the additional trusted `profile_association_confirmed=True` argument, based on a direct human confirmation identifying their users; the shared password alone is not evidence. When provisioning those confirmed profiles with OpenAI configured on, the helper requires all readiness and trial flags, Gemini off, and a valid monthly cap no greater than 800 JPY. It remains an operator-only local tool, with no learner HTTP entry point. It never overwrites a revocation or different assertion.

On 2026-10-16 the user explicitly authorized all four plan-preview identities for the currently age/guardian-confirmed two learners. The helper recorded all four approvals successfully, without retrieving existing record values. Future users require separate age and consent confirmation; the shared preview PIN alone is not evidence. Pending: deployment completion and an authorized live connection test. The 40 writer tests use fake commands and synthetic records only.
