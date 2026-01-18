import { defineStore } from 'pinia'
import apiClient from '@/services/api.js'

export const useCartStore = defineStore('cart', {
  state: () => ({
    cart: null,      // Ostukorvi andmed
    cartId: 1        // Võid alustada ühe fikseeritud ostukorviga
  }),
  actions: {
    // Laeb ostukorvi API-st
    async fetchCart() {
      const res = await apiClient.get(`/cart/${this.cartId}`)
      this.cart = res.data
    },

    // Lisab toote ostukorvi
    async addToCart(productId, quantity) {
      const res = await apiClient.post(`/cart/${this.cartId}/items`, { productId, quantity })
      this.cart = res.data
    },

    // Muudab toote kogust ostukorvis
    async updateQuantity(productId, quantity) {
      const res = await apiClient.put(
        `/cart/${this.cartId}/items/${productId}`,
        null,
        { params: { quantity } }
      )
      this.cart = res.data
    },

    // Eemaldab toote ostukorvist
    async removeItem(productId) {
      const res = await apiClient.delete(`/cart/${this.cartId}/items/${productId}`)
      this.cart = res.data
    },

    // Checkout
    async checkout() {
      await apiClient.post(`/cart/${this.cartId}/checkout`)
      this.cart = null
    }
  }
})
