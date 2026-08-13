<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    // { mode: '' | 'period' | 'exact', start: '', end: '', dates: [] }
    // mode '' means neither checkbox is picked yet - calendar stays collapsed.
    default: () => ({ mode: '', start: '', end: '', dates: [] }),
  },
  // When false, "Exact dates" mode only allows a single date to be selected
  // (used on the post-freight form, where one posting has one loading day).
  multipleExact: {
    type: Boolean,
    default: true,
  },
  label: {
    type: String,
    default: 'Loading date',
  },
})

const emit = defineEmits(['update:modelValue'])

const weekdayLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const today = new Date()
const initialRef = props.modelValue?.start || props.modelValue?.dates?.[0]
const initialDate = initialRef ? new Date(initialRef) : today

const viewYear = ref(initialDate.getFullYear())
const viewMonth = ref(initialDate.getMonth())

// Whether the calendar panel is expanded. Kept separate from modelValue.mode so
// confirming (OK) or clicking away collapses the panel without losing the
// mode/selection that was already made.
const open = ref(false)
const rootEl = ref(null)
// Snapshot taken whenever the panel opens, so Cancel can revert edits made
// while it was open (day clicks apply live to modelValue).
let openSnapshot = null

function onDocumentClick(e) {
  if (rootEl.value && !rootEl.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onDocumentClick))
onUnmounted(() => document.removeEventListener('mousedown', onDocumentClick))

function pad(n) {
  return String(n).padStart(2, '0')
}

function isoDate(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function firstWeekdayOffset(year, month) {
  // JS getDay(): Sun=0..Sat=6. We want Monday-first, so shift.
  return (new Date(year, month, 1).getDay() + 6) % 7
}

const monthLabel = computed(() =>
  new Date(viewYear.value, viewMonth.value, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  }),
)

const calendarDays = computed(() => {
  const days = []
  const offset = firstWeekdayOffset(viewYear.value, viewMonth.value)
  const total = daysInMonth(viewYear.value, viewMonth.value)
  for (let i = 0; i < offset; i++) days.push(null)
  for (let d = 1; d <= total; d++) days.push(d)
  return days
})

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value -= 1
  } else {
    viewMonth.value -= 1
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value += 1
  } else {
    viewMonth.value += 1
  }
}

function setMode(newMode) {
  openSnapshot = { ...props.modelValue }
  if (props.modelValue.mode === newMode) {
    // Already the active mode - just re-open the panel to edit the existing selection.
    open.value = true
    return
  }
  // Switching mode: start that mode's selection fresh and open the calendar.
  emit('update:modelValue', { mode: newMode, start: '', end: '', dates: [] })
  open.value = true
}

function reopenPanel() {
  openSnapshot = { ...props.modelValue }
  open.value = true
}

function confirmSelection() {
  open.value = false
}

function cancelSelection() {
  if (openSnapshot) {
    emit('update:modelValue', { ...openSnapshot })
  }
  open.value = false
}

function onDayClick(day) {
  if (!day) return
  const iso = isoDate(viewYear.value, viewMonth.value, day)

  if (props.modelValue.mode === 'exact') {
    let dates = Array.isArray(props.modelValue.dates) ? [...props.modelValue.dates] : []
    if (!props.multipleExact) {
      dates = dates.includes(iso) ? [] : [iso]
    } else {
      const idx = dates.indexOf(iso)
      if (idx === -1) dates.push(iso)
      else dates.splice(idx, 1)
      dates.sort()
    }
    emit('update:modelValue', { ...props.modelValue, dates })
    return
  }

  // Period mode
  const { start, end } = props.modelValue
  if (!start || (start && end)) {
    emit('update:modelValue', { ...props.modelValue, start: iso, end: '' })
  } else if (iso < start) {
    emit('update:modelValue', { ...props.modelValue, start: iso, end: start })
  } else {
    emit('update:modelValue', { ...props.modelValue, end: iso })
  }
}

function clearSelection() {
  emit('update:modelValue', { ...props.modelValue, start: '', end: '', dates: [] })
}

function formatIso(iso) {
  const [, m, d] = iso.split('-')
  return `${d}.${m}`
}

// Shown next to the checkboxes once the panel is collapsed again, so the
// confirmed selection stays visible without reopening the calendar.
const summaryText = computed(() => {
  const mv = props.modelValue
  if (mv.mode === 'exact') {
    if (!mv.dates?.length) return ''
    if (mv.dates.length <= 3) return mv.dates.map(formatIso).join(' | ')
    return `${mv.dates.length} dates`
  }
  if (mv.mode === 'period') {
    if (!mv.start) return ''
    return mv.end ? `${formatIso(mv.start)} → ${formatIso(mv.end)}` : formatIso(mv.start)
  }
  return ''
})

function dayClasses(day) {
  if (!day) return ['ldp-day', 'ldp-day-empty']
  const iso = isoDate(viewYear.value, viewMonth.value, day)
  const classes = ['ldp-day']

  if (props.modelValue.mode === 'exact') {
    if ((props.modelValue.dates || []).includes(iso)) classes.push('ldp-day-exact')
  } else {
    const { start, end } = props.modelValue
    if (start && end && iso > start && iso < end) classes.push('ldp-day-range-mid')
    if ((start && iso === start) || (end && iso === end)) classes.push('ldp-day-range-end')
  }

  const todayIso = isoDate(today.getFullYear(), today.getMonth(), today.getDate())
  if (iso === todayIso) classes.push('ldp-day-today')

  return classes
}
</script>

<template>
  <div ref="rootEl" class="ldp-root">
    <div class="ldp-top-row">
      <span v-if="label" class="ldp-label">{{ label }}</span>
      <div class="ldp-box">
        <div class="ldp-mode-options">
          <div class="ldp-mode-option" @click="setMode('exact')">
            <span class="ldp-mode-box" :class="{ active: modelValue.mode === 'exact' }"></span>
            <span>Exact dates</span>
          </div>
          <div class="ldp-mode-option" @click="setMode('period')">
            <span class="ldp-mode-box" :class="{ active: modelValue.mode === 'period' }"></span>
            <span>Period</span>
          </div>
        </div>
        <span v-if="!open && summaryText" class="ldp-summary" @click="reopenPanel">{{
          summaryText
        }}</span>
      </div>
    </div>

    <div v-if="open" class="ldp-backdrop" @click="confirmSelection"></div>
    <div v-if="open" class="ldp-calendar" @click.stop>
      <div class="ldp-cal-header">
        <button type="button" class="ldp-nav-btn" @click="prevMonth" aria-label="Previous month">‹</button>
        <span class="ldp-month-label">{{ monthLabel }}</span>
        <button type="button" class="ldp-nav-btn" @click="nextMonth" aria-label="Next month">›</button>
      </div>
      <div class="ldp-weekdays">
        <span v-for="wd in weekdayLabels" :key="wd">{{ wd }}</span>
      </div>
      <div class="ldp-days">
        <span
          v-for="(day, idx) in calendarDays"
          :key="idx"
          :class="dayClasses(day)"
          @click="onDayClick(day)"
        >
          {{ day || '' }}
        </span>
      </div>
      <div class="ldp-actions">
        <button type="button" class="ldp-clear-link" @click="clearSelection">Clear</button>
        <div class="ldp-actions-main">
          <button type="button" class="ldp-cancel-btn" @click="cancelSelection">Cancel</button>
          <button type="button" class="ldp-ok-btn" @click="confirmSelection">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ldp-root {
  position: relative;
  min-width: 160px;
}

.ldp-top-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ldp-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  white-space: nowrap;
}

.ldp-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fdfcf9;
  box-sizing: border-box;
  min-height: 40px;
  transition: border-color 0.2s;
}

.ldp-box:hover {
  border-color: #d4a76a;
}

.ldp-mode-options {
  display: flex;
  gap: 14px;
}

.ldp-summary {
  font-size: 0.78rem;
  color: #b55a30;
  font-weight: 600;
  cursor: pointer;
}

.ldp-summary:hover {
  text-decoration: underline;
}

.ldp-mode-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 0.82rem;
  color: #555;
}

.ldp-mode-box {
  width: 13px;
  height: 13px;
  border: 2px solid #999;
  display: inline-block;
  flex-shrink: 0;
}

.ldp-mode-box.active {
  background: #d4a76a;
  border-color: #d4a76a;
}

.ldp-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 29;
}

.ldp-calendar {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 280px;
  z-index: 30;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 12px;
  background: #fff;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
}

.ldp-cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 6px;
}

/* A bigger, clearly-clickable square button rather than a bare glyph - the
   previous version was hard to hit precisely, making month-to-month
   navigation feel harder than it should be. */
.ldp-nav-btn {
  background: #f4f4f4;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  color: #555;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
}

.ldp-nav-btn:hover {
  background: #fdf3e4;
  border-color: #d4a76a;
  color: #b55a30;
}

.ldp-month-label {
  font-weight: 600;
  font-size: 0.85rem;
  color: #333;
  flex: 1;
  text-align: center;
}

/* Moved out of the header (it was crowding the month nav) and into the
   actions row, away from Cancel/OK so it isn't mistaken for a primary action. */
.ldp-clear-link {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  color: #b55a30;
  text-decoration: underline;
  padding: 4px 0;
}

.ldp-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 0.7rem;
  color: #999;
  margin-bottom: 4px;
}

.ldp-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.ldp-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: #333;
  cursor: pointer;
  border-radius: 4px;
  border: 2px solid transparent;
}

.ldp-day:hover {
  background: #eee;
}

.ldp-day-empty {
  cursor: default;
}

.ldp-day-empty:hover {
  background: transparent;
}

.ldp-day-today {
  font-weight: 700;
}

.ldp-day-exact {
  border-color: #2e8b57;
  background: rgba(46, 139, 87, 0.1);
  font-weight: 600;
}

/* A thin horizontal band through the middle of the cell rather than filling
   it solid, so the days between the two picked dates read as a connecting
   line running through them instead of each one being its own filled box. */
.ldp-day-range-mid {
  border-radius: 0;
  background: linear-gradient(to bottom, transparent 42%, #a8cbe8 42%, #a8cbe8 58%, transparent 58%);
}

.ldp-day-range-end {
  background: #4a90d9;
  color: #fff;
  border-radius: 50%;
  font-weight: 600;
}

.ldp-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}

.ldp-actions-main {
  display: flex;
  gap: 8px;
}

.ldp-cancel-btn,
.ldp-ok-btn {
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  font-size: 0.85rem;
}

.ldp-cancel-btn {
  background: #f0f0f0;
  color: #555;
}

.ldp-cancel-btn:hover {
  background: #e2e2e2;
}

.ldp-ok-btn {
  background: #d4a76a;
  color: #1a1a1a;
}

.ldp-ok-btn:hover {
  background: #b88f55;
}
</style>
