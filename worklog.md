---
Task ID: 3
Agent: Main Agent
Task: Audit and harden git protection — make it IMPOSSIBLE to modify locked funnel code

Work Log:
- Verified all 6 funnel component files match v2.0-quiz-locked tag SHA hashes (all ✅ IDÉNTICO)
- Verified media assets tracked in git (videos, audio) match tags
- Created .githooks/pre-commit hook that BLOCKS any commit modifying protected files
- Tested the hook: attempted commit of AudioCallScreen.tsx → COMMIT RECHAZADO ✅
- Set git config core.hooksPath to .githooks/ (so hooks are version-controlled)
- Restored test-modified file back to locked state
- Final verification: all 6 files still match tag hashes exactly
- Updated v2.0-quiz-locked tag to include the hook

Stage Summary:
- 3-layer protection system now active:
  1. Git tags (v1.0-llamada-locked, v2.0-quiz-locked) — immutable snapshots
  2. .ai-protection file — contract for AI agents
  3. Pre-commit hook — ACTIVELY BLOCKS commits that modify protected files
- To bypass (only with user authorization): git commit --no-verify
- To restore: git checkout v2.0-quiz-locked -- <file>
