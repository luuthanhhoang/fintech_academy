import { describe, expect, it } from 'vitest'
import { loadContent } from '@/lib/content/load'
import { buildTutorChunks } from '@/lib/tutor/chunks'
import { checkCitations, extractCitations } from '@/lib/tutor/citations'
import type { ChatRequest, ChatResponse, LLMProvider } from '@/lib/tutor/provider'
import { toAnthropicMessages } from '@/lib/tutor/providers/anthropic'
import { toOpenAIMessages } from '@/lib/tutor/providers/openai-compatible'
import { createRetriever } from '@/lib/tutor/retrieval'
import { runTurn } from '@/lib/tutor/session'
import { executeTool, toolSpecs } from '@/lib/tutor/tools'

const bundle = loadContent()
const cfg = bundle.config.tutor
const mode = cfg.modes.find((m) => m.id === 'qa')!
const retriever = createRetriever(buildTutorChunks(bundle))

/** Scripted provider: returns queued responses and records requests. */
function scripted(responses: ChatResponse[]): LLMProvider & { requests: ChatRequest[] } {
  const requests: ChatRequest[] = []
  return { requests, chat: async (req) => (requests.push(structuredClone(req)), responses.shift() as ChatResponse) }
}

describe('tutor tools', () => {
  it('computes via lib/finance and validates input', () => {
    expect((executeTool('future_value', { pv: 1000, rate: 0.05, years: 10, compoundsPerYear: 1 }).output as { fv: number }).fv).toBeCloseTo(1628.89, 2)
    expect(executeTool('future_value', { pv: 'x' }).ok).toBe(false)
    expect(executeTool('nope', {}).ok).toBe(false)
    expect(toolSpecs().every((t) => t.inputSchema.type === 'object')).toBe(true)
  })
})

describe('citations', () => {
  it('separates valid and invalid citations', () => {
    expect(extractCitations('a [x#y] b [z]')).toEqual(['x#y', 'z'])
    const c = checkCitations('Theo [x#y] và [bad]', new Set(['x#y']), cfg.insufficientText)
    expect(c).toEqual({ valid: ['x#y'], invalid: ['bad'], grounded: true })
    expect(checkCitations('không trích dẫn', new Set(['x']), cfg.insufficientText).grounded).toBe(false)
    expect(checkCitations(cfg.insufficientText, new Set(), cfg.insufficientText).grounded).toBe(true)
  })
})

describe('tutor turn', () => {
  it('refuses without calling the model when retrieval finds nothing', async () => {
    const p = scripted([])
    const r = await runTurn({ provider: p, model: 'm', cfg, mode, retriever, history: [], question: 'zzqxw kkkvv', context: {} })
    expect(r.stop).toBe('no_grounding')
    expect(r.text).toBe(cfg.insufficientText)
    expect(p.requests).toHaveLength(0)
  })
  it('runs tools, then checks citations against retrieved passages', async () => {
    const passages = retriever.search('lãi kép EAR', cfg.retrieval.topK, cfg.retrieval.minScore)
    expect(passages.length).toBeGreaterThan(0)
    const cite = passages[0]!.id
    const p = scripted([
      { text: '', toolCalls: [{ id: 't1', name: 'future_value', input: { pv: 100, rate: 0.1, years: 1, compoundsPerYear: 1 } }], stop: 'tool' },
      { text: `Kết quả là 110 [${cite}]`, toolCalls: [], stop: 'end' },
    ])
    const r = await runTurn({ provider: p, model: 'm', cfg, mode, retriever, history: [], question: 'lãi kép EAR', context: {} })
    expect(r.toolLog[0]?.output).toMatchObject({ fv: 110.00000000000001 })
    expect(r.citations.valid).toEqual([cite])
    expect(p.requests[0]!.system).toContain('<passages>')
    expect(p.requests[1]!.messages.at(-1)).toMatchObject({ role: 'tool', toolCallId: 't1' })
  })
})

describe('provider message mapping', () => {
  const msgs = [
    { role: 'user' as const, content: 'q' },
    { role: 'assistant' as const, content: 'x', toolCalls: [{ id: 'a', name: 'n', input: {} }, { id: 'b', name: 'n', input: {} }] },
    { role: 'tool' as const, toolCallId: 'a', name: 'n', content: '1', isError: false },
    { role: 'tool' as const, toolCallId: 'b', name: 'n', content: '2', isError: true },
  ]
  it('anthropic groups tool results into one user message', () => {
    const out = toAnthropicMessages(msgs)
    expect(out).toHaveLength(3)
    expect((out[2]!.content as unknown[]).length).toBe(2)
  })
  it('openai maps tool results to role=tool messages', () => {
    const out = toOpenAIMessages('sys', msgs)
    expect(out[0]).toEqual({ role: 'system', content: 'sys' })
    expect(out.filter((m) => m.role === 'tool')).toHaveLength(2)
  })
})
