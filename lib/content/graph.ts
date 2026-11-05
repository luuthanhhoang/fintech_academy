/** Pure graph helpers over concept prerequisite edges. */

export interface GraphNode {
  id: string
  prerequisites: readonly string[]
}

/** Returns every distinct cycle found (each as a list of ids, first id repeated at the end). */
export function findCycles(nodes: readonly GraphNode[]): string[][] {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const state = new Map<string, 'visiting' | 'done'>()
  const stack: string[] = []
  const cycles: string[][] = []

  const visit = (id: string) => {
    state.set(id, 'visiting')
    stack.push(id)
    for (const dep of byId.get(id)?.prerequisites ?? []) {
      if (!byId.has(dep)) continue
      const s = state.get(dep)
      if (s === 'visiting') cycles.push([...stack.slice(stack.indexOf(dep)), dep])
      else if (s === undefined) visit(dep)
    }
    stack.pop()
    state.set(id, 'done')
  }
  for (const n of nodes) if (!state.has(n.id)) visit(n.id)
  return cycles
}

/**
 * Topological order (prerequisites first). Ties are broken by the provided rank so ordering stays stable
 * and follows the curriculum (e.g. stage order, then declaration order).
 */
export function topoSort<T extends GraphNode>(nodes: readonly T[], rank: (n: T) => number): T[] {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const indegree = new Map(nodes.map((n) => [n.id, 0]))
  const dependents = new Map<string, string[]>()
  for (const n of nodes) {
    for (const dep of n.prerequisites) {
      if (!byId.has(dep)) continue
      indegree.set(n.id, (indegree.get(n.id) ?? 0) + 1)
      dependents.set(dep, [...(dependents.get(dep) ?? []), n.id])
    }
  }
  const ready = nodes.filter((n) => indegree.get(n.id) === 0)
  const out: T[] = []
  while (ready.length > 0) {
    ready.sort((a, b) => rank(a) - rank(b))
    const next = ready.shift() as T
    out.push(next)
    for (const d of dependents.get(next.id) ?? []) {
      const left = (indegree.get(d) ?? 0) - 1
      indegree.set(d, left)
      if (left === 0) ready.push(byId.get(d) as T)
    }
  }
  if (out.length !== nodes.length) throw new Error('Đồ thị tiền đề có vòng lặp')
  return out
}

/** Ids that directly depend on the given id. */
export function dependentsOf(nodes: readonly GraphNode[], id: string): string[] {
  return nodes.filter((n) => n.prerequisites.includes(id)).map((n) => n.id)
}
