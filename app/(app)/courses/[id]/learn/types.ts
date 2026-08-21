export type VocabExample = {
    chinese: string;
    pinyin: string;
    vietnamese: string;
};

export type VocabSense = {
    id: string | number;
    pos_label?: string;
    meaning: string;
    examples: VocabExample[];
};

export type VocabItem = {
    id: string | number;
    word: string;
    pinyin: string;
    meaning: string;
    word_type?: string;
    note?: string;
    time_start?: string;
    time_end?: string;
    senses?: VocabSense[];
    gif_id?: string | null;
    gif_url?: string | null;
};

export type SubtitleItem = {
    start: number;
    end: number;
    chinese: string;
    vietnamese?: string;
    pinyin?: string;
    rawText?: string;
};

export type QuizExercise = {
    id: string | number;
    question: string;
    answer_A?: string;
    answer_B?: string;
    answer_C?: string;
    answer_D?: string;
    Correct_answer?: string;
    Explanation?: string;
    audio_url?: string;
};

export function srtTimeToSeconds(t?: string): number {
    if (!t) return 0;
    const [h, m, rest] = t.split(":");
    const s = (rest || "").replace(",", ".");
    return Number(h || 0) * 3600 + Number(m || 0) * 60 + Number(s || 0);
}
