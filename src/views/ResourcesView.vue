<script setup>
import { computed, ref } from 'vue'
import { healthResources } from '../data/healthResources'
import ResourceCard from '../components/ResourceCard.vue'
import ResourceFilters from '../components/ResourceFilters.vue'
import SectionHeading from '../components/SectionHeading.vue'

const searchTerm = ref('')
const selectedTopic = ref('')
const selectedLanguage = ref('')
const selectedServiceType = ref('')

const topics = computed(() => sortedUnique(healthResources.map((resource) => resource.topic)))
const languages = computed(() => sortedUnique(healthResources.map((resource) => resource.language)))
const serviceTypes = computed(() =>
  sortedUnique(healthResources.map((resource) => resource.serviceType)),
)

const filteredResources = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()

  return healthResources.filter((resource) => {
    const matchesSearch =
      !query ||
      [resource.title, resource.summary, resource.topic].some((value) =>
        value.toLowerCase().includes(query),
      )
    const matchesTopic = !selectedTopic.value || resource.topic === selectedTopic.value
    const matchesLanguage = !selectedLanguage.value || resource.language === selectedLanguage.value
    const matchesServiceType =
      !selectedServiceType.value || resource.serviceType === selectedServiceType.value

    return matchesSearch && matchesTopic && matchesLanguage && matchesServiceType
  })
})

function sortedUnique(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

function resetFilters() {
  searchTerm.value = ''
  selectedTopic.value = ''
  selectedLanguage.value = ''
  selectedServiceType.value = ''
}
</script>

<template>
  <div class="page-stack">
    <section class="content-section">
      <SectionHeading
        level="h1"
        eyebrow="Health Resources"
        title="Search and browse health information"
        text="Search by keyword and combine topic, language, and service type filters. Results update immediately from JavaScript data structures and Vue computed state."
      />

      <ResourceFilters
        v-model:search-term="searchTerm"
        v-model:selected-topic="selectedTopic"
        v-model:selected-language="selectedLanguage"
        v-model:selected-service-type="selectedServiceType"
        :topics="topics"
        :languages="languages"
        :service-types="serviceTypes"
        :result-count="filteredResources.length"
        :total-count="healthResources.length"
        @reset="resetFilters"
      />

      <div v-if="filteredResources.length" class="card-grid three">
        <ResourceCard
          v-for="resource in filteredResources"
          :key="resource.id"
          :resource="resource"
        />
      </div>

      <div v-else class="empty-state" role="status">
        <h2>No matching resources</h2>
        <p>Try a different keyword, topic, language, or service type.</p>
        <button type="button" @click="resetFilters">Reset Filters</button>
      </div>
    </section>
  </div>
</template>
