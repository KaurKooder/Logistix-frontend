import { defineStore } from 'pinia'
import apiClient from '@/services/api.js'

export const useCartStore = defineStore('cart', {
  state: () => ({
    cart: null,      // Ostukorvi andmed
  }),
  actions: {
    // Laeb praeguse kasutaja ostukorvi
    async fetchCart() {
      try {
        const res = await apiClient.get('/cart')
        this.cart = res.data
      } catch (err) {
        console.error('Fetch cart failed:', err.response?.data || err)
        this.cart = { items: [], totalPrice: 0 }
      }
    },

    // Lisab toote ostukorvi
    async addToCart(productId, quantity) {
      const res = await apiClient.post(`/cart/items`, { productId, quantity })
      this.cart = res.data
    },

    // Muudab toote kogust ostukorvis
    async updateQuantity(productId, quantity) {
      const res = await apiClient.put(`/cart/items/${productId}`, null, { params: { quantity } })
      this.cart = res.data
    },

    // Eemaldab toote ostukorvist
    async removeItem(productId) {
      const res = await apiClient.delete(`/cart/items/${productId}`)
      this.cart = res.data
    },

    // Checkout
    async checkout() {
      await apiClient.post(`/cart/checkout`)
      await this.fetchCart()
    }
  }
})
