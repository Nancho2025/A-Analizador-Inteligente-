
export interface Question {
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizTopic {
  topic: string;
  questions: Question[];
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface AnalysisResult {
  summary: string;
  quizzes: QuizTopic[];
  flashcards: Flashcard[];
}

export interface UploadedFile {
  id: string;
  file: File;
  previewUrl?: string;
  base64?: string;
  mimeType: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  GENERATING_AUDIO = 'GENERATING_AUDIO',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}