/** Branching-scenario state machine (pure). */
import type { Scenario, ScenarioChoice, ScenarioNode } from '../content/schema/learning'

export interface Step {
  node: ScenarioNode
  choice: ScenarioChoice | null
}

export interface ScenarioState {
  path: Step[]
}

export function startScenario(s: Scenario): ScenarioState {
  return { path: [{ node: nodeById(s, s.start), choice: null }] }
}

export function nodeById(s: Scenario, id: string): ScenarioNode {
  const n = s.nodes.find((x) => x.id === id)
  if (!n) throw new Error(`Nút "${id}" không tồn tại`)
  return n
}

export function current(state: ScenarioState): ScenarioNode {
  return (state.path[state.path.length - 1] as Step).node
}

export function choose(s: Scenario, state: ScenarioState, choiceId: string): ScenarioState {
  const node = current(state)
  const choice = node.choices?.find((c) => c.id === choiceId)
  if (!choice) throw new Error(`Lựa chọn "${choiceId}" không có ở nút "${node.id}"`)
  const path = state.path.slice(0, -1).concat({ node, choice }, { node: nodeById(s, choice.next), choice: null })
  return { path }
}

export function isFinished(state: ScenarioState): boolean {
  return Boolean(current(state).ending)
}

/** Counts of choice quality along the path (for the debrief). */
export function qualitySummary(state: ScenarioState): Record<ScenarioChoice['quality'], number> {
  const out = { good: 0, risky: 0, bad: 0 }
  for (const st of state.path) if (st.choice) out[st.choice.quality]++
  return out
}
