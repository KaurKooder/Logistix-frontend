// Vehicle/trailer equipment and certificates a freight posting may require or a
// carrier's vehicle may offer. Compiled from Timocom-style body characteristics
// research plus DFDS/food & pharma-relevant certificates.
// Grouped as [{ group, options }] so the dropdown can show category headers.
export const bodyCharacteristics = [
  {
    group: 'Body & chassis features',
    options: [
      'Air suspension',
      'Back tipper',
      'Code XL',
      'Curtainsider',
      'Double floor',
      'Euro combi',
      'Folding side box',
      'Hanging garment container',
      'Lifting roof',
      'Low floor',
      'Removal truck',
      'Side tipper',
      'Sliding roof',
      'Steel rails for Jolod',
      'Widenable',
      'Insulated body (isoleeritud, ilma aktiivse jahutuseta)',
      'Coil well (rullmaterjali süvend)',
      'Beverage crates rack (joogikäru/kastiraamid)',
      'Exchangeable container (Vahetatav konteiner)',
      'Meat hooks',
    ],
  },
  {
    group: 'Loading & handling equipment',
    options: [
      'Loading dock capable',
      'Access ramp',
      'Fixed loading crane',
      'Pallet lifter',
      'Portable forklift',
      'Tail lift',
      'Loading ramps (fixed/portable)',
      'Log stanchions',
    ],
  },
  {
    group: 'Load securing',
    options: [
      'Load securing (Koorma kinnitus)',
      'Anti slip mats',
      'Edge protection',
      'Lashing chains / straps',
      'Locking bar',
      'Pallet retaining bar',
      'Perforated batten',
      'Side panels',
      'Stanchions',
      'Partition wall',
      'Tarpaulin cover',
      'Customs seal string',
    ],
  },
  {
    group: 'Temperature control & monitoring',
    options: [
      'Dual evaporator',
      'Multi-temperature unit (mitme temperatuuritsooniga jahutus, oluline külmikvedudel)',
      'Reefer genset / diesel generator (sõltumatu külmiku toide sõidu ajal, nt praamil)',
      'Temperature logger / recorder (temperatuuriandur koos salvestusega)',
    ],
  },
  {
    group: 'Tracking, security & crew',
    options: [
      'Satellite tracking',
      'Curtain camera / CCTV monitoring',
      'On-board weighing system (kaalumissüsteem)',
      'ADR',
      '2nd driver',
      'Escort vehicle type 3 / type 4',
      'Waste carrier licence',
    ],
  },
  {
    group: 'Certificates',
    options: [
      'GMP Certificate',
      'IFS Logistics (toiduahela turvasertifikaat)',
      'HACCP (toiduohutuse süsteem)',
      'GDP Certificate (Good Distribution Practice)',
      'ISO 9001 (kvaliteedijuhtimine)',
      'TAPA TSR (kaubaveo turvasertifikaat)',
      'Organic/Bio transport certificate',
    ],
  },
]
