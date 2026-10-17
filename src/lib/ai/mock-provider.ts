
import { AIProvider, ExtractionResult } from './types';

export class MockAIProvider implements AIProvider {
  async extractDocument(file: File): Promise<ExtractionResult> {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
    
    return {
      fields: [
        { label: 'Document Type', value: 'Employment Contract', source: 'Page 1, Line 1' },
        { label: 'Salary', value: '$80,000 / year', source: 'Page 2, Section 3' },
        { label: 'Start Date', value: '2026-11-01', source: 'Page 1, Para 2' },
      ],
      risks: [
        { level: 'high', message: 'Non-compete clause is overly broad', snippet: 'Employee shall not work for any competitor in the entire galaxy...' },
      ],
      deadlines: [
        { date: '2026-10-25', description: 'Sign and return contract' },
      ],
    };
  }

  async generateEmail(context: string): Promise<string> {
    return `Dear Team,\n\nI have reviewed the document: ${context}.\n\nEverything looks good, but I have some questions about the non-compete clause.\n\nBest regards,`;
  }
}
