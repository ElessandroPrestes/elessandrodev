const CJK_PATTERN =
  /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uff00-\uffef]/g

export function sanitizeAnswer(text: string): string {
  return String(text ?? '')
    .replace(CJK_PATTERN, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim()
}

export function cjkRatio(text: string): number {
  const value = String(text ?? '')
  if (!value) return 0
  return (value.length - value.replace(CJK_PATTERN, '').length) / value.length
}

export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, Math.max(0, maxLength - 1))}…`
}
