<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import apiClient from '@/services/api';
import "@/assets/css/createproduct.css";

const router = useRouter();
const newProductName = ref('');
const newProductDescription = ref('');
const newProductPrice = ref('');
const newProductCategory = ref('');

const addProduct = async () => {
  if (!newProductName.value || !newProductPrice.value) return;
  try {
    const response = await apiClient.post('/products', {
      category: newProductCategory.value,
      name: newProductName.value,
      description: newProductDescription.value,
      price: Number.parseFloat(newProductPrice.value),
    });
    router.push('/products');
  } catch (error) {
    console.error('Error adding product:', error);
  }
};
</script>

<template>
  <div class="product-add-view-outer-container">
    <div class="product-add-view-paper-block">

      <header class="product-add-view-header-section">
        <h1 class="product-add-view-page-title">LISA UUS TOODE</h1>
      </header>

      <div class="product-add-view-form">
        <div class="product-add-view-field">
          <label class="product-add-view-label">Toote nimi *</label>
          <input
            v-model="newProductName"
            class="product-add-view-input"
            placeholder="Sisesta toote nimi..."
          />
        </div>

        <div class="product-add-view-field">
          <label class="product-add-view-label">Kategooria</label>
          <input
            v-model="newProductCategory"
            class="product-add-view-input"
            placeholder="Kategooria (nt. Raamatud, Mängud)"
          />
        </div>

        <div class="product-add-view-field">
          <label class="product-add-view-label">Kirjeldus</label>
          <textarea
            v-model="newProductDescription"
            class="product-add-view-textarea"
            placeholder="Toote lühikirjeldus..."
          ></textarea>
        </div>

        <div class="product-add-view-field">
          <label class="product-add-view-label">Hind (€) *</label>
          <input
            type="number"
            v-model="newProductPrice"
            class="product-add-view-input"
            placeholder="0.00"
          />
        </div>

        <div class="product-add-view-actions">
          <button class="product-add-view-cancel-btn" @click="$router.push('/products')">Tühista</button>
          <button class="product-add-view-submit-btn" @click="addProduct">Lisa toode</button>
        </div>
      </div>

    </div>
  </div>
</template>
