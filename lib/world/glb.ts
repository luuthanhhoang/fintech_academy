/** Reads the JSON chunk of a binary glTF (.glb): enough to list its animation clips and material names. */
export interface GlbSummary { clips: string[]; materials: string[] }

const MAGIC = 0x46546c67 // "glTF"
const JSON_CHUNK = 0x4e4f534a // "JSON"

export function readGlbSummary(bytes: Uint8Array): GlbSummary | null {
  if (bytes.byteLength < 20) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (view.getUint32(0, true) !== MAGIC || view.getUint32(16, true) !== JSON_CHUNK) return null
  const length = view.getUint32(12, true)
  if (20 + length > bytes.byteLength) return null
  try {
    const json = JSON.parse(new TextDecoder().decode(bytes.subarray(20, 20 + length))) as { animations?: { name?: string }[]; materials?: { name?: string }[] }
    return {
      clips: (json.animations ?? []).map((a) => a.name ?? ''),
      materials: (json.materials ?? []).map((m) => m.name ?? ''),
    }
  } catch {
    return null
  }
}
