<script setup>
defineProps({
  service: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <article class="feature-card">
    <p class="card-tag">{{ service.category }}</p>
    <h2>{{ service.name }}</h2>
    <p>{{ service.shortDescription }}</p>
    <dl class="compact-list">
      <div>
        <dt>Suburb</dt>
        <dd>{{ service.suburb }}</dd>
      </div>
      <div>
        <dt>Languages</dt>
        <dd>{{ service.languages.join(', ') }}</dd>
      </div>
      <div>
        <dt>Contact</dt>
        <dd>{{ service.contactType }}</dd>
      </div>
      <div>
        <dt>Availability</dt>
        <dd>{{ service.availability }}</dd>
      </div>
    </dl>
  </article>
</template>
