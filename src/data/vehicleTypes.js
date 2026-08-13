// Grouped as [{ group, options }] so dropdowns can show category headers.
// CheckboxDropdown also accepts a flat array of strings for backward compatibility.
export const vehicleTypes = [
  {
    group: 'By weight',
    options: ['Van up to 3.5t', 'Vehicle up to 7.5t', 'Vehicle up to 12t'],
  },
  {
    group: 'Trucks',
    options: [
      'Rigid truck',
      'Rigid truck with trailer',
      'Articulated truck (tractor unit + semi-trailer)',
      'Road train',
    ],
  },
  {
    group: 'Tractor / trailer only',
    options: ['Tractor unit only', 'Semi-trailer only'],
  },
  {
    group: 'Multi-axle & heavy haulage',
    options: ['Multi-axle (3-8+ axles)', 'Heavy haulage vehicle (SPMT, modular transporter)'],
  },
  {
    group: 'Specialized',
    options: ['Car transporter', 'Tow truck / Recovery vehicle', 'Crane truck', 'Escort vehicle'],
  },
]
