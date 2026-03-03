import { parseArgs } from "node:util";
import { createWaniKaniClient, WaniKaniApiError, WaniKaniRateLimitError } from "./index.js";
import type { WaniKaniClient } from "./index.js";

const USAGE = `Usage: wanikani <command> [id] [options]

Commands:
  user                       Get current user info
  summary                    Get review summary
  assignments                List assignments
  subjects                   List subjects
  reviews                    List reviews
  review-statistics          List review statistics
  level-progressions         List level progressions
  resets                     List resets
  study-materials            List study materials
  spaced-repetition-systems  List spaced repetition systems
  voice-actors               List voice actors

Options:
  --srs-stages <1,2,3>      Filter by SRS stages (assignments)
  --levels <1,2>             Filter by levels (assignments, subjects)
  --types <kanji,radical>    Filter by subject types (subjects)
  --since <date>             Filter by updated_after date (reviews)
  --subject-ids <1,2,3>     Filter by subject IDs (review-statistics, study-materials)
  --help                     Show this help message

Environment:
  WANIKANI_API_TOKEN         API token (required)

Examples:
  wanikani user
  wanikani subjects --levels 1,2 --types kanji
  wanikani subjects 440
  wanikani assignments --srs-stages 1,2,3
  wanikani reviews --since 2025-01-01`;

function parseNumberList(value: string): number[] {
  return value.split(",").map(Number);
}

function parseStringList(value: string): string[] {
  return value.split(",");
}

type CommandConfig =
  | {
      kind: "singular";
      run: (client: WaniKaniClient) => Promise<unknown>;
    }
  | {
      kind: "resource";
      get: (client: WaniKaniClient, id: number) => Promise<unknown>;
      list: (client: WaniKaniClient, params: Record<string, unknown>) => AsyncIterable<unknown>;
      parseFlags: (flags: Record<string, string | undefined>) => Record<string, unknown>;
    };

const COMMANDS: Record<string, CommandConfig> = {
  user: {
    kind: "singular",
    run: (client) => client.getUser(),
  },
  summary: {
    kind: "singular",
    run: (client) => client.getSummary(),
  },
  assignments: {
    kind: "resource",
    get: (client, id) => client.getAssignment(id),
    list: (client, params) => client.listAssignments(params),
    parseFlags: (flags) => {
      const params: Record<string, unknown> = {};
      if (flags["srs-stages"]) params.srs_stages = parseNumberList(flags["srs-stages"]);
      if (flags["levels"]) params.levels = parseNumberList(flags["levels"]);
      return params;
    },
  },
  subjects: {
    kind: "resource",
    get: (client, id) => client.getSubject(id),
    list: (client, params) => client.listSubjects(params),
    parseFlags: (flags) => {
      const params: Record<string, unknown> = {};
      if (flags["levels"]) params.levels = parseNumberList(flags["levels"]);
      if (flags["types"]) params.types = parseStringList(flags["types"]);
      return params;
    },
  },
  reviews: {
    kind: "resource",
    get: (client, id) => client.getReview(id),
    list: (client, params) => client.listReviews(params),
    parseFlags: (flags) => {
      const params: Record<string, unknown> = {};
      if (flags["since"]) params.updated_after = flags["since"];
      return params;
    },
  },
  "review-statistics": {
    kind: "resource",
    get: (client, id) => client.getReviewStatistic(id),
    list: (client, params) => client.listReviewStatistics(params),
    parseFlags: (flags) => {
      const params: Record<string, unknown> = {};
      if (flags["subject-ids"]) params.subject_ids = parseNumberList(flags["subject-ids"]);
      return params;
    },
  },
  "level-progressions": {
    kind: "resource",
    get: (client, id) => client.getLevelProgression(id),
    list: (client, params) => client.listLevelProgressions(params),
    parseFlags: (_flags) => {
      const params: Record<string, unknown> = {};
      return params;
    },
  },
  resets: {
    kind: "resource",
    get: (client, id) => client.getReset(id),
    list: (client, params) => client.listResets(params),
    parseFlags: (_flags) => {
      const params: Record<string, unknown> = {};
      return params;
    },
  },
  "study-materials": {
    kind: "resource",
    get: (client, id) => client.getStudyMaterial(id),
    list: (client, params) => client.listStudyMaterials(params),
    parseFlags: (flags) => {
      const params: Record<string, unknown> = {};
      if (flags["subject-ids"]) params.subject_ids = parseNumberList(flags["subject-ids"]);
      return params;
    },
  },
  "spaced-repetition-systems": {
    kind: "resource",
    get: (client, id) => client.getSpacedRepetitionSystem(id),
    list: (client, params) => client.listSpacedRepetitionSystems(params),
    parseFlags: (_flags) => {
      const params: Record<string, unknown> = {};
      return params;
    },
  },
  "voice-actors": {
    kind: "resource",
    get: (client, id) => client.getVoiceActor(id),
    list: (client, params) => client.listVoiceActors(params),
    parseFlags: (_flags) => {
      const params: Record<string, unknown> = {};
      return params;
    },
  },
};

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      help: { type: "boolean", short: "h" },
      "srs-stages": { type: "string" },
      levels: { type: "string" },
      types: { type: "string" },
      since: { type: "string" },
      "subject-ids": { type: "string" },
    },
    allowPositionals: true,
  });

  if (values.help || positionals.length === 0) {
    console.log(USAGE);
    process.exit(0);
  }

  const command = positionals[0];
  const idArg = positionals[1];

  const config = COMMANDS[command];
  if (!config) {
    console.error(`Unknown command: ${command}\n\nRun "wanikani --help" for usage.`);
    process.exit(1);
  }

  const apiToken = process.env.WANIKANI_API_TOKEN;
  if (!apiToken) {
    console.error(JSON.stringify({ error: "WANIKANI_API_TOKEN environment variable is required" }));
    process.exit(1);
  }

  const client = createWaniKaniClient({ apiToken });

  if (config.kind === "singular") {
    const result = await config.run(client);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (idArg) {
    const id = Number(idArg);
    if (Number.isNaN(id)) {
      console.error(`Invalid ID: ${idArg}`);
      process.exit(1);
    }
    const result = await config.get(client, id);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const flags: Record<string, string | undefined> = {
    "srs-stages": values["srs-stages"],
    levels: values["levels"],
    types: values["types"],
    since: values["since"],
    "subject-ids": values["subject-ids"],
  };
  const params = config.parseFlags(flags);
  const results: unknown[] = [];
  for await (const item of config.list(client, params)) {
    results.push(item);
  }
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error: unknown) => {
  if (error instanceof WaniKaniRateLimitError) {
    console.error(
      JSON.stringify({
        error: "Rate limit exceeded",
        resetAt: error.resetAt.toISOString(),
      }),
    );
    process.exit(1);
  }
  if (error instanceof WaniKaniApiError) {
    console.error(
      JSON.stringify({
        error: error.apiMessage,
        status: error.status,
        code: error.code,
      }),
    );
    process.exit(1);
  }
  if (error instanceof Error) {
    console.error(JSON.stringify({ error: error.message }));
  } else {
    console.error(JSON.stringify({ error: String(error) }));
  }
  process.exit(1);
});
