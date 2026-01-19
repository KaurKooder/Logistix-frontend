<script setup>
import { onMounted } from 'vue'
import { useOrderStore } from '@/stores/orders'

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

<style scoped>
.orders-view-outer-container {
  background-color: #F5E9D0;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
  font-family: Arial, sans-serif;
}

.orders-view-paper-block {
  background-color: #ffffff;
  max-width: 900px;
  width: 100%;
  padding: 60px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  color: #4a4a4a;
}

.orders-view-header-section {
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 40px;
  padding-bottom: 10px;
}

.orders-view-page-title {
  font-weight: 300;
  font-size: 2.2rem;
  color: #d4a76a;
  margin: 0;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.orders-view-list {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.orders-view-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 30px;
  background-color: #fdfcf9;
  /* Hover ja transition on siit eemaldatud */
}

.orders-view-card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 15px;
  border-bottom: 1px dashed #ddd;
  padding-bottom: 10px;
}

.orders-view-id {
  color: #d4a76a;
  margin: 0;
  font-size: 1.3rem;
}

.orders-view-date {
  font-size: 0.9rem;
  color: #999;
}

.orders-view-status-row {
  margin-bottom: 20px;
}

.orders-view-label {
  font-weight: bold;
  margin-right: 10px;
  font-size: 0.9rem;
  text-transform: uppercase;
  color: #b55a30;
}

.orders-view-status-badge {
  background: #eee;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #666;
}

.orders-view-subtitle {
  font-size: 1rem;
  margin-bottom: 10px;
  color: #4a4a4a;
}

.orders-view-items-list {
  list-style: none;
  padding: 0;
  margin: 0 0 20px 0;
}

.orders-view-item-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
  font-size: 0.95rem;
}

.orders-view-item-name {
  color: #555;
}

.orders-view-card-footer {
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
  gap: 15px;
  padding-top: 15px;
}

.orders-view-total-label {
  font-size: 1rem;
  text-transform: uppercase;
}

.orders-view-total-amount {
  font-size: 1.5rem;
  font-weight: bold;
  color: #b55a30;
}

.orders-view-empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.orders-view-back-link {
  color: #d4a76a;
  margin-top: 15px;
  display: inline-block;
}

@media (max-width: 600px) {
  .orders-view-paper-block {
    padding: 30px 20px;
  }
  .orders-view-card-header {
    flex-direction: column;
    gap: 5px;
  }
  .orders-view-item-row {
    flex-direction: column;
    gap: 5px;
  }
}
</style>
