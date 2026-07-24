<script setup>
import { reactive } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import FormFieldError from '../components/FormFieldError.vue'
import PlaceholderNotice from '../components/PlaceholderNotice.vue'
import SectionHeading from '../components/SectionHeading.vue'
import { isAdmin, login } from '../stores/authStore.js'
import { validateLoginForm } from '../utils/authValidation.js'

const route = useRoute()
const router = useRouter()
const form = reactive({
  email: '',
  password: '',
  rememberMe: false,
})
const errors = reactive({})
const status = reactive({
  message: '',
  type: '',
})
const fieldRefs = {}
const fieldOrder = ['email', 'password']

function setFieldRef(field, element) {
  if (element) {
    fieldRefs[field] = element
  }
}

function errorId(field) {
  return `login-${field}-error`
}

function describedBy(field) {
  return errors[field] ? errorId(field) : undefined
}

function applyErrors(nextErrors) {
  Object.keys(errors).forEach((key) => delete errors[key])
  Object.assign(errors, nextErrors)
}

function validate() {
  const nextErrors = validateLoginForm(form)
  applyErrors(nextErrors)
  return Object.keys(nextErrors).length === 0
}

function focusFirstError() {
  const firstInvalidField = fieldOrder.find((field) => errors[field])
  fieldRefs[firstInvalidField]?.focus()
}

function handleInput() {
  if (Object.keys(errors).length) {
    validate()
  }
}

async function handleSubmit() {
  status.message = ''
  status.type = ''

  if (!validate()) {
    focusFirstError()
    return
  }

  try {
    await login(form)
    const redirectTarget = typeof route.query.redirect === 'string' ? route.query.redirect : null
    router.push(redirectTarget || (isAdmin.value ? '/admin' : '/profile'))
  } catch {
    status.message = 'Email or password is incorrect.'
    status.type = 'error'
  }
}
</script>

<template>
  <section class="content-section narrow page-stack">
    <SectionHeading
      level="h1"
      eyebrow="Login"
      title="Account access"
      text="Sign in to access profile, appointments, and role-based pages in this coursework demo."
    />

    <PlaceholderNotice text="This front-end demo stores session state in Local Storage. It is not production backend authentication." />

    <form class="form-panel" aria-label="Login form" novalidate @submit.prevent="handleSubmit">
      <label>
        Email
        <input
          :ref="(element) => setFieldRef('email', element)"
          v-model="form.email"
          type="email"
          autocomplete="email"
          :aria-invalid="Boolean(errors.email)"
          :aria-describedby="describedBy('email')"
          @input="handleInput"
          @blur="handleInput"
        >
        <FormFieldError :id="errorId('email')" :message="errors.email" />
      </label>

      <label>
        Password
        <input
          :ref="(element) => setFieldRef('password', element)"
          v-model="form.password"
          type="password"
          autocomplete="current-password"
          :aria-invalid="Boolean(errors.password)"
          :aria-describedby="describedBy('password')"
          @input="handleInput"
          @blur="handleInput"
        >
        <FormFieldError :id="errorId('password')" :message="errors.password" />
      </label>

      <label class="checkbox-option">
        <input v-model="form.rememberMe" type="checkbox">
        Remember this browser session
      </label>

      <p v-if="status.message" class="form-status" :class="status.type" aria-live="polite">
        {{ status.message }}
      </p>

      <button type="submit">Login</button>
    </form>
    <p>Need an account? <RouterLink class="text-link" to="/register">Create one</RouterLink></p>
  </section>
</template>
