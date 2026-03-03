# wanikani-v2-client

A typed, zero-dependency, ergonomic TypeScript client for the [WaniKani API v2](https://docs.api.wanikani.com/20170710/).

Works in the browser, Node.js 20+, and Bun.

## Installation

```bash
npm install wanikani-v2-client
```

## Quick Start

```ts
import { createWaniKaniClient } from "wanikani-v2-client";

const client = createWaniKaniClient({
  apiToken: "your-api-token",
});

// Get current user
const user = await client.getUser();
console.log(user.data.username, "level", user.data.level);

// Iterate all subjects (auto-paginates)
for await (const subject of client.listSubjects({ levels: [1, 2] })) {
  console.log(subject.data.characters);
}

// Create a review
await client.createReview({
  subject_id: 123,
  incorrect_meaning_answers: 0,
  incorrect_reading_answers: 1,
});
```

## Configuration

```ts
const client = createWaniKaniClient({
  apiToken: "your-token", // Required
  baseUrl: "https://...", // Default: https://api.wanikani.com/v2
  revision: "20170710", // Default: 20170710
  maxRetries: 3, // Default: 3 (retries on 429/500/503)
  fetch: customFetch, // Optional custom fetch implementation
});
```

## Endpoints

| Resource                  | Methods                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------- |
| Assignments               | `getAssignment`, `listAssignments`, `startAssignment`                                  |
| Level Progressions        | `getLevelProgression`, `listLevelProgressions`                                         |
| Resets                    | `getReset`, `listResets`                                                               |
| Reviews                   | `getReview`, `listReviews`, `createReview`                                             |
| Review Statistics         | `getReviewStatistic`, `listReviewStatistics`                                           |
| Spaced Repetition Systems | `getSpacedRepetitionSystem`, `listSpacedRepetitionSystems`                             |
| Study Materials           | `getStudyMaterial`, `listStudyMaterials`, `createStudyMaterial`, `updateStudyMaterial` |
| Subjects                  | `getSubject`, `listSubjects`                                                           |
| Summary                   | `getSummary`                                                                           |
| User                      | `getUser`, `updateUser`                                                                |
| Voice Actors              | `getVoiceActor`, `listVoiceActors`                                                     |

All `list*` methods return an `AsyncIterable` that automatically paginates through all results.

## Error Handling

```ts
import { WaniKaniApiError, WaniKaniRateLimitError } from "wanikani-v2-client";

try {
  await client.getAssignment(999999);
} catch (error) {
  if (error instanceof WaniKaniRateLimitError) {
    console.log("Rate limited, resets at:", error.resetAt);
  } else if (error instanceof WaniKaniApiError) {
    console.log("API error:", error.status, error.apiMessage);
  }
}
```

Transient errors (429, 500, 503) are automatically retried with exponential backoff.

## Documentation

See [docs/usage.md](docs/usage.md) for the full usage guide.

## Contributing

```bash
npm install
npm run build
```

### Scripts

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `npm run build`      | Build the library                  |
| `npm run test`       | Run unit tests                     |
| `npm run test:e2e`   | Run E2E tests against the real API |
| `npm run type-check` | Type-check without emitting        |
| `npm run lint`       | Lint with oxlint                   |
| `npm run fmt`        | Format with oxfmt                  |
| `npm run fmt:check`  | Check formatting                   |

### E2E Tests

E2E tests validate response shapes against the real WaniKani API. They are skipped automatically when no API key is set.

```bash
WANIKANI_API_KEY=your-token npm run test:e2e
```

### Releasing

To publish a new version to npm:

```bash
npm version patch   # or minor, or major
git push --follow-tags
```

The `v*` tag push triggers a GitHub Actions workflow that runs the full check suite (lint, format, types, tests, build) and publishes to npm with [provenance](https://docs.npmjs.com/generating-provenance-statements). A GitHub Release with auto-generated notes is created alongside it.

Requires an `NPM_TOKEN` secret in the repo settings (Settings > Secrets and variables > Actions).

### Project Structure

```
src/
  client.ts          # createWaniKaniClient entry point
  index.ts           # Public exports
  types/             # TypeScript type definitions for API resources
  endpoints/         # Endpoint method factories
  utils/             # Shared utilities (errors, params, retry)
tests/
  client.test.ts     # Unit tests for client behavior
  utils/             # Unit tests for utilities
  e2e/               # E2E tests against the real API
docs/
  usage.md           # Full usage guide
```

## License

MIT
