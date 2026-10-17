
export interface ExtractionResult {
  fields: { label: string; value: string; source?: string }[];
  risks: { level: 'low' | 'medium' | 'high'; message: string; snippet: string }[];
  deadlines: { date: string; description: string }[];
}

export interface AIProvider {
  extractDocument(file: File): Promise<ExtractionResult>;
  generateEmail(context: string): Promise<string>;
}
