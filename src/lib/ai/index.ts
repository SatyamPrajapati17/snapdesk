
import { AIProvider } from './types';
import { MockAIProvider } from './mock-provider';

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || 'mock';
  
  if (provider === 'mock') {
    return new MockAIProvider();
  }
  
  // Other providers will be implemented in Phase 7
  return new MockAIProvider();
}
