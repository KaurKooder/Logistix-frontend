<script setup>
import { computed, ref, nextTick, onMounted, onUnmounted } from 'vue'
import { countryGroups } from '@/data/countries'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ mode: 'radius', country: '', countries: [], location: '', radius: '' }),
  },
  label: {
    type: String,
    default: '',
  },
  allowEmptyCountry: {
    type: Boolean,
    default: true,
  },
  required: {
    type: Boolean,
    default: false,
  },
  locationPlaceholder: {
    type: String,
    default: 'ZIP / City',
  },
  // Search filters want a radius selector next to the location field;
  // a single freight posting has one exact location, so the post form omits it.
  showRadius: {
    type: Boolean,
    default: false,
  },
  // Only the search page needs the "Radius" vs "Country selection" mode toggle -
  // e.g. search freight from a specific area OR from a whole set of countries at once.
  allowMultiCountry: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const mode = computed(() => props.modelValue.mode || 'radius')

function setMode(newMode) {
  if (mode.value === newMode) return
  emit('update:modelValue', { ...props.modelValue, mode: newMode })
}

function onLocationInput(e) {
  emit('update:modelValue', { ...props.modelValue, location: e.target.value })
}

function onRadiusChange(e) {
  emit('update:modelValue', { ...props.modelValue, radius: e.target.value })
}

// --- Custom country dropdown (single-select in Radius mode, multi-select in
// Country selection mode). Shows "CODE - Name" while open, code(s) only when closed. ---
const countryOpen = ref(false)
const countryWrapEl = ref(null)
const countrySearchInput = ref(null)
const countrySearch = ref('')
// Snapshot of country/countries taken when the panel opens, so Cancel can
// revert edits made while it was open.
let countrySnapshot = null

function toggleCountryOpen() {
  countryOpen.value = !countryOpen.value
  if (countryOpen.value) {
    countrySnapshot = { country: props.modelValue.country, countries: props.modelValue.countries }
    countrySearch.value = ''
    nextTick(() => countrySearchInput.value?.focus())
  }
}

function confirmCountryPanel() {
  countryOpen.value = false
}

function cancelCountryPanel() {
  if (countrySnapshot) {
    emit('update:modelValue', {
      ...props.modelValue,
      country: countrySnapshot.country,
      countries: Array.isArray(countrySnapshot.countries) ? [...countrySnapshot.countries] : [],
    })
  }
  countryOpen.value = false
}

function onDocumentClick(e) {
  if (countryWrapEl.value && !countryWrapEl.value.contains(e.target)) {
    countryOpen.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onDocumentClick))
onUnmounted(() => document.removeEventListener('mousedown', onDocumentClick))

const filteredCountryGroups = computed(() => {
  const q = countrySearch.value.trim().toLowerCase()
  return countryGroups
    .map((g) => ({
      group: g.group,
      options: q
        ? g.options.filter(
            (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
          )
        : g.options,
    }))
    .filter((g) => g.options.length > 0)
})

function selectCountrySingle(code) {
  emit('update:modelValue', { ...props.modelValue, country: code })
}

function isCountrySelectedMulti(code) {
  return (props.modelValue.countries || []).includes(code)
}

function toggleCountryMulti(code) {
  const current = Array.isArray(props.modelValue.countries) ? [...props.modelValue.countries] : []
  const idx = current.indexOf(code)
  if (idx === -1) current.push(code)
  else current.splice(idx, 1)
  emit('update:modelValue', { ...props.modelValue, countries: current })
}

const countryTriggerText = computed(() => {
  if (mode.value === 'countries') {
    const sel = props.modelValue.countries || []
    if (!sel.length) return 'Any country'
    if (sel.length <= 3) return sel.join(', ')
    return `${sel.length} countries`
  }
  return props.modelValue.country || '—'
})
</script>

<template>
  <div class="clf-field">
    <label v-if="label" class="clf-label">{{ label }}{{ required ? ' *' : '' }}</label>

    <div v-if="allowMultiCountry" class="clf-mode-row">
      <button
        type="button"
        class="clf-mode-btn"
        :class="{ active: mode === 'radius' }"
        @click="setMode('radius')"
      >
        Radius
      </button>
      <button
        type="button"
        class="clf-mode-btn"
        :class="{ active: mode === 'countries' }"
        @click="setMode('countries')"
      >
        Country selection
      </button>
    </div>

    <div class="clf-group">
      <div
        ref="countryWrapEl"
        class="clf-country-wrap"
        :class="{ 'clf-country-wrap-full': mode === 'countries' }"
      >
        <div class="clf-country-trigger" @click="!countryOpen && toggleCountryOpen()">
          <input
            v-if="countryOpen"
            ref="countrySearchInput"
            v-model="countrySearch"
            type="text"
            class="clf-country-input"
            :placeholder="countryTriggerText"
            @click.stop
          />
          <span v-else class="clf-country-text">{{ countryTriggerText }}</span>
          <span class="clf-country-arrow" @click.stop="toggleCountryOpen">{{
            countryOpen ? '▲' : '▼'
          }}</span>
        </div>

        <div v-if="countryOpen" class="clf-backdrop" @click="confirmCountryPanel"></div>
        <div v-if="countryOpen" class="clf-country-panel" @click.stop>
          <div class="clf-panel-list">
            <template v-if="mode === 'radius'">
              <div
                v-if="allowEmptyCountry"
                class="clf-country-option"
                :class="{ selected: !modelValue.country }"
                @click="selectCountrySingle('')"
              >
                — None
              </div>
              <template v-for="g in filteredCountryGroups" :key="g.group">
                <div class="clf-group-label">{{ g.group }}</div>
                <div
                  v-for="c in g.options"
                  :key="c.code"
                  class="clf-country-option"
                  :class="{ selected: c.code === modelValue.country }"
                  @click="selectCountrySingle(c.code)"
                >
                  <strong>{{ c.code }}</strong> - {{ c.name }}
                </div>
              </template>
            </template>
            <template v-else>
              <template v-for="g in filteredCountryGroups" :key="g.group">
                <div class="clf-group-label">{{ g.group }}</div>
                <label
                  v-for="c in g.options"
                  :key="c.code"
                  class="clf-country-option clf-country-option-check"
                  :class="{ selected: isCountrySelectedMulti(c.code) }"
                >
                  <input
                    type="checkbox"
                    class="clf-country-checkbox"
                    :checked="isCountrySelectedMulti(c.code)"
                    @change="toggleCountryMulti(c.code)"
                  />
                  <span><strong>{{ c.code }}</strong> - {{ c.name }}</span>
                </label>
              </template>
            </template>
          </div>
          <div class="clf-panel-actions">
            <button type="button" class="clf-cancel-btn" @click="cancelCountryPanel">Cancel</button>
            <button type="button" class="clf-ok-btn" @click="confirmCountryPanel">OK</button>
          </div>
        </div>
      </div>

      <template v-if="mode === 'radius'">
        <input
          class="clf-input"
          :value="modelValue.location"
          @input="onLocationInput"
          type="text"
          :placeholder="locationPlaceholder"
        />
        <div v-if="showRadius" class="clf-radius-group">
          <input
            class="clf-input clf-radius"
            :value="modelValue.radius"
            @input="onRadiusChange"
            type="number"
            min="0"
            inputmode="numeric"
            placeholder="Radius"
          />
          <span class="clf-unit-suffix">km</span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.clf-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.clf-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  white-space: nowrap;
}

.clf-mode-row {
  display: flex;
  gap: 4px;
}

.clf-mode-btn {
  flex: 1;
  background: #f4f4f4;
  border: 1px solid #ddd;
  color: #666;
  padding: 4px 6px;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 3px;
}

.clf-mode-btn.active {
  background: #d4a76a;
  border-color: #d4a76a;
  color: #1a1a1a;
}

.clf-group {
  display: flex;
  gap: 4px;
  align-items: center;
  width: 100%;
  min-width: 0;
}

.clf-country-wrap {
  position: relative;
  flex: 0 0 76px;
  min-width: 0;
}

.clf-country-wrap-full {
  flex: 1 1 auto;
}

.clf-country-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fdfcf9;
  box-sizing: border-box;
  cursor: pointer;
  font-size: 0.9rem;
  transition: border-color 0.2s;
  min-width: 0;
}

.clf-country-trigger:hover {
  border-color: #d4a76a;
}

.clf-country-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.clf-country-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: inherit;
  font-family: inherit;
  color: #333;
  padding: 0;
}

.clf-country-arrow {
  font-size: 0.6rem;
  color: #999;
  flex-shrink: 0;
}

.clf-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 29;
}

.clf-country-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: max-content;
  min-width: 280px;
  max-width: 92vw;
  max-height: 78vh;
  z-index: 30;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.clf-panel-list {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.clf-panel-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
  flex-shrink: 0;
}

.clf-group-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #b55a30;
  padding: 10px 8px 4px;
  letter-spacing: 0.5px;
}

.clf-group-label:first-child {
  padding-top: 4px;
}

.clf-country-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  cursor: pointer;
  font-size: 0.88rem;
  color: #333;
  white-space: nowrap;
  border-radius: 4px;
}

.clf-country-option:hover {
  background: #f5f5f5;
}

.clf-country-option.selected {
  background: #e8c491;
  font-weight: 600;
}

.clf-country-option.selected:hover {
  background: #e0b87d;
}

.clf-country-checkbox {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  accent-color: #d4a76a;
}

.clf-cancel-btn,
.clf-ok-btn {
  flex: 1;
  border: none;
  padding: 8px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  font-size: 0.85rem;
}

.clf-cancel-btn {
  background: #f0f0f0;
  color: #555;
}

.clf-cancel-btn:hover {
  background: #e2e2e2;
}

.clf-ok-btn {
  background: #d4a76a;
  color: #1a1a1a;
}

.clf-ok-btn:hover {
  background: #b88f55;
}

.clf-input,
.clf-radius {
  padding: 10px 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
  font-size: 0.9rem;
  background: #fdfcf9;
  box-sizing: border-box;
  min-width: 0;
  transition: border-color 0.2s;
}

.clf-input:focus,
.clf-radius:focus {
  border-color: #d4a76a;
}

.clf-input {
  flex: 1;
}

.clf-radius-group {
  position: relative;
  flex: 0 0 80px;
}

.clf-radius {
  width: 100%;
  padding-right: 26px;
}

.clf-unit-suffix {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75rem;
  color: #999;
  pointer-events: none;
}

/* Hide number input spinners so the "km" suffix has room and it looks like a plain field */
.clf-radius::-webkit-outer-spin-button,
.clf-radius::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.clf-radius {
  -moz-appearance: textfield;
}
</style>
