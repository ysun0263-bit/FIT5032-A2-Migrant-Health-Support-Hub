<script setup>
import { computed, ref } from 'vue'
import ServiceCard from '../components/ServiceCard.vue'
import SectionHeading from '../components/SectionHeading.vue'
import { healthServices } from '../data/healthServices'

const selectedCategory = ref('')
const selectedLanguage = ref('')

const categories = computed(() => sortedUnique(healthServices.map((service) => service.category)))
const languages = computed(() =>
  sortedUnique(healthServices.flatMap((service) => service.languages)),
)

const filteredServices = computed(() =>
  healthServices.filter((service) => {
    const matchesCategory =
      !selectedCategory.value || service.category === selectedCategory.value
    const matchesLanguage =
      !selectedLanguage.value || service.languages.includes(selectedLanguage.value)

    return matchesCategory && matchesLanguage
  }),
)

function sortedUnique(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}
</script>

<template>
  <section class="content-section page-stack">
    <SectionHeading
      level="h1"
      eyebrow="Find Services"
      title="Local service information"
      text="Service cards are rendered from JavaScript data. Filters are local demonstration controls and do not use a map or external API."
    />

    <form class="search-panel" aria-label="Service filters" @submit.prevent>
      <div class="filter-grid">
        <label for="service-category">
          Category
          <select id="service-category" v-model="selectedCategory">
            <option value="">All categories</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </label>
        <label for="service-language">
          Language
          <select id="service-language" v-model="selectedLanguage">
            <option value="">All languages</option>
            <option v-for="language in languages" :key="language" :value="language">
              {{ language }}
            </option>
          </select>
        </label>
      </div>
      <p>{{ filteredServices.length }} of {{ healthServices.length }} services shown</p>
    </form>

    <div class="card-grid three">
      <ServiceCard v-for="service in filteredServices" :key="service.id" :service="service" />
    </div>
  </section>
</template>
