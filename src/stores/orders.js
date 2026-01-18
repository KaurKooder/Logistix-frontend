import { defineStore } from 'pinia'
import apiClient from '@/services/api.js'

export const useOrderStore = defineStore('order', {
  state: () => ({
    orders: []   // Kõik tellimused
  }),
  actions: {
    // Laeb kõik tellimused API-st
    async fetchOrders() {
      try {
        const res = await apiClient.get('/orders')
        this.orders = res.data
      } catch (err) {
        console.error('Tellimuste laadimine ebaõnnestus', err)
        alert('Tellimuste laadimine ebaõnnestus')
      }
    },

    // Laeb ühe tellimuse ID alusel
    async fetchOrder(orderId) {
      try {
        const res = await apiClient.get(`/orders/${orderId}`)
        return res.data
      } catch (err) {
        console.error(`Tellimuse #${orderId} laadimine ebaõnnestus`, err)
        alert('Tellimuse laadimine ebaõnnestus')
        return null
      }
    }
  }
})
