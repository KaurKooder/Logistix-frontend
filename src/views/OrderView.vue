<script setup>
import { onMounted } from 'vue'
import { useOrderStore } from '@/stores/orders'

const orderStore = useOrderStore()

onMounted(() => {
  orderStore.fetchOrders()
})
</script>

<template>
  <div class="orders-page">
    <h1>Minu Tellimused</h1>

    <div v-if="orderStore.orders.length === 0">
      <p>Tellimusi ei ole tehtud.</p>
    </div>

    <div v-else class="orders-grid">
      <div v-for="order in orderStore.orders" :key="order.orderId" class="order-card">
        <h3>Tellimus #{{ order.orderId }}</h3>
        <p>Kuupäev: {{ new Date(order.createdAt).toLocaleString() }}</p>
        <p>Staatus: {{ order.status }}</p>

        <div class="order-items">
          <h4>Tooted:</h4>
          <ul>
            <li v-for="item in order.items" :key="item.productName">
              {{ item.productName }} - €{{ item.productPrice.toFixed(2) }} x {{ item.quantity }} = €{{ item.lineTotal.toFixed(2) }}
            </li>
          </ul>
        </div>

        <p class="order-total"><strong>Kokku: €{{ order.totalPrice.toFixed(2) }}</strong></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-page {
  padding: 1rem;
}

.orders-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.order-card {
  border: 1px solid #ccc;
  padding: 1rem;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.order-items ul {
  padding-left: 1.2rem;
}

.order-total {
  margin-top: 0.5rem;
}
</style>
