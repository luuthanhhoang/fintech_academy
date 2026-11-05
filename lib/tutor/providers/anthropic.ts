/** Anthropic Messages API, called directly from the browser (BYOK). */
import Anthropic from '@anthropic-ai/sdk'
import type { ChatRequest, ChatResponse, LLMProvider, ProviderSettings, StopKind, TutorMessage } from '../provider'

type Param = Anthropic.MessageParam

export function toAnthropicMessages(messages: readonly TutorMessage[]): Param[] {
  const out: Param[] = []
  for (const m of messages) {
    if (m.role === 'user') out.push({ role: 'user', content: m.content })
    else if (m.role === 'assistant') {
      const content = (m.raw as Anthropic.ContentBlockParam[] | undefined) ?? [
        ...(m.content ? [{ type: 'text' as const, text: m.content }] : []),
        ...m.toolCalls.map((c) => ({ type: 'tool_use' as const, id: c.id, name: c.name, input: c.input })),
      ]
      out.push({ role: 'assistant', content })
    } else {
      const block: Anthropic.ToolResultBlockParam = { type: 'tool_result', tool_use_id: m.toolCallId, content: m.content, is_error: m.isError }
      const prev = out[out.length - 1]
      // All tool results for one assistant turn go into a single user message.
      if (prev && prev.role === 'user' && Array.isArray(prev.content) && prev.content.every((b) => b.type === 'tool_result')) prev.content.push(block)
      else out.push({ role: 'user', content: [block] })
    }
  }
  return out
}

const STOP: Record<string, StopKind> = { end_turn: 'end', tool_use: 'tool', max_tokens: 'max_tokens', refusal: 'refusal', stop_sequence: 'end' }

export function anthropicProvider(s: ProviderSettings): LLMProvider {
  const client = new Anthropic({ apiKey: s.apiKey, baseURL: s.baseURL, dangerouslyAllowBrowser: true })
  return {
    async chat(req: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> {
      const res = await client.messages.create(
        {
          model: req.model,
          max_tokens: req.maxTokens,
          system: req.system,
          messages: toAnthropicMessages(req.messages),
          tools: req.tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.inputSchema as Anthropic.Tool.InputSchema })),
        },
        { signal },
      )
      const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join('\n')
      const toolCalls = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use').map((b) => ({ id: b.id, name: b.name, input: b.input }))
      return { text, toolCalls, stop: STOP[res.stop_reason ?? ''] ?? 'other', raw: res.content }
    },
  }
}
