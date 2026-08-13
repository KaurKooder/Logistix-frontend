// Formats a local phone number as groups of 4 digits ("5555 5555"), stripping
// anything non-numeric and capping at 8 digits to match the "5555 5555" placeholder
// already used on the contact phone field.
export function formatPhoneNumber(raw) {
  const digits = (raw || '').replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 4) return digits
  return `${digits.slice(0, 4)} ${digits.slice(4)}`
}
