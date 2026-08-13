// Groups digits in threes counting from the right, space-separated
// (e.g. 12000 -> "12 000"), the convention used throughout this app for any
// displayed number (weights, prices, distances, rates).
export function formatThousands(value) {
  if (value == null || value === '') return ''
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  const [whole, frac] = Math.abs(num).toString().split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  const sign = num < 0 ? '-' : ''
  return frac ? `${sign}${grouped}.${frac}` : `${sign}${grouped}`
}
