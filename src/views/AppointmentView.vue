<script setup>
import { computed, reactive, ref, watch } from 'vue'
import AppointmentCalendar from '../components/AppointmentCalendar.vue'
import AppointmentList from '../components/AppointmentList.vue'
import BookingConfirmation from '../components/BookingConfirmation.vue'
import FormFieldError from '../components/FormFieldError.vue'
import PlaceholderNotice from '../components/PlaceholderNotice.vue'
import SectionHeading from '../components/SectionHeading.vue'
import { useConnectivity } from '../composables/useConnectivity.js'
import { useAppointments } from '../composables/useAppointments.js'
import { currentUser } from '../stores/authStore.js'
import {
  buildSlotKey,
  generateDailySlots,
  getBookingWindow,
  isBookableDate,
  isOccupyingAppointmentStatus,
  isValidAppointmentTime,
  parseSlotKey,
} from '../utils/bookingSlots.js'
import { NOTES_MAX_LENGTH, validateAppointmentForm } from '../utils/validation.js'

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
const calendarRef = ref()
const submittedBooking = ref(null)
const hasSubmitted = ref(false)
const isSubmitting = ref(false)
const bookingMessage = ref('')
const bookingMessageType = ref('status')
const bookingWindow = getBookingWindow()
const { isOnline } = useConnectivity()
const {
  appointments,
  appointmentsLoading,
  appointmentsError,
  bookingSlots,
  bookingSlotsLoading,
  bookingSlotsError,
  addAppointment,
  deleteAppointment,
} = useAppointments()
const currentUserAppointments = computed(() =>
  appointments.value.filter((appointment) => appointment.userId === currentUser.value?.id),
)
const occupiedSlotKeys = computed(() => {
  const occupied = new Set(bookingSlots.value.map((slot) => slot.slotKey))

  currentUserAppointments.value.forEach((appointment) => {
    if (
      !appointment.slotKey
      && isOccupyingAppointmentStatus(appointment.status)
      && isValidAppointmentTime(appointment.preferredTime)
    ) {
      const legacySlotKey = `${appointment.preferredDate}__${appointment.preferredTime}`

      if (parseSlotKey(legacySlotKey)) {
        occupied.add(legacySlotKey)
      }
    }
  })

  return occupied
})
const dailySlots = computed(() => (
  form.preferredDate && isBookableDate(form.preferredDate)
    ? generateDailySlots(form.preferredDate, occupiedSlotKeys.value)
    : []
))
const calendarEvents = computed(() => {
  const ownAppointmentIds = new Set(currentUserAppointments.value.map(({ id }) => id))
  const slotEvents = bookingSlots.value.map((slot) => ({
    id: slot.slotKey,
    title: ownAppointmentIds.has(slot.appointmentId)
      ? `Your appointment at ${slot.time}`
      : `Booked at ${slot.time}`,
    date: slot.date,
    allDay: true,
  }))
  const legacyEvents = currentUserAppointments.value
    .filter((appointment) => (
      !appointment.slotKey
      && isOccupyingAppointmentStatus(appointment.status)
      && parseSlotKey(`${appointment.preferredDate}__${appointment.preferredTime}`)
    ))
    .map((appointment) => ({
      id: `legacy-${appointment.id}`,
      title: `Your legacy appointment at ${appointment.preferredTime}`,
      date: appointment.preferredDate,
      allDay: true,
    }))
  return [...slotEvents, ...legacyEvents]
})

watch(
  currentUser,
  (user) => {
    if (!user) {
      return
    }

    if (!form.fullName) {
      form.fullName = user.fullName
    }

    if (!form.email) {
      form.email = user.email
    }
  },
  { immediate: true },
)

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

  if (firstInvalidField === 'preferredDate') {
    calendarRef.value?.focusDate()
  } else if (firstInvalidField === 'preferredTime') {
    calendarRef.value?.focusTime()
  } else {
    fieldRefs[firstInvalidField]?.focus()
  }
}

function resetForm() {
  Object.assign(form, {
    fullName: currentUser.value?.fullName ?? '',
    email: currentUser.value?.email ?? '',
    preferredLanguage: '',
    supportTopic: '',
    preferredDate: form.preferredDate,
    preferredTime: '',
    contactPreference: '',
    notes: '',
  })
}

async function handleSubmit() {
  hasSubmitted.value = false
  bookingMessage.value = ''

  if (!isOnline.value) {
    bookingMessageType.value = 'alert'
    bookingMessage.value = 'Appointment booking requires an internet connection.'
    return
  }

  if (!validateField()) {
    focusFirstError()
    return
  }

  isSubmitting.value = true

  try {
    submittedBooking.value = await addAppointment(form)
    hasSubmitted.value = true
    bookingMessageType.value = 'status'
    bookingMessage.value = 'Your appointment has been booked.'
    resetForm()
  } catch (error) {
    hasSubmitted.value = false
    bookingMessageType.value = 'alert'
    bookingMessage.value = error?.code === 'slot-conflict'
      ? 'This time slot is no longer available. Please choose another time.'
      : 'The appointment could not be created. Please try again.'
    form.preferredTime = ''
  } finally {
    isSubmitting.value = false
  }
}

function handleInput() {
  hasSubmitted.value = false

  if (Object.keys(errors).length) {
    validateField()
  }
}

async function handleDelete(id) {
  const deleted = await deleteAppointment(id)

  if (deleted && submittedBooking.value?.id === id) {
    submittedBooking.value = null
  }
}

function handleDateSelection(date) {
  hasSubmitted.value = false
  submittedBooking.value = null
  bookingMessage.value = ''
  form.preferredDate = date
  form.preferredTime = ''

  if (date && !isBookableDate(date)) {
    errors.preferredDate = 'Choose a weekday from tomorrow through the next 60 days.'
  } else {
    delete errors.preferredDate
  }
}

function handleTimeSelection(time) {
  const slot = dailySlots.value.find((candidate) => candidate.time === time)

  if (!slot?.available) {
    return
  }

  hasSubmitted.value = false
  submittedBooking.value = null
  bookingMessage.value = ''
  form.preferredTime = time
  delete errors.preferredTime
}

watch(occupiedSlotKeys, () => {
  if (!form.preferredDate || !form.preferredTime || isSubmitting.value || hasSubmitted.value) {
    return
  }

  const selectedSlotKey = buildSlotKey(form.preferredDate, form.preferredTime)

  if (occupiedSlotKeys.value.has(selectedSlotKey)) {
    form.preferredTime = ''
    bookingMessageType.value = 'alert'
    bookingMessage.value = 'This time slot is no longer available. Please choose another time.'
  }
})
</script>

<template>
  <div class="page-stack">
    <section class="content-section page-stack">
      <SectionHeading
        level="h1"
        eyebrow="Appointments"
        title="Request support appointment"
        text="Choose a Melbourne appointment time and submit a support request protected by real-time conflict detection."
      />

      <PlaceholderNotice text="Do not enter sensitive medical details. Notes are for coursework demonstration only and are limited to 500 characters." />

      <p v-if="!isOnline" class="offline-feature-message" role="status">
        Appointment booking requires an internet connection. You can still review information
        already shown on this page.
      </p>

      <AppointmentCalendar
        ref="calendarRef"
        :selected-date="form.preferredDate"
        :selected-time="form.preferredTime"
        :slots="dailySlots"
        :events="calendarEvents"
        :min-date="bookingWindow.minDate"
        :max-date="bookingWindow.maxDate"
        :loading="bookingSlotsLoading"
        :error="bookingSlotsError"
        :date-error="errors.preferredDate"
        :time-error="errors.preferredTime"
        @select-date="handleDateSelection"
        @select-time="handleTimeSelection"
      />

      <form
        id="appointment-request-form"
        class="form-panel"
        aria-label="Appointment request"
        novalidate
        @submit.prevent="handleSubmit"
      >
        <div class="form-grid">
          <label>
            Full name (required)
            <input
              :ref="(element) => setFieldRef('fullName', element)"
              v-model="form.fullName"
              type="text"
              autocomplete="name"
              required
              placeholder="Example: Amina Hassan"
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
              placeholder="name@example.com"
              :aria-invalid="Boolean(errors.email)"
              :aria-describedby="describedBy('email')"
              @input="handleInput"
              @blur="handleInput"
            >
            <FormFieldError :id="errorId('email')" :message="errors.email" />
          </label>

          <label>
            Preferred language (required)
            <select
              :ref="(element) => setFieldRef('preferredLanguage', element)"
              v-model="form.preferredLanguage"
              required
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
            Support topic (required)
            <select
              :ref="(element) => setFieldRef('supportTopic', element)"
              v-model="form.supportTopic"
              required
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

        </div>

        <fieldset class="choice-group">
          <legend>Contact preference (required)</legend>
          <label v-for="preference in contactPreferences" :key="preference" class="radio-option">
            <input
              :ref="preference === contactPreferences[0] ? (element) => setFieldRef('contactPreference', element) : undefined"
              v-model="form.contactPreference"
              type="radio"
              name="contactPreference"
              :required="preference === contactPreferences[0]"
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

        <p
          v-if="bookingMessage"
          class="form-status"
          :class="{ error: bookingMessageType === 'alert' }"
          :role="bookingMessageType"
        >
          {{ bookingMessage }}
        </p>

        <button type="submit" :disabled="isSubmitting || !isOnline">
          {{ isSubmitting ? 'Booking appointment...' : 'Book appointment' }}
        </button>
      </form>

      <BookingConfirmation v-if="submittedBooking" :booking="submittedBooking" />
    </section>

    <AppointmentList
      :appointments="currentUserAppointments"
      :loading="appointmentsLoading"
      :error="appointmentsError"
      :action-disabled="!isOnline"
      disabled-message="Appointment changes require an internet connection."
      empty-text="You do not have any appointments yet."
      @delete="handleDelete"
    />
  </div>
</template>
