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

export interface AnalysisResult {
  summary: string;
  quizzes: QuizTopic[];
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
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
