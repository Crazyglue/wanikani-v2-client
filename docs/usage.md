# Usage Guide

## Creating a Client

```ts
import { createWaniKaniClient } from "wanikani-v2-client";

const client = createWaniKaniClient({
  apiToken: process.env.WANIKANI_API_TOKEN!,
});
```

You can find your API token at [WaniKani Settings > API Tokens](https://www.wanikani.com/settings/personal_access_tokens).

## Fetching Single Resources

Every resource has a `get*` method that returns a `WKResource<T>` wrapper:

```ts
const assignment = await client.getAssignment(12345);
console.log(assignment.id);              // 12345
console.log(assignment.object);          // "assignment"
console.log(assignment.data.srs_stage);  // 5
console.log(assignment.data.subject_id); // 440
```

## Listing Resources (Pagination)

All `list*` methods return an `AsyncIterable` that automatically handles cursor-based pagination. Each iteration yields a single `WKResource<T>`:

```ts
for await (const assignment of client.listAssignments({ srs_stages: [1, 2] })) {
  console.log(assignment.data.subject_id, assignment.data.srs_stage);
}
```

You can also collect all items into an array:

```ts
const allSubjects = [];
for await (const subject of client.listSubjects({ types: ["kanji"], levels: [1] })) {
  allSubjects.push(subject);
}
```

### Filtering

Each `list*` method accepts a typed params object with the available filters for that endpoint:

```ts
// Assignments with multiple filters
client.listAssignments({
  levels: [1, 2, 3],
  srs_stages: [5, 6, 7, 8],
  subject_types: ["kanji", "vocabulary"],
  burned: false,
  updated_after: "2024-01-01T00:00:00.000Z",
});

// Subjects by type
client.listSubjects({
  types: ["radical"],
  levels: [1, 2],
});

// Review statistics above a threshold
client.listReviewStatistics({
  percentages_greater_than: 50,
  subject_types: ["kanji"],
});
```

## Mutations

### Creating Reviews

```ts
const result = await client.createReview({
  subject_id: 440,
  incorrect_meaning_answers: 0,
  incorrect_reading_answers: 1,
});
```

### Study Materials

```ts
// Create
await client.createStudyMaterial({
  subject_id: 440,
  meaning_note: "This looks like a ground with a stick in it",
  meaning_synonyms: ["ground", "earth"],
});

// Update
await client.updateStudyMaterial(12345, {
  meaning_note: "Updated note",
});
```

### Starting Assignments

```ts
await client.startAssignment(12345);

// With custom start time
await client.startAssignment(12345, {
  started_at: "2024-01-15T10:00:00.000Z",
});
```

### Updating User Preferences

```ts
await client.updateUser({
  preferences: {
    lessons_batch_size: 5,
    reviews_autoplay_audio: true,
  },
});
```

## Summary

The summary endpoint returns current lesson and review availability:

```ts
const summary = await client.getSummary();
console.log("Next reviews at:", summary.data.next_reviews_at);

for (const lesson of summary.data.lessons) {
  console.log(`${lesson.subject_ids.length} lessons available at ${lesson.available_at}`);
}
```

## Error Handling

The library throws typed errors for different failure scenarios:

```ts
import {
  WaniKaniError,
  WaniKaniApiError,
  WaniKaniRateLimitError,
} from "wanikani-v2-client";

try {
  await client.getSubject(999999);
} catch (error) {
  if (error instanceof WaniKaniRateLimitError) {
    // 429 - Rate limit exceeded
    console.log("Try again at:", error.resetAt);
  } else if (error instanceof WaniKaniApiError) {
    // Any other HTTP error (401, 404, 422, etc.)
    console.log(error.status, error.apiMessage);
  } else if (error instanceof WaniKaniError) {
    // Base client error
    console.log(error.message);
  }
}
```

### Automatic Retries

Transient errors (HTTP 429, 500, 503) are automatically retried with exponential backoff. Configure with `maxRetries`:

```ts
const client = createWaniKaniClient({
  apiToken: "...",
  maxRetries: 5, // default: 3
});
```

Set `maxRetries: 0` to disable retries.

## Custom Fetch

You can provide a custom `fetch` implementation for testing or custom transports:

```ts
const client = createWaniKaniClient({
  apiToken: "...",
  fetch: myCustomFetch,
});
```

## TypeScript Types

All response data types are exported for use in your code:

```ts
import type {
  WKResource,
  AssignmentData,
  SubjectData,
  KanjiData,
  UserData,
} from "wanikani-v2-client";

function processAssignment(assignment: WKResource<AssignmentData>) {
  console.log(assignment.data.srs_stage);
}
```
