/** Provider-agnostic chat interface. Add a provider by implementing LLMProvider and registering it. */

export interface ToolSpec {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

export interface ToolCall {
  id: string
  name: string
  input: unknown
}

export type TutorMessage =
  | { role: 'user'; content: string }
  /** `raw` keeps provider-native content (e.g. thinking blocks) so it can be replayed unchanged. */
  | { role: 'assistant'; content: string; toolCalls: ToolCall[]; raw?: unknown }
  | { role: 'tool'; toolCallId: string; name: string; content: string; isError: boolean }

export interface ChatRequest {
  model: string
  system: string
  messages: TutorMessage[]
  tools: ToolSpec[]
  maxTokens: number
}

export type StopKind = 'end' | 'tool' | 'max_tokens' | 'refusal' | 'other'

export interface ChatResponse {
  text: string
  toolCalls: ToolCall[]
  stop: StopKind
  raw?: unknown
}

export interface LLMProvider {
  chat(req: ChatRequest, signal?: AbortSignal): Promise<ChatResponse>
}

export interface ProviderSettings {
  apiKey: string
  baseURL?: string
}

export type ProviderFactory = (s: ProviderSettings) => LLMProvider
