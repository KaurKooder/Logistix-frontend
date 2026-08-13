<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import apiClient from '@/services/api'

const props = defineProps({
  courseId: {
    type: [Number, String],
    required: true,
  },
  price: {
    type: Number,
    default: null,
  },
})

const loading = ref(true)
const error = ref('')
const distanceKm = ref(0)
const countryBreakdown = ref([])

const tollRates = reactive({})
const fixedCostPerKm = ref('')

let nextCustomCostId = 1
const customCosts = ref([])

const marginPercent = ref('')

async function loadRoute() {
  loading.value = true
  error.value = ''
  try {
    const res = await apiClient.get(`/courses/${props.courseId}/route`)
    distanceKm.value = res.data.distanceKm
    countryBreakdown.value = res.data.countryBreakdown || []
  } catch (e) {
    console.error('Failed to load route for calculator:', e)
    error.value = e.response?.data?.message || 'Could not load route'
  } finally {
    loading.value = false
  }
}

onMounted(loadRoute)

function tollSubtotal(country) {
  return country.tollableKm * (Number(tollRates[country.countryCode]) || 0)
}

const totalTollCost = computed(() =>
  countryBreakdown.value.reduce((sum, c) => sum + tollSubtotal(c), 0),
)

const fixedCostTotal = computed(() => distanceKm.value * (Number(fixedCostPerKm.value) || 0))

function addCustomCost() {
  customCosts.value.push({ id: nextCustomCostId++, label: '', amount: '' })
}

function removeCustomCost(id) {
  customCosts.value = customCosts.value.filter((c) => c.id !== id)
}

const customCostsTotal = computed(() =>
  customCosts.value.reduce((sum, c) => sum + (Number(c.amount) || 0), 0),
)

const totalCost = computed(
  () => totalTollCost.value + fixedCostTotal.value + customCostsTotal.value,
)

// Margin is a share of the sale price (quote), not a markup on cost:
// quote = cost / (1 - margin/100).
const quotePrice = computed(() => {
  const margin = Number(marginPercent.value) || 0
  if (margin >= 100) return null
  return totalCost.value / (1 - margin / 100)
})

function formatEur(value) {
  return `${value.toFixed(2)} €`
}
</script>

<template>
  <div class="route-calc">
    <span v-if="loading" class="freight-scroll-status">Loading route…</span>
    <span v-else-if="error" class="route-calc-error">{{ error }}</span>

    <template v-else>
      <table class="route-calc-table">
        <thead>
          <tr>
            <th>Country</th>
            <th>Total km</th>
            <th>Tollable km</th>
            <th>€/km</th>
            <th>Toll</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in countryBreakdown" :key="c.countryCode">
            <td>{{ c.countryCode }}</td>
            <td>{{ Math.round(c.km) }}</td>
            <td>{{ Math.round(c.tollableKm) }}</td>
            <td>
              <input
                v-model="tollRates[c.countryCode]"
                type="number"
                step="0.01"
                min="0"
                class="route-calc-input"
              />
            </td>
            <td>{{ formatEur(tollSubtotal(c)) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="route-calc-row">
        <div class="route-calc-row-label">
          Fixed cost
          <span class="route-calc-row-hint">{{ Math.round(distanceKm) }} km planned</span>
        </div>
        <input
          v-model="fixedCostPerKm"
          type="number"
          step="0.01"
          min="0"
          placeholder="€/km"
          class="route-calc-input-wide"
        />
        <div class="route-calc-row-total">{{ formatEur(fixedCostTotal) }}</div>
      </div>

      <div class="route-calc-custom-costs">
        <div v-for="c in customCosts" :key="c.id" class="route-calc-custom-row">
          <input
            v-model="c.label"
            type="text"
            placeholder="e.g. Ferry"
            class="route-calc-input-wide"
          />
          <input
            v-model="c.amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="€"
            class="route-calc-input"
          />
          <button type="button" class="route-calc-remove-btn" @click="removeCustomCost(c.id)">
            ×
          </button>
        </div>
        <button type="button" class="route-calc-add-btn" @click="addCustomCost">
          + Add cost
        </button>
      </div>

      <div class="route-calc-summary">
        <div class="route-calc-summary-row">
          <span>Total cost</span>
          <span>{{ formatEur(totalCost) }}</span>
        </div>
        <div class="route-calc-summary-row">
          <span>Profit margin</span>
          <span class="route-calc-margin-input-wrap">
            <input
              v-model="marginPercent"
              type="number"
              step="1"
              min="0"
              max="99"
              class="route-calc-input"
            />
            %
          </span>
        </div>
        <div class="route-calc-summary-row route-calc-net">
          <span>Quote price</span>
          <span>{{ quotePrice != null ? formatEur(quotePrice) : '—' }}</span>
        </div>
        <div class="route-calc-summary-row route-calc-posted">
          <span>Posted price</span>
          <span>{{ price != null ? formatEur(price) : '—' }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.route-calc {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.route-calc-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 90px;
  border: 1px dashed #ddd;
  border-radius: 8px;
  color: #b3261e;
  font-size: 0.82rem;
  background: #fafafa;
  text-align: center;
  padding: 0 16px;
}

.route-calc-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}

.route-calc-table th {
  text-align: left;
  font-size: 0.64rem;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  padding: 4px 3px;
  border-bottom: 1px solid #e0e0e0;
}

.route-calc-table td {
  padding: 5px 3px;
  border-bottom: 1px solid #f0f0f0;
}

.route-calc-input {
  width: 52px;
  padding: 4px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.8rem;
  box-sizing: border-box;
}

.route-calc-input-wide {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85rem;
  box-sizing: border-box;
}

.route-calc-row {
  display: flex;
  align-items: center;
  gap: 8px;
  border-top: 1px solid #e0e0e0;
  padding-top: 12px;
}

.route-calc-row-label {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.route-calc-row-hint {
  font-size: 0.7rem;
  font-weight: 400;
  color: #999;
}

.route-calc-row .route-calc-input-wide {
  flex: 0 0 90px;
}

.route-calc-row-total {
  flex: 0 0 auto;
  font-weight: 700;
  font-size: 0.9rem;
  min-width: 70px;
  text-align: right;
}

.route-calc-custom-costs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.route-calc-custom-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.route-calc-custom-row .route-calc-input-wide {
  flex: 1 1 auto;
}

.route-calc-remove-btn {
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 4px;
  color: #999;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}

.route-calc-remove-btn:hover {
  background: #f5f5f5;
  color: #b3261e;
}

.route-calc-add-btn {
  align-self: flex-start;
  background: transparent;
  border: 1px dashed #d4a76a;
  color: #b55a30;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
}

.route-calc-add-btn:hover {
  background: #fdf3e4;
}

.route-calc-summary {
  border-top: 1px solid #e0e0e0;
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.route-calc-summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #555;
}

.route-calc-margin-input-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.route-calc-net {
  font-weight: 700;
  font-size: 1rem;
  color: #1a1a1a;
}

.route-calc-posted {
  font-size: 0.78rem;
  color: #999;
}
</style>
