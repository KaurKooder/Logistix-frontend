<script setup>
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: [Array, String],
    default: null,
  },
  // Either a flat array of strings, or a grouped array of
  // { group: 'Label', options: ['a', 'b', ...] } objects.
  options: {
    type: Array,
    required: true,
  },
  multiple: {
    type: Boolean,
    default: true,
  },
  label: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Select...',
  },
  required: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const rootEl = ref(null)
const searchInput = ref(null)
const search = ref('')

const isGrouped = computed(
  () =>
    props.options.length > 0 &&
    typeof props.options[0] === 'object' &&
    props.options[0] !== null &&
    Array.isArray(props.options[0].options),
)

const normalizedGroups = computed(() => {
  if (isGrouped.value) return props.options
  return [{ group: null, options: props.options }]
})

const filteredGroups = computed(() => {
  const q = search.value.trim().toLowerCase()
  return normalizedGroups.value
    .map((g) => ({
      group: g.group,
      options: q ? g.options.filter((o) => o.toLowerCase().includes(q)) : g.options,
    }))
    .filter((g) => g.options.length > 0)
})

const hasResults = computed(() => filteredGroups.value.length > 0)

const selectedList = computed(() => {
  if (props.multiple) return Array.isArray(props.modelValue) ? props.modelValue : []
  return props.modelValue ? [props.modelValue] : []
})

const triggerText = computed(() => {
  const sel = selectedList.value
  if (sel.length === 0) return props.placeholder
  if (sel.length === 1) return sel[0]
  return `${sel.length} selected`
})

function isChecked(option) {
  return selectedList.value.includes(option)
}

function toggleOption(option) {
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const idx = current.indexOf(option)
    if (idx === -1) current.push(option)
    else current.splice(idx, 1)
    emit('update:modelValue', current)
  } else {
    emit('update:modelValue', props.modelValue === option ? '' : option)
    open.value = false
  }
}

function clearSelection(e) {
  e.stopPropagation()
  emit('update:modelValue', props.multiple ? [] : '')
}

function toggleOpen() {
  open.value = !open.value
  if (open.value) {
    search.value = ''
    nextTick(() => searchInput.value?.focus())
  }
}

function closePanel() {
  open.value = false
}

function onDocumentClick(e) {
  if (rootEl.value && !rootEl.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onDocumentClick))
onUnmounted(() => document.removeEventListener('mousedown', onDocumentClick))
</script>

<template>
  <div ref="rootEl" class="cd-root">
    <label v-if="label" class="cd-label">{{ label }}{{ required ? ' *' : '' }}</label>
    <div class="cd-trigger" @click="!open && toggleOpen()">
      <input
        v-if="open"
        ref="searchInput"
        v-model="search"
        type="text"
        class="cd-trigger-input"
        :placeholder="triggerText"
        @click.stop
      />
      <span v-else class="cd-trigger-text" :class="{ 'cd-placeholder': selectedList.length === 0 }">{{
        triggerText
      }}</span>
      <button
        v-if="selectedList.length"
        type="button"
        class="cd-clear-btn"
        title="Clear"
        @click.stop="clearSelection"
      >
        ✕
      </button>
      <span class="cd-arrow" @click.stop="toggleOpen">{{ open ? '▲' : '▼' }}</span>
    </div>

    <div v-if="open" class="cd-backdrop" @click="closePanel"></div>
    <div v-if="open" class="cd-panel" @click.stop>
      <div v-if="!hasResults" class="cd-no-results">No matches</div>
      <template v-for="(g, gi) in filteredGroups" :key="gi">
        <div v-if="g.group" class="cd-group-label">{{ g.group }}</div>
        <label v-for="option in g.options" :key="option" class="cd-option">
          <input
            type="checkbox"
            class="cd-checkbox"
            :checked="isChecked(option)"
            @change="toggleOption(option)"
          />
          <span>{{ option }}</span>
        </label>
      </template>
    </div>
  </div>
</template>

<style scoped>
.cd-root {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.cd-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  white-space: nowrap;
}

.cd-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fdfcf9;
  box-sizing: border-box;
  min-height: 40px;
  transition: border-color 0.2s;
}

.cd-trigger:hover {
  border-color: #d4a76a;
}

.cd-trigger-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cd-trigger-input {
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

.cd-placeholder {
  color: #999;
}

.cd-clear-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  color: #999;
  padding: 0 2px;
}

.cd-clear-btn:hover {
  color: #333;
}

.cd-arrow {
  font-size: 0.65rem;
  color: #999;
}

.cd-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 29;
}

.cd-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: max-content;
  min-width: 260px;
  max-width: 92vw;
  max-height: 78vh;
  z-index: 30;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cd-no-results {
  padding: 8px 6px;
  font-size: 0.82rem;
  color: #999;
  font-style: italic;
}

.cd-group-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #b55a30;
  padding: 10px 8px 4px;
  letter-spacing: 0.5px;
}

.cd-group-label:first-child {
  padding-top: 4px;
}

.cd-option {
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

.cd-option:hover {
  background: #f5f5f5;
}

.cd-checkbox {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  accent-color: #d4a76a;
}
</style>
