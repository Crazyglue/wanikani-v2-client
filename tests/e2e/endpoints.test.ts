import {
  getClient,
  assertResource,
  assertSingularResource,
  assertReport,
  take,
} from "./helpers.js";

const SUBJECT_TYPES = ["radical", "kanji", "vocabulary", "kana_vocabulary"];

describe.skipIf(!process.env.WANIKANI_API_KEY)("E2E: WaniKani API", () => {
  const client = (() => {
    try {
      return getClient();
    } catch {
      return undefined!;
    }
  })();

  describe("getUser", () => {
    it("returns a valid user resource", async () => {
      const user = await client.getUser();
      assertSingularResource(user);
      expect(user.object).toBe("user");

      const data = user.data as Record<string, unknown>;
      expect(typeof data.username).toBe("string");
      expect(typeof data.level).toBe("number");
      expect(typeof data.profile_url).toBe("string");
      expect(typeof data.started_at).toBe("string");
      expect(
        data.current_vacation_started_at === null ||
          typeof data.current_vacation_started_at === "string",
      ).toBe(true);

      // subscription
      const sub = data.subscription as Record<string, unknown>;
      expect(typeof sub.active).toBe("boolean");
      expect(typeof sub.max_level_granted).toBe("number");
      expect(["free", "recurring", "lifetime", "unknown"]).toContain(sub.type);

      // preferences
      const prefs = data.preferences as Record<string, unknown>;
      expect(typeof prefs.lessons_batch_size).toBe("number");
      expect(typeof prefs.reviews_autoplay_audio).toBe("boolean");
    });
  });

  describe("getSummary", () => {
    it("returns a valid summary report", async () => {
      const summary = await client.getSummary();
      assertReport(summary);

      const data = summary.data as Record<string, unknown>;
      expect(Array.isArray(data.lessons)).toBe(true);
      expect(Array.isArray(data.reviews)).toBe(true);
      expect(data.next_reviews_at === null || typeof data.next_reviews_at === "string").toBe(true);

      const lessons = data.lessons as Array<Record<string, unknown>>;
      if (lessons.length > 0) {
        expect(typeof lessons[0].available_at).toBe("string");
        expect(Array.isArray(lessons[0].subject_ids)).toBe(true);
      }

      const reviews = data.reviews as Array<Record<string, unknown>>;
      if (reviews.length > 0) {
        expect(typeof reviews[0].available_at).toBe("string");
        expect(Array.isArray(reviews[0].subject_ids)).toBe(true);
      }
    });
  });

  describe("listSubjects", () => {
    it("returns valid subject resources", async () => {
      const items = await take(client.listSubjects({ levels: [1] }), 5);
      expect(items.length).toBeGreaterThan(0);

      for (const item of items) {
        assertResource(item);
        expect(SUBJECT_TYPES).toContain(item.object);

        const data = item.data as Record<string, unknown>;
        expect(typeof data.level).toBe("number");
        expect(typeof data.slug).toBe("string");
        expect(typeof data.document_url).toBe("string");
        expect(typeof data.created_at).toBe("string");
        expect(Array.isArray(data.meanings)).toBe(true);
        expect(Array.isArray(data.auxiliary_meanings)).toBe(true);
        expect(typeof data.meaning_mnemonic).toBe("string");

        if ((data.meanings as unknown[]).length > 0) {
          const meaning = (data.meanings as Array<Record<string, unknown>>)[0];
          expect(typeof meaning.meaning).toBe("string");
          expect(typeof meaning.primary).toBe("boolean");
          expect(typeof meaning.accepted_answer).toBe("boolean");
        }
      }
    });
  });

  describe("getSubject", () => {
    it("returns a single subject resource", async () => {
      // Subject ID 1 is the radical "ground"
      const subject = await client.getSubject(1);
      assertResource(subject);
      expect(SUBJECT_TYPES).toContain(subject.object);

      const data = subject.data as Record<string, unknown>;
      expect(typeof data.level).toBe("number");
      expect(Array.isArray(data.meanings)).toBe(true);
    });
  });

  describe("listAssignments", () => {
    it("returns valid assignment resources", async () => {
      const items = await take(client.listAssignments(), 5);
      expect(items.length).toBeGreaterThan(0);

      for (const item of items) {
        assertResource(item);
        expect(item.object).toBe("assignment");

        const data = item.data as Record<string, unknown>;
        expect(SUBJECT_TYPES).toContain(data.subject_type);
        expect(typeof data.srs_stage).toBe("number");
        expect(typeof data.subject_id).toBe("number");
        expect(typeof data.created_at).toBe("string");
        expect(typeof data.hidden).toBe("boolean");
        expect(data.available_at === null || typeof data.available_at === "string").toBe(true);
        expect(data.burned_at === null || typeof data.burned_at === "string").toBe(true);
        expect(data.started_at === null || typeof data.started_at === "string").toBe(true);
        expect(data.unlocked_at === null || typeof data.unlocked_at === "string").toBe(true);
      }
    });
  });

  describe("getAssignment", () => {
    it("returns a single assignment resource", async () => {
      // Get an assignment ID from the list first
      const items = await take(client.listAssignments(), 1);
      expect(items.length).toBeGreaterThan(0);

      const assignment = await client.getAssignment(items[0].id);
      assertResource(assignment);
      expect(assignment.object).toBe("assignment");

      const data = assignment.data as Record<string, unknown>;
      expect(SUBJECT_TYPES).toContain(data.subject_type);
      expect(typeof data.srs_stage).toBe("number");
    });
  });

  describe("listReviewStatistics", () => {
    it("returns valid review statistic resources", async () => {
      const items = await take(client.listReviewStatistics(), 5);
      expect(items.length).toBeGreaterThan(0);

      for (const item of items) {
        assertResource(item);
        expect(item.object).toBe("review_statistic");

        const data = item.data as Record<string, unknown>;
        expect(typeof data.percentage_correct).toBe("number");
        expect(typeof data.meaning_correct).toBe("number");
        expect(typeof data.meaning_incorrect).toBe("number");
        expect(typeof data.meaning_current_streak).toBe("number");
        expect(typeof data.meaning_max_streak).toBe("number");
        expect(typeof data.reading_correct).toBe("number");
        expect(typeof data.reading_incorrect).toBe("number");
        expect(typeof data.subject_id).toBe("number");
        expect(SUBJECT_TYPES).toContain(data.subject_type);
      }
    });
  });

  describe("listLevelProgressions", () => {
    it("returns valid level progression resources", async () => {
      const items = await take(client.listLevelProgressions(), 5);
      expect(items.length).toBeGreaterThan(0);

      for (const item of items) {
        assertResource(item);
        expect(item.object).toBe("level_progression");

        const data = item.data as Record<string, unknown>;
        expect(typeof data.level).toBe("number");
        expect(typeof data.created_at).toBe("string");
        expect(data.abandoned_at === null || typeof data.abandoned_at === "string").toBe(true);
        expect(data.completed_at === null || typeof data.completed_at === "string").toBe(true);
        expect(data.passed_at === null || typeof data.passed_at === "string").toBe(true);
        expect(data.started_at === null || typeof data.started_at === "string").toBe(true);
        expect(data.unlocked_at === null || typeof data.unlocked_at === "string").toBe(true);
      }
    });
  });

  describe("listResets", () => {
    it("iterates resets and validates shape if any exist", async () => {
      const items = await take(client.listResets(), 5);
      // Resets may be empty — that's fine
      for (const item of items) {
        assertResource(item);
        expect(item.object).toBe("reset");

        const data = item.data as Record<string, unknown>;
        expect(typeof data.created_at).toBe("string");
        expect(typeof data.original_level).toBe("number");
        expect(typeof data.target_level).toBe("number");
        expect(data.confirmed_at === null || typeof data.confirmed_at === "string").toBe(true);
      }
    });
  });

  describe("listReviews", () => {
    it("iterates reviews and validates shape if any exist", async () => {
      const items = await take(client.listReviews(), 5);
      // Reviews may be empty — that's fine
      for (const item of items) {
        assertResource(item);
        expect(item.object).toBe("review");

        const data = item.data as Record<string, unknown>;
        expect(typeof data.assignment_id).toBe("number");
        expect(typeof data.created_at).toBe("string");
        expect(typeof data.ending_srs_stage).toBe("number");
        expect(typeof data.starting_srs_stage).toBe("number");
        expect(typeof data.incorrect_meaning_answers).toBe("number");
        expect(typeof data.incorrect_reading_answers).toBe("number");
        expect(typeof data.subject_id).toBe("number");
        expect(typeof data.spaced_repetition_system_id).toBe("number");
      }
    });
  });

  describe("listSpacedRepetitionSystems", () => {
    it("returns valid SRS resources", async () => {
      const items = await take(client.listSpacedRepetitionSystems(), 5);
      expect(items.length).toBeGreaterThan(0);

      for (const item of items) {
        assertResource(item);
        expect(item.object).toBe("spaced_repetition_system");

        const data = item.data as Record<string, unknown>;
        expect(typeof data.name).toBe("string");
        expect(typeof data.description).toBe("string");
        expect(typeof data.created_at).toBe("string");
        expect(typeof data.burning_stage_position).toBe("number");
        expect(typeof data.passing_stage_position).toBe("number");
        expect(typeof data.starting_stage_position).toBe("number");
        expect(typeof data.unlocking_stage_position).toBe("number");
        expect(Array.isArray(data.stages)).toBe(true);

        const stages = data.stages as Array<Record<string, unknown>>;
        if (stages.length > 0) {
          expect(typeof stages[0].position).toBe("number");
          expect(stages[0].interval === null || typeof stages[0].interval === "number").toBe(true);
          expect(
            stages[0].interval_unit === null || typeof stages[0].interval_unit === "string",
          ).toBe(true);
        }
      }
    });
  });

  describe("listStudyMaterials", () => {
    it("iterates study materials and validates shape if any exist", async () => {
      const items = await take(client.listStudyMaterials(), 5);
      // Study materials may be empty — that's fine
      for (const item of items) {
        assertResource(item);
        expect(item.object).toBe("study_material");

        const data = item.data as Record<string, unknown>;
        expect(typeof data.created_at).toBe("string");
        expect(typeof data.hidden).toBe("boolean");
        expect(typeof data.subject_id).toBe("number");
        expect(SUBJECT_TYPES).toContain(data.subject_type);
        expect(data.meaning_note === null || typeof data.meaning_note === "string").toBe(true);
        expect(data.reading_note === null || typeof data.reading_note === "string").toBe(true);
        expect(Array.isArray(data.meaning_synonyms)).toBe(true);
      }
    });
  });

  describe("listVoiceActors", () => {
    it("returns valid voice actor resources", async () => {
      const items = await take(client.listVoiceActors(), 5);
      expect(items.length).toBeGreaterThan(0);

      for (const item of items) {
        assertResource(item);
        expect(item.object).toBe("voice_actor");

        const data = item.data as Record<string, unknown>;
        expect(typeof data.name).toBe("string");
        expect(typeof data.description).toBe("string");
        expect(["male", "female"]).toContain(data.gender);
        expect(typeof data.created_at).toBe("string");
      }
    });
  });
});
