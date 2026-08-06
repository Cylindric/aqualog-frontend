/** Normalizes a Mantine NumberInput's onChange value (`number | string`) to `number | ''`. */
export function toNumberOrEmpty(value: number | string): number | '' {
  if (typeof value === 'number') return value
  if (value === '') return ''
  const parsed = Number(value)
  return Number.isNaN(parsed) ? '' : parsed
}
