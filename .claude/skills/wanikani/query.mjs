#!/usr/bin/env node

import { createWaniKaniClient } from "wanikani-v2-client";

const SRS_STAGE_NAMES = {
  0: "Initiate",
  1: "Apprentice I",
  2: "Apprentice II",
  3: "Apprentice III",
  4: "Apprentice IV",
  5: "Guru I",
  6: "Guru II",
  7: "Master",
  8: "Enlightened",
  9: "Burned",
};

function getClient() {
  const apiToken = process.env.WANIKANI_API_KEY;
  if (!apiToken) {
    console.error("Error: WANIKANI_API_KEY environment variable is required");
    process.exit(1);
  }
  return createWaniKaniClient({ apiToken });
}

/** Collect up to `limit` items from an async iterable. */
async function collect(iterable, limit = Infinity) {
  const items = [];
  for await (const item of iterable) {
    items.push(item);
    if (items.length >= limit) break;
  }
  return items;
}

function parseArgs(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : "true";
      flags[key] = val;
    }
  }
  return flags;
}

// --- Subcommands ---

async function snapshot() {
  const client = getClient();

  const [user, summary, levelProgressions, reviewStats] = await Promise.all([
    client.getUser(),
    client.getSummary(),
    collect(client.listLevelProgressions()),
    collect(client.listReviewStatistics(), 500),
  ]);

  // Build SRS distribution from assignments (sampled)
  const srsDistribution = {};
  for (let stage = 0; stage <= 9; stage++) {
    srsDistribution[stage] = { name: SRS_STAGE_NAMES[stage], total: 0, by_type: {} };
  }

  const assignments = await collect(client.listAssignments(), 5000);
  for (const a of assignments) {
    const stage = a.data.srs_stage;
    const type = a.data.subject_type;
    if (srsDistribution[stage]) {
      srsDistribution[stage].total++;
      srsDistribution[stage].by_type[type] = (srsDistribution[stage].by_type[type] || 0) + 1;
    }
  }

  // Compute accuracy from review stats sample
  let meaningCorrect = 0;
  let meaningIncorrect = 0;
  let readingCorrect = 0;
  let readingIncorrect = 0;
  for (const rs of reviewStats) {
    meaningCorrect += rs.data.meaning_correct;
    meaningIncorrect += rs.data.meaning_incorrect;
    readingCorrect += rs.data.reading_correct;
    readingIncorrect += rs.data.reading_incorrect;
  }
  const meaningTotal = meaningCorrect + meaningIncorrect;
  const readingTotal = readingCorrect + readingIncorrect;

  // Preserve hourly review/lesson schedule from summary
  const lessons = summary.data.lessons.map((l) => ({
    available_at: l.available_at,
    count: l.subject_ids.length,
  }));
  const reviews = summary.data.reviews.map((r) => ({
    available_at: r.available_at,
    count: r.subject_ids.length,
  }));

  // Format level progressions
  const levels = levelProgressions
    .map((lp) => ({
      level: lp.data.level,
      started_at: lp.data.started_at,
      passed_at: lp.data.passed_at,
      completed_at: lp.data.completed_at,
      abandoned_at: lp.data.abandoned_at,
    }))
    .sort((a, b) => a.level - b.level);

  const result = {
    user: {
      username: user.data.username,
      level: user.data.level,
      started_at: user.data.started_at,
      subscription: user.data.subscription.type,
    },
    summary: {
      next_reviews_at: summary.data.next_reviews_at,
      lessons,
      reviews,
    },
    srs_distribution: srsDistribution,
    level_progressions: levels,
    accuracy: {
      meaning_correct_pct: meaningTotal > 0 ? Math.round((meaningCorrect / meaningTotal) * 10000) / 100 : null,
      reading_correct_pct: readingTotal > 0 ? Math.round((readingCorrect / readingTotal) * 10000) / 100 : null,
      sample_size: reviewStats.length,
    },
    total_assignments: assignments.length,
  };

  console.log(JSON.stringify(result, null, 2));
}

async function listAssignments(args) {
  const flags = parseArgs(args);
  const client = getClient();

  const params = {};
  if (flags.level) params.levels = [Number(flags.level)];
  if (flags["srs-stage"]) params.srs_stages = [Number(flags["srs-stage"])];
  if (flags.type) params.subject_types = [flags.type];

  const items = await collect(client.listAssignments(params), 500);
  const result = items.map((a) => ({
    id: a.id,
    subject_id: a.data.subject_id,
    subject_type: a.data.subject_type,
    srs_stage: a.data.srs_stage,
    srs_stage_name: SRS_STAGE_NAMES[a.data.srs_stage] || `Stage ${a.data.srs_stage}`,
    available_at: a.data.available_at,
    burned_at: a.data.burned_at,
  }));

  console.log(JSON.stringify({ count: result.length, assignments: result }, null, 2));
}

async function reviewStatsCmd(args) {
  const flags = parseArgs(args);
  const client = getClient();

  const belowPct = flags["below-pct"] ? Number(flags["below-pct"]) : 80;
  const params = { percentages_less_than: belowPct };

  const items = await collect(client.listReviewStatistics(params), 200);
  const result = items.map((rs) => ({
    subject_id: rs.data.subject_id,
    subject_type: rs.data.subject_type,
    percentage_correct: rs.data.percentage_correct,
    meaning_correct: rs.data.meaning_correct,
    meaning_incorrect: rs.data.meaning_incorrect,
    reading_correct: rs.data.reading_correct,
    reading_incorrect: rs.data.reading_incorrect,
  }));

  console.log(JSON.stringify({ threshold: belowPct, count: result.length, items: result }, null, 2));
}

async function reviewsCmd(args) {
  const flags = parseArgs(args);
  const client = getClient();

  const params = {};
  if (flags.since) params.updated_after = new Date(flags.since).toISOString();

  const items = await collect(client.listReviews(params), 500);
  const result = items.map((r) => ({
    id: r.id,
    subject_id: r.data.subject_id,
    created_at: r.data.created_at,
    starting_srs_stage: r.data.starting_srs_stage,
    ending_srs_stage: r.data.ending_srs_stage,
    incorrect_meaning_answers: r.data.incorrect_meaning_answers,
    incorrect_reading_answers: r.data.incorrect_reading_answers,
  }));

  console.log(JSON.stringify({ count: result.length, reviews: result }, null, 2));
}

// --- Main ---

const [subcommand, ...rest] = process.argv.slice(2);

switch (subcommand || "snapshot") {
  case "snapshot":
    await snapshot();
    break;
  case "assignments":
    await listAssignments(rest);
    break;
  case "review-stats":
    await reviewStatsCmd(rest);
    break;
  case "reviews":
    await reviewsCmd(rest);
    break;
  default:
    console.error(`Unknown subcommand: ${subcommand}`);
    console.error("Usage: query.mjs [snapshot|assignments|review-stats|reviews] [flags]");
    process.exit(1);
}
