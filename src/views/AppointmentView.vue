<script setup>
import { reactive, ref } from 'vue'
import AppointmentList from '../components/AppointmentList.vue'
import BookingConfirmation from '../components/BookingConfirmation.vue'
import FormFieldError from '../components/FormFieldError.vue'
import PlaceholderNotice from '../components/PlaceholderNotice.vue'
import SectionHeading from '../components/SectionHeading.vue'
import { useAppointments } from '../composables/useAppointments'
import { formatLocalDate } from '../utils/date'
import { NOTES_MAX_LENGTH, validateAppointmentForm } from '../utils/validation'

const languageOptions = ['English', 'Arabic', 'Mandarin', 'Hindi', 'Vietnamese', 'Dari']
const supportTopics = [
  'Health resource guidance',
  'Finding a GP',
  'Interpreter support',
  'Mental health pathway',
  'Women\'s health support',
  'Medication or pharmacy question',
]
const contactPreferences = ['Email', 'Phone call', 'SMS']
const fieldOrder = [
  'fullName',
  'email',
  'preferredLanguage',
  'supportTopic',
  'preferredDate',
  'preferredTime',
  'contactPreference',
  'notes',
]

const form = reactive({
  fullName: '',
  email: '',
  preferredLanguage: '',
  supportTopic: '',
  preferredDate: '',
  preferredTime: '',
  contactPreference: '',
  notes: '',
})

const errors = reactive({})
const fieldRefs = {}
const submittedBooking = ref(null)
const hasSubmitted = ref(false)
const { appointments, addAppointment, deleteAppointment } = useAppointments()

function setFieldRef(field, element) {
  if (element) {
    fieldRefs[field] = element
  }
}

function errorId(field) {
  return `${field}-error`
}

function describedBy(field) {
  return errors[field] ? errorId(field) : undefined
}

function validateField() {
  const nextErrors = validateAppointmentForm(form)
  Object.keys(errors).forEach((key) => {
    delete errors[key]
  })
  Object.assign(errors, nextErrors)
  return Object.keys(nextErrors).length === 0
}

function focusFirstError() {
  const firstInvalidField = fieldOrder.find((field) => errors[field])
  fieldRefs[firstInvalidField]?.focus()
}

function resetForm() {
  Object.assign(form, {
    fullName: '',
    email: '',
    preferredLanguage: '',
    supportTopic: '',
    preferredDate: '',
    preferredTime: '',
    contactPreference: '',
    notes: '',
  })
}

function handleSubmit() {
  hasSubmitted.value = false

  if (!validateField()) {
    focusFirstError()
    return
  }

  submittedBooking.value = addAppointment(form)
  hasSubmitted.value = true
  resetForm()
}

function handleInput() {
  if (Object.keys(errors).length) {
    validateField()
  }
}

function handleDelete(id) {
  deleteAppointment(id)

  if (submittedBooking.value?.id === id) {
    submittedBooking.value = null
  }
}
</script>

<template>
  <div class="page-stack">
    <section class="content-section page-stack">
      <SectionHeading
        level="h1"
        eyebrow="Appointments"
        title="Request support appointment"
        text="Submit a demonstration booking request with validation. Bookings are saved only in this browser's Local Storage and are not linked to a secure user account."
      />

      <PlaceholderNotice text="Do not enter sensitive medical details. Notes are for coursework demonstration only and are limited to 500 characters." />

      <form class="form-panel" aria-label="Appointment request" novalidate @submit.prevent="handleSubmit">
        <div class="form-grid">
          <label>
            Full name
            <input
              :ref="(element) => setFieldRef('fullName', element)"
              v-model="form.fullName"
              type="text"
              placeholder="Example: Amina Hassan"
              :aria-invalid="Boolean(errors.fullName)"
              :aria-describedby="describedBy('fullName')"
              @input="handleInput"
              @blur="handleInput"
            >
            <FormFieldError :id="errorId('fullName')" :message="errors.fullName" />
          </label>

          <label>
            Email
            <input
              :ref="(element) => setFieldRef('email', element)"
              v-model="form.email"
              type="email"
              placeholder="name@example.com"
              :aria-invalid="Boolean(errors.email)"
              :aria-describedby="describedBy('email')"
              @input="handleInput"
              @blur="handleInput"
            >
            <FormFieldError :id="errorId('email')" :message="errors.email" />
          </label>

          <label>
            Preferred language
            <select
              :ref="(element) => setFieldRef('preferredLanguage', element)"
              v-model="form.preferredLanguage"
              :aria-invalid="Boolean(errors.preferredLanguage)"
              :aria-describedby="describedBy('preferredLanguage')"
              @change="handleInput"
            >
              <option value="">Select language</option>
              <option v-for="language in languageOptions" :key="language" :value="language">
                {{ language }}
              </option>
            </select>
            <FormFieldError
              :id="errorId('preferredLanguage')"
              :message="errors.preferredLanguage"
            />
          </label>

          <label>
            Support topic
            <select
              :ref="(element) => setFieldRef('supportTopic', element)"
              v-model="form.supportTopic"
              :aria-invalid="Boolean(errors.supportTopic)"
              :aria-describedby="describedBy('supportTopic')"
              @change="handleInput"
            >
              <option value="">Select topic</option>
              <option v-for="topic in supportTopics" :key="topic" :value="topic">
                {{ topic }}
              </option>
            </select>
            <FormFieldError :id="errorId('supportTopic')" :message="errors.supportTopic" />
          </label>

          <label>
            Preferred date
            <input
              :ref="(element) => setFieldRef('preferredDate', element)"
              v-model="form.preferredDate"
              type="date"
              :min="formatLocalDate()"
              :aria-invalid="Boolean(errors.preferredDate)"
              :aria-describedby="describedBy('preferredDate')"
              @input="handleInput"
              @blur="handleInput"
            >
            <FormFieldError :id="errorId('preferredDate')" :message="errors.preferredDate" />
          </label>

          <label>
            Preferred time
            <input
              :ref="(element) => setFieldRef('preferredTime', element)"
              v-model="form.preferredTime"
              type="time"
              :aria-invalid="Boolean(errors.preferredTime)"
              :aria-describedby="describedBy('preferredTime')"
              @input="handleInput"
              @blur="handleInput"
            >
            <FormFieldError :id="errorId('preferredTime')" :message="errors.preferredTime" />
          </label>
        </div>

        <fieldset class="choice-group">
          <legend>Contact preference</legend>
          <label v-for="preference in contactPreferences" :key="preference" class="radio-option">
            <input
              :ref="preference === contactPreferences[0] ? (element) => setFieldRef('contactPreference', element) : undefined"
              v-model="form.contactPreference"
              type="radio"
              name="contactPreference"
              :value="preference"
              :aria-invalid="Boolean(errors.contactPreference)"
              :aria-describedby="describedBy('contactPreference')"
              @change="handleInput"
            >
            {{ preference }}
          </label>
          <FormFieldError
            :id="errorId('contactPreference')"
            :message="errors.contactPreference"
          />
        </fieldset>

        <label>
          Notes
          <textarea
            :ref="(element) => setFieldRef('notes', element)"
            v-model="form.notes"
            rows="4"
            :maxlength="NOTES_MAX_LENGTH + 50"
            placeholder="Optional. Avoid sensitive medical details."
            :aria-invalid="Boolean(errors.notes)"
            :aria-describedby="errors.notes ? errorId('notes') : 'notes-help'"
            @input="handleInput"
            @blur="handleInput"
          ></textarea>
          <span id="notes-help" class="field-help">
            {{ form.notes.trim().length }} / {{ NOTES_MAX_LENGTH }} characters. Do not include
            sensitive medical information.
          </span>
          <FormFieldError :id="errorId('notes')" :message="errors.notes" />
        </label>

        <button type="submit" :disabled="hasSubmitted">Submit demonstration booking</button>
      </form>

      <BookingConfirmation v-if="submittedBooking" :booking="submittedBooking" />
    </section>

    <AppointmentList :appointments="appointments" @delete="handleDelete" />
  </div>
</template>
