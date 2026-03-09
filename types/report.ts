export interface CorrectionItem {
  original: string;
  corrected: string;
  error_type: "grammar" | "vocabulary" | "expression";
  explanation: string;
  frequency_hint: number;
}

export interface NewExpressionItem {
  expression: string;
  meaning_ko: string;
  context: string;
}

export interface CorrectionReport {
  id: string;
  conversation_id: string;
  corrections: CorrectionItem[] | null;
  new_expressions: NewExpressionItem[] | null;
  fluency_score: number | null;
  summary: string | null;
  status: "processing" | "completed" | "failed";
  created_at: string;
  completed_at: string | null;
}
