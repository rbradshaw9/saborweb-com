import 'server-only';

export type OpenAiReasoningEffort = 'low' | 'medium' | 'high';

const VALID_REASONING_EFFORTS = new Set<OpenAiReasoningEffort>(['low', 'medium', 'high']);

export function openAiReasoningEffort(defaultEffort: OpenAiReasoningEffort = 'high'): OpenAiReasoningEffort {
  const value = (process.env.OPENAI_REASONING_EFFORT || '').trim().toLowerCase();
  if (VALID_REASONING_EFFORTS.has(value as OpenAiReasoningEffort)) {
    return value as OpenAiReasoningEffort;
  }
  return defaultEffort;
}
