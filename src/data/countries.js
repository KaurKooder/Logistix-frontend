// Two-letter country codes used across the freight search/post forms.
// Keep the "code" values in sync with FreightDTO.fromCountry / toCountry on the backend
// (equalsIgnoreCase match), so posted freight and search filters stay compatible.
export const countries = [
  { code: 'EE', name: 'Estonia' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'FI', name: 'Finland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'DE', name: 'Germany' },
  { code: 'PL', name: 'Poland' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'PT', name: 'Portugal' },
  { code: 'IT', name: 'Italy' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'HU', name: 'Hungary' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'HR', name: 'Croatia' },
  { code: 'BA', name: 'Bosnia and Herzegovina' },
  { code: 'RS', name: 'Serbia' },
  { code: 'ME', name: 'Montenegro' },
  { code: 'MK', name: 'North Macedonia' },
  { code: 'AL', name: 'Albania' },
  { code: 'RO', name: 'Romania' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'GR', name: 'Greece' },
  { code: 'TR', name: 'Turkey' },
  { code: 'MD', name: 'Moldova' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IS', name: 'Iceland' },
]

export function countryName(code) {
  return countries.find((c) => c.code === code)?.name || code
}

// Same countries, grouped by region so country dropdowns can show category
// headers instead of one long alphabetical-by-code list.
const REGIONS = [
  { group: 'Baltics', codes: ['EE', 'LV', 'LT'] },
  { group: 'Nordics', codes: ['FI', 'SE', 'NO', 'DK', 'IS'] },
  { group: 'Western Europe', codes: ['DE', 'NL', 'BE', 'LU', 'FR', 'GB', 'IE', 'CH', 'AT'] },
  { group: 'Southern Europe', codes: ['ES', 'PT', 'IT', 'GR'] },
  { group: 'Central & Eastern Europe', codes: ['PL', 'CZ', 'SK', 'HU', 'SI', 'HR', 'RO', 'BG', 'MD', 'UA'] },
  { group: 'Balkans & Turkey', codes: ['BA', 'RS', 'ME', 'MK', 'AL', 'TR'] },
]

export const countryGroups = REGIONS.map((r) => ({
  group: r.group,
  options: r.codes.map((code) => countries.find((c) => c.code === code)).filter(Boolean),
}))
