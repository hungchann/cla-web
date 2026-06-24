import { ComponentType } from "react";

export interface Feature {
  label: string;
  icon: ComponentType<{ color?: string; width?: number; height?: number }>;
  route?: string;
  empty?: boolean;
}

export type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type InputFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCorrect?: boolean;
  spellCheck?: boolean;
};

export interface ExerciseDetail {
  id: number;
  question: string;
  answer_A: string;
  answer_B: string;
  answer_C: string;
  answer_D: string;
}

export interface Exercise {
  id: number;
  type: string[];
  exercise_detail: ExerciseDetail;
}

export interface Genre {
  id: string;
  title: string;
}
export interface VideoSection {
  id: string;
  title: string;
  title_trans: string;
  author: string;
  avatar: {
    id: string;
    filename_disk: string;
  };
  image_cover: {
    id: string;
    filename_disk: string;
  };
  srt_file: {
    id: string;
    filename_disk: string;
  };
}

type ExerciseItem = {
  id: number;
  question: string;
  answer_A: string;
  answer_B: string;
  answer_C: string;
  answer_D: string;
  // ...add other fields as needed
};
