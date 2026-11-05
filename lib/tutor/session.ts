/** One tutor turn: retrieve → (refuse if no grounding) → model ↔ tools loop → citation check. */
import type { TutorConfig, TutorMode } from '../content/schema/config'
import type { TutorChunk } from './chunks'
import { checkCitations, type CitationCheck } from './citations'
import { buildSystemPrompt, type ModeContext } from './prompt'
import type { LLMProvider, StopKind, TutorMessage } from './provider'
import type { Retriever } from './retrieval'
import { executeTool, toolSpecs } from './tools'

export interface ToolLogEntry {
  name: string
  input: unknown
  output: unknown
  ok: boolean
}

export interface TurnResult {
  text: string
  passages: TutorChunk[]
  toolLog: ToolLogEntry[]
  citations: CitationCheck
  stop: StopKind | 'no_grounding'
  history: TutorMessage[]
}

export interface TurnInput {
  provider: LLMProvider
  model: string
  cfg: TutorConfig
  mode: TutorMode
  retriever: Retriever
  history: TutorMessage[]
  question: string
  retrievalQuery?: string
  context: ModeContext
  signal?: AbortSignal
}

export async function runTurn(input: TurnInput): Promise<TurnResult> {
  const { cfg } = input
  const passages = input.retriever.search(input.retrievalQuery ?? input.question, cfg.retrieval.topK, cfg.retrieval.minScore)
  const userMsg: TutorMessage = { role: 'user', content: input.question }
  if (passages.length === 0) {
    const text = cfg.insufficientText
    return { text, passages, toolLog: [], citations: { valid: [], invalid: [], grounded: true }, stop: 'no_grounding', history: [...input.history, userMsg, { role: 'assistant', content: text, toolCalls: [] }] }
  }
  const system = buildSystemPrompt(cfg, input.mode, passages, input.context)
  const messages: TutorMessage[] = [...input.history, userMsg]
  const toolLog: ToolLogEntry[] = []
  const tools = toolSpecs()
  let stop: StopKind = 'other'
  let text = ''
  for (let round = 0; round <= cfg.maxToolRounds; round++) {
    const res = await input.provider.chat({ model: input.model, system, messages, tools, maxTokens: cfg.maxTokens }, input.signal)
    messages.push({ role: 'assistant', content: res.text, toolCalls: res.toolCalls, raw: res.raw })
    stop = res.stop
    text = res.text
    if (res.toolCalls.length === 0) break
    // Always answer every tool call so the history stays valid for the next turn.
    for (const call of res.toolCalls) {
      const r = executeTool(call.name, call.input)
      toolLog.push({ name: call.name, input: call.input, output: r.output, ok: r.ok })
      messages.push({ role: 'tool', toolCallId: call.id, name: call.name, content: JSON.stringify(r.output), isError: !r.ok })
    }
    if (round === cfg.maxToolRounds) {
      stop = 'other'
      text = text || `(Đã đạt giới hạn ${cfg.maxToolRounds} vòng gọi công cụ.)`
    }
  }
  const citations = checkCitations(text, new Set(passages.map((p) => p.id)), cfg.insufficientText)
  return { text, passages, toolLog, citations, stop, history: messages }
}
