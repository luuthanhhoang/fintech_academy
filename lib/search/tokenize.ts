/** Vietnamese-friendly normalisation: lowercase, strip diacritics, đ → d. Shared by index build and query. */
export function foldVietnamese(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
}

export function tokenize(text: string): string[] {
  return foldVietnamese(text).split(/[^a-z0-9]+/).filter(Boolean)
}
