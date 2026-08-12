// General road-freight (rekkavedu) goods categories, used for the "May contain" /
// "May not contain" dropdowns. Same option list on both sides, since what one
// load allows to be combined with is the same vocabulary as what another restricts.
// Grouped as [{ group, options }] so the dropdown can show category headers.
export const cargoTypes = [
  {
    group: 'General & packaging',
    options: [
      'Palletized goods',
      'Non-palletized / loose cargo',
      'General cargo',
      'Oversized / Project cargo',
      'High value goods',
      'Fragile goods',
    ],
  },
  {
    group: 'Food & perishables',
    options: ['Food (ambient)', 'Food (chilled)', 'Food (frozen)', 'Livestock / Live animals', 'Tobacco / Alcohol'],
  },
  {
    group: 'Pharma & chemicals',
    options: ['Pharmaceuticals', 'Chemicals', 'ADR / Dangerous goods', 'Hazardous waste'],
  },
  {
    group: 'Bulk & liquid',
    options: ['Liquids / Bulk liquids', 'Bulk / Loose materials (grain, sand, etc.)'],
  },
  {
    group: 'Industrial & materials',
    options: [
      'Machinery / Equipment',
      'Construction materials',
      'Timber / Wood products',
      'Metal / Steel products',
      'Glass',
      'Paper / Cardboard',
    ],
  },
  {
    group: 'Consumer & other goods',
    options: ['Textiles / Clothing', 'Electronics', 'Furniture', 'Vehicles / Automotive parts', 'Waste / Recyclables'],
  },
]
