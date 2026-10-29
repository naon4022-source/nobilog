# Image-analysis transport candidate

Not imported by the application. No live calls or live flags were changed.

count.mjs uploads only canonical, owned PNGs after local screening, authenticated approval and preflight reservation. The exact counter response is bounded; unknown/out-of-range counts stop generation.
generate.mjs uses the same screened image bytes, reserves the generation budget, moderates text+images, requires a caller-owned atomic paid-operation start, validates model/usage/answer, then moderates output. It never modifies grades.

Required before integration:
- Confirm token-count endpoint pricing and key permissions. TOKEN_COUNT_READY must remain disabled until confirmed.
- Implement the dedicated local child-safety/privacy screen. Do not send known or suspected CSAM to moderation, counting or generation. Moderation itself is not that dedicated screen.
- Wire authenticated session/access records, trial controls, the persisted operation receipt, reservation release rules, and the shared deadline. Callback stubs in tests are not completed application controls.
- Handle provider billing refusals and unknown outcomes with existing main semantics. responseAccepted=false does not prove a paid generation never happened, and is not permission to retry or release funds.
- Verify image deletion/ownership changes, persistence/replay, note/chat UI, reload and real funding before activation.

Sources:
https://developers.openai.com/api/docs/guides/moderation
https://developers.openai.com/api/docs/guides/token-counting

Synthetic tests: count 26 checks, generation 65 checks. No real learner data, image or API key.
