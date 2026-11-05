/** Any endpoint implementing the OpenAI Chat Completions API (must allow browser CORS). */
import OpenAI from 'openai'
import type { ChatRequest, ChatResponse, LLMProvider, ProviderSettings, StopKind, TutorMessage } from '../provider'

type Msg = OpenAI.Chat.Completions.ChatCompletionMessageParam

export function toOpenAIMessages(system: string, messages: readonly TutorMessage[]): Msg[] {
  const out: Msg[] = [{ role: 'system', content: system }]
  for (const m of messages) {
    if (m.role === 'user') out.push({ role: 'user', content: m.content })
    else if (m.role === 'assistant') {
      out.push({
        role: 'assistant',
        content: m.content || null,
        ...(m.toolCalls.length ? { tool_calls: m.toolCalls.map((c) => ({ id: c.id, type: 'function' as const, function: { name: c.name, arguments: JSON.stringify(c.input) } })) } : {}),
      })
    } else out.push({ role: 'tool', tool_call_id: m.toolCallId, content: m.content })
  }
  return out
}

const STOP: Record<string, StopKind> = { stop: 'end', tool_calls: 'tool', length: 'max_tokens', content_filter: 'refusal' }

function parseArgs(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return { __invalid_json: raw }
  }
}

export function openAICompatibleProvider(s: ProviderSettings): LLMProvider {
  const client = new OpenAI({ apiKey: s.apiKey, baseURL: s.baseURL, dangerouslyAllowBrowser: true })
  return {
    async chat(req: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> {
      const res = await client.chat.completions.create(
        {
          model: req.model,
          max_tokens: req.maxTokens,
          messages: toOpenAIMessages(req.system, req.messages),
          tools: req.tools.map((t) => ({ type: 'function' as const, function: { name: t.name, description: t.description, parameters: t.inputSchema } })),
        },
        { signal },
      )
      const choice = res.choices[0]
      const calls = (choice?.message.tool_calls ?? []).filter((c) => c.type === 'function')
      return {
        text: choice?.message.content ?? '',
        toolCalls: calls.map((c) => ({ id: c.id, name: c.function.name, input: parseArgs(c.function.arguments) })),
        stop: STOP[choice?.finish_reason ?? ''] ?? 'other',
      }
    },
  }
}
