# Reviewed science rubric failures reproduced on 2026-10-14

No real learner answer/history was read or changed. The probe uses current reviewed public question JSON and ten synthetic answers.

Affected questions:
- tokkun-science-1-hansha-69: valid negative explanation rejected; opposite positive explanation incorrectly accepted.
- tokkun-science-1-kitai-24: correct comparison using 少ししか溶けない rejected.
- tokkun-science-1-kubetsu-22: correct safety explanation using わからない rejected.
- tokkun-science-1-youkaido-19: correct explanation ending 水を加える rejected when its reason contains 変わらない.
- tokkun-science-1-youkaido-66: correct cooling/solubility explanation using 溶けきれなくなる rejected.

reproduction.json records 10 probes, 6 mismatches. These are defects, not passing verification. The current global negation guard explains five false negatives; the broad two-keyword rubric also permits an opposite explanation.

Next correction must preserve prompts, sources, numerical answers and explanations, and only adjust affected grading conditions after inspecting their original material. Do not merely set allowNegation=true: add explicit required causal content and reject opposite explanations. Verify natural alternate answers and contradictory clauses. Do not claim arbitrary Japanese semantics are solved by keyword matching. Keep unsupported cases explicit.

Main reviewed files, material-bank and grading engine remain unchanged while the full suite is running. Integrate only after its terminal result, then rebuild and re-run meaningful grade/source/bank and UI checks. Do not retroactively regrade actual saved history or publish.
