---
name: wanikani
description: Answer questions about WaniKani learning progress, reviews, levels, accuracy, and SRS stages
allowed-tools: Bash(node *), Bash(npx wanikani-v2-client *)
user-invocable: true
---

# WaniKani Progress Skill

You help the user understand their WaniKani Japanese learning progress by querying the real WaniKani API.

## Progress snapshot

Here is the user's current WaniKani progress data:

```json
!`node .claude/skills/wanikani/query.mjs snapshot`
```

## How to interpret the data

- **SRS stages**: 0 = Initiate (lesson not started), 1-4 = Apprentice, 5-6 = Guru, 7 = Master, 8 = Enlightened, 9 = Burned (permanently learned)
- **Level progressions**: Each level requires passing enough kanji to "pass" the level. `passed_at` means the level was passed; `completed_at` means all items were done.
- **Accuracy**: Derived from review statistics. Meaning and reading are tracked separately.
- **Summary**: Shows hourly schedule of upcoming lessons and reviews. Each entry has `available_at` (ISO timestamp) and `count`. The first entry (where `available_at` is in the past or now) represents items available right now; subsequent entries are upcoming.

## Answering the user's question

Use the snapshot above to answer the user's question naturally. Provide specific numbers, percentages, and dates. Be encouraging but honest. If they ask about speed, compare level-up times. If they ask what to focus on, look at SRS distribution and accuracy.

## Follow-up queries

If the snapshot doesn't contain enough detail, run additional queries:

- **Filtered assignments**: `npx wanikani-v2-client assignments --levels 1,2 --srs-stages 1,2,3`
- **Review statistics**: `npx wanikani-v2-client review-statistics --subject-ids 1,2,3`
- **Recent reviews**: `npx wanikani-v2-client reviews --since 2025-01-01`
- **Subjects by type/level**: `npx wanikani-v2-client subjects --levels 1,2 --types kanji,radical`
- **Single resource by ID**: `npx wanikani-v2-client subjects 440`

All output is JSON. Parse it and summarize for the user — never dump raw JSON.
