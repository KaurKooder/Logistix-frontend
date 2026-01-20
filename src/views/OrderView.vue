<script setup>
import { onMounted } from 'vue'
import { useOrderStore } from '@/stores/orders'
import "@/assets/css/ordercss.css"

const orderStore = useOrderStore()

onMounted(() => {
  orderStore.fetchOrders()
})
</script>

<template>
  <div class="orders-view-outer-container">
    <div class="orders-view-paper-block">

      <header class="orders-view-header-section">
        <h1 class="orders-view-page-title">MINU TELLIMUSED</h1>
      </header>

      <div class="orders-view-body">
        <div v-if="orderStore.orders.length === 0" class="orders-view-empty">
          <p>Sul ei ole veel ühtegi tellimust.</p>
          <router-link to="/products" class="orders-view-back-link">Mine poodi ostlema</router-link>
        </div>

        <div v-else class="orders-view-list">
          <div v-for="order in orderStore.orders" :key="order.orderId" class="orders-view-card">
            <div class="orders-view-card-header">
              <h3 class="orders-view-id">Tellimus #{{ order.orderId }}</h3>
              <span class="orders-view-date">{{ new Date(order.createdAt).toLocaleString() }}</span>
            </div>

            <div class="orders-view-status-row">
              <span class="orders-view-label">Staatus:</span>
              <span class="orders-view-status-badge">{{ order.status }}</span>
            </div>

            <div class="orders-view-items-section">
              <h4 class="orders-view-subtitle">Tellitud tooted:</h4>
              <ul class="orders-view-items-list">
                <li v-for="item in order.items" :key="item.productName" class="orders-view-item-row">
                  <span class="orders-view-item-name">{{ item.productName }}</span>
                  <span class="orders-view-item-details">
                    €{{ item.productPrice.toFixed(2) }} x {{ item.quantity }} =
                    <strong>€{{ item.lineTotal.toFixed(2) }}</strong>
                  </span>
                </li>
              </ul>
            </div>

            <div class="orders-view-card-footer">
              <span class="orders-view-total-label">Tasutud kokku:</span>
              <span class="orders-view-total-amount">€{{ order.totalPrice.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
