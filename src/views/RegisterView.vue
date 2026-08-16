<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import FormFieldError from '../components/FormFieldError.vue'
import PlaceholderNotice from '../components/PlaceholderNotice.vue'
import SectionHeading from '../components/SectionHeading.vue'
import { useConnectivity } from '../composables/useConnectivity.js'
import { register } from '../stores/authStore.js'
import { validateRegistrationForm } from '../utils/authValidation.js'

const router = useRouter()
const { isOnline } = useConnectivity()
const form = reactive({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acknowledgement: false,
})
const errors = reactive({})
const status = reactive({
  message: '',
  type: '',
})
const fieldRefs = {}
const fieldOrder = ['fullName', 'email', 'password', 'confirmPassword', 'acknowledgement']

function setFieldRef(field, element) {
  if (element) {
    fieldRefs[field] = element
  }
}

function errorId(field) {
  return `register-${field}-error`
}

function describedBy(field) {
  return errors[field] ? errorId(field) : undefined
}

function applyErrors(nextErrors) {
  Object.keys(errors).forEach((key) => delete errors[key])
  Object.assign(errors, nextErrors)
}

function validate() {
  const nextErrors = validateRegistrationForm(form, [])
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

  if (!isOnline.value) {
    status.message = 'Account registration requires an internet connection.'
    status.type = 'error'
    return
  }

  if (!validate()) {
    focusFirstError()
    return
  }

  try {
    await register(form)
    status.message = 'Registration successful. Redirecting to your profile.'
    status.type = 'success'
    router.push('/profile')
  } catch (error) {
    status.message = error.message
    status.type = 'error'
  }
}
</script>

<template>
  <section class="content-section narrow page-stack">
    <SectionHeading
      level="h1"
      eyebrow="Register"
      title="Create an account"
      text="Create a coursework demonstration account. Registration always creates a standard user role."
    />

    <PlaceholderNotice text="Account authentication is provided by Firebase. Profile details are stored in Cloud Firestore; do not enter sensitive health information." />

    <p v-if="!isOnline" class="offline-feature-message" role="status">
      Account registration requires an internet connection. Nothing will be queued locally.
    </p>

    <form class="form-panel" aria-label="Registration form" novalidate @submit.prevent="handleSubmit">
      <label>
        Full name (required)
        <input
          :ref="(element) => setFieldRef('fullName', element)"
          v-model="form.fullName"
          type="text"
          autocomplete="name"
          required
          :aria-invalid="Boolean(errors.fullName)"
          :aria-describedby="describedBy('fullName')"
          @input="handleInput"
          @blur="handleInput"
        >
        <FormFieldError :id="errorId('fullName')" :message="errors.fullName" />
      </label>

      <label>
        Email (required)
        <input
          :ref="(element) => setFieldRef('email', element)"
          v-model="form.email"
          type="email"
          autocomplete="email"
          required
          :aria-invalid="Boolean(errors.email)"
          :aria-describedby="describedBy('email')"
          @input="handleInput"
          @blur="handleInput"
        >
        <FormFieldError :id="errorId('email')" :message="errors.email" />
      </label>

      <label>
        Password (required)
        <input
          :ref="(element) => setFieldRef('password', element)"
          v-model="form.password"
          type="password"
          autocomplete="new-password"
          required
          :aria-invalid="Boolean(errors.password)"
          :aria-describedby="errors.password ? errorId('password') : 'password-help'"
          @input="handleInput"
          @blur="handleInput"
        >
        <span id="password-help" class="field-help">
          Use at least 8 characters with uppercase, lowercase, and a number.
        </span>
        <FormFieldError :id="errorId('password')" :message="errors.password" />
      </label>

      <label>
        Confirm password (required)
        <input
          :ref="(element) => setFieldRef('confirmPassword', element)"
          v-model="form.confirmPassword"
          type="password"
          autocomplete="new-password"
          required
          :aria-invalid="Boolean(errors.confirmPassword)"
          :aria-describedby="describedBy('confirmPassword')"
          @input="handleInput"
          @blur="handleInput"
        >
        <FormFieldError :id="errorId('confirmPassword')" :message="errors.confirmPassword" />
      </label>

      <label class="checkbox-option">
        <input
          :ref="(element) => setFieldRef('acknowledgement', element)"
          v-model="form.acknowledgement"
          type="checkbox"
          required
          :aria-invalid="Boolean(errors.acknowledgement)"
          :aria-describedby="describedBy('acknowledgement')"
          @change="handleInput"
        >
        I understand this account is for FIT5032 coursework demonstration and must not contain
        sensitive health information.
      </label>
      <FormFieldError :id="errorId('acknowledgement')" :message="errors.acknowledgement" />

      <p
        v-if="status.message"
        class="form-status"
        :class="status.type"
        :role="status.type === 'error' ? 'alert' : 'status'"
      >
        {{ status.message }}
      </p>

      <button type="submit" :disabled="!isOnline">Create account</button>
    </form>
  </section>
</template>
