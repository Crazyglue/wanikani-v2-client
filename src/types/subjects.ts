export interface Meaning {
  meaning: string;
  primary: boolean;
  accepted_answer: boolean;
}

export interface AuxiliaryMeaning {
  meaning: string;
  type: "whitelist" | "blacklist";
}

export interface Reading {
  reading: string;
  primary: boolean;
  accepted_answer: boolean;
  type?: "onyomi" | "kunyomi" | "nanori";
}

export interface PronunciationAudio {
  url: string;
  metadata: {
    gender: string;
    source_id: number;
    pronunciation: string;
    voice_actor_id: number;
    voice_actor_name: string;
    voice_description: string;
  };
  content_type: string;
}

export interface ContextSentence {
  en: string;
  ja: string;
}

export interface CharacterImage {
  url: string;
  metadata: {
    inline_styles?: boolean;
    color?: string;
    dimensions?: string;
    style_name?: string;
  };
  content_type: string;
}

interface SubjectBase {
  auxiliary_meanings: AuxiliaryMeaning[];
  characters: string | null;
  created_at: string;
  document_url: string;
  hidden_at: string | null;
  lesson_position: number;
  level: number;
  meaning_mnemonic: string;
  meanings: Meaning[];
  slug: string;
  spaced_repetition_system_id: number;
}

export interface RadicalData extends SubjectBase {
  amalgamation_subject_ids: number[];
  character_images: CharacterImage[];
}

export interface KanjiData extends SubjectBase {
  amalgamation_subject_ids: number[];
  component_subject_ids: number[];
  meaning_hint: string | null;
  reading_hint: string | null;
  reading_mnemonic: string;
  readings: Reading[];
  visually_similar_subject_ids: number[];
}

export interface VocabularyData extends SubjectBase {
  component_subject_ids: number[];
  context_sentences: ContextSentence[];
  meaning_mnemonic: string;
  parts_of_speech: string[];
  pronunciation_audios: PronunciationAudio[];
  reading_mnemonic: string;
  readings: Reading[];
}

export interface KanaVocabularyData extends SubjectBase {
  context_sentences: ContextSentence[];
  meaning_mnemonic: string;
  parts_of_speech: string[];
  pronunciation_audios: PronunciationAudio[];
}

export type SubjectData = RadicalData | KanjiData | VocabularyData | KanaVocabularyData;

export interface SubjectListParams {
  ids?: number[];
  types?: string[];
  slugs?: string[];
  levels?: number[];
  hidden?: boolean;
  updated_after?: string;
}
