# Reject new AI requests before capturing context when limits are exhausted

Not yet imported by the application. All dependencies remain the authoritative main modules.

For a new operation ID, check plan quota and global daily/stop counters before building/persisting conversation context. Existing operation IDs still take the original digest/value validation path; completed results replay without another API call even when quota is exhausted. The atomic trial gate remains mandatory and is rechecked at execution, so this early check is not the concurrency guard.

Tests: pre-context gate 16, original paid chat/history/replay plus exhausted-quota replay 31. Synthetic SQLite and fake API only. Preserve source changes before merging. No activation or publication.
