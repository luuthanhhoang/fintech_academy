/** Deep link into a simulator with a parameter preset. */
export function simulatorHref(id: string, params: Record<string, number>): string {
  const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
  return `/simulators/${id}/${q ? `?${q}` : ''}`
}
