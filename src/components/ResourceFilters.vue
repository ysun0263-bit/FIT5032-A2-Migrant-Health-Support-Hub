<script setup>
defineProps({
  searchTerm: {
    type: String,
    required: true,
  },
  selectedTopic: {
    type: String,
    required: true,
  },
  selectedLanguage: {
    type: String,
    required: true,
  },
  selectedServiceType: {
    type: String,
    required: true,
  },
  topics: {
    type: Array,
    required: true,
  },
  languages: {
    type: Array,
    required: true,
  },
  serviceTypes: {
    type: Array,
    required: true,
  },
  resultCount: {
    type: Number,
    required: true,
  },
  totalCount: {
    type: Number,
    required: true,
  },
})

defineEmits([
  'update:searchTerm',
  'update:selectedTopic',
  'update:selectedLanguage',
  'update:selectedServiceType',
  'reset',
])
</script>

<template>
  <form class="search-panel" aria-label="Resource search and filters" @submit.prevent>
    <label for="resource-search">Search resources</label>
    <input
      id="resource-search"
      :value="searchTerm"
      type="search"
      placeholder="Search title, summary, or topic"
      @input="$emit('update:searchTerm', $event.target.value)"
    >

    <div class="filter-grid">
      <label for="topic-filter">
        Topic
        <select
          id="topic-filter"
          :value="selectedTopic"
          @change="$emit('update:selectedTopic', $event.target.value)"
        >
          <option value="">All topics</option>
          <option v-for="topic in topics" :key="topic" :value="topic">{{ topic }}</option>
        </select>
      </label>

      <label for="language-filter">
        Language
        <select
          id="language-filter"
          :value="selectedLanguage"
          @change="$emit('update:selectedLanguage', $event.target.value)"
        >
          <option value="">All languages</option>
          <option v-for="language in languages" :key="language" :value="language">
            {{ language }}
          </option>
        </select>
      </label>

      <label for="service-filter">
        Service type
        <select
          id="service-filter"
          :value="selectedServiceType"
          @change="$emit('update:selectedServiceType', $event.target.value)"
        >
          <option value="">All service types</option>
          <option v-for="serviceType in serviceTypes" :key="serviceType" :value="serviceType">
            {{ serviceType }}
          </option>
        </select>
      </label>
    </div>

    <div class="result-toolbar">
      <p>{{ resultCount }} of {{ totalCount }} resources shown</p>
      <button type="button" @click="$emit('reset')">Reset Filters</button>
    </div>
  </form>
</template>
