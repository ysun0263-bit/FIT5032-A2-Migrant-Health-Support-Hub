<script setup>
import { computed, ref } from 'vue'
import 'temporal-polyfill/global'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/vue3/daygrid'
import interactionPlugin from '@fullcalendar/vue3/interaction'
import classicThemePlugin from '@fullcalendar/vue3/themes/classic'
import '@fullcalendar/vue3/skeleton.css'
import '@fullcalendar/vue3/themes/classic/theme.css'
import '@fullcalendar/vue3/themes/classic/palette.css'
import FormFieldError from './FormFieldError.vue'
import {
  BOOKING_TIME_ZONE,
  addCalendarDays,
  isBookableDate,
} from '../utils/bookingSlots.js'

const props = defineProps({
  selectedDate: { type: String, default: '' },
  selectedTime: { type: String, default: '' },
  slots: { type: Array, required: true },
  events: { type: Array, required: true },
  minDate: { type: String, required: true },
  maxDate: { type: String, required: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  dateError: { type: String, default: '' },
  timeError: { type: String, default: '' },
})

const emit = defineEmits(['select-date', 'select-time'])
const dateInput = ref()
const slotPicker = ref()

defineExpose({
  focusDate: () => dateInput.value?.focus(),
  focusTime: () => slotPicker.value?.querySelector('button:not(:disabled)')?.focus(),
})

const availableCount = computed(() => props.slots.filter((slot) => slot.available).length)
const availabilityMessage = computed(() => {
  if (props.loading) {
    return 'Loading appointment availability.'
  }

  if (!props.selectedDate) {
    return 'Choose a date to view appointment times.'
  }

  return `${availableCount.value} appointment times are available for ${props.selectedDate}.`
})

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin, classicThemePlugin],
  initialView: 'dayGridMonth',
  timeZone: BOOKING_TIME_ZONE,
  firstDay: 1,
  weekends: false,
  height: 'auto',
  headerToolbar: {
    start: 'prev,next today',
    center: 'title',
    end: '',
  },
  validRange: {
    start: props.minDate,
    end: addCalendarDays(props.maxDate, 1),
  },
  businessHours: {
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: '09:00',
    endTime: '17:00',
  },
  events: props.events,
  dateClick: ({ dateStr }) => {
    if (isBookableDate(dateStr)) {
      emit('select-date', dateStr)
    }
  },
}))
</script>

<template>
  <section class="appointment-calendar" aria-labelledby="calendar-heading">
    <div class="section-heading compact-heading">
      <p class="eyebrow">Interactive calendar</p>
      <h2 id="calendar-heading">Choose an appointment date</h2>
      <p>
        Appointments use Melbourne time. Weekdays from tomorrow through the next 60 days are
        available. Use the date field below for a complete keyboard alternative.
      </p>
    </div>

    <div class="calendar-frame" role="region" aria-label="Appointment calendar">
      <FullCalendar :options="calendarOptions" />
    </div>

    <label class="calendar-date-control">
      Selected date (required)
      <input
        ref="dateInput"
        :value="selectedDate"
        type="date"
        required
        :min="minDate"
        :max="maxDate"
        :aria-invalid="Boolean(dateError)"
        :aria-describedby="dateError ? 'preferredDate-error' : undefined"
        @input="$emit('select-date', $event.target.value)"
      >
      <FormFieldError id="preferredDate-error" :message="dateError" />
    </label>

    <p class="field-help">Business timezone: Australia/Melbourne.</p>
    <p v-if="error" class="form-status error" role="alert">{{ error }}</p>
    <p class="availability-status" role="status" aria-live="polite">
      {{ availabilityMessage }}
    </p>

    <fieldset
      v-if="selectedDate"
      ref="slotPicker"
      class="slot-picker"
      :disabled="loading"
      :aria-describedby="timeError ? 'preferredTime-error' : undefined"
    >
      <legend>Available times for {{ selectedDate }} (required)</legend>
      <div class="slot-grid">
        <button
          v-for="slot in slots"
          :key="slot.slotKey"
          type="button"
          class="slot-button"
          :class="{ selected: selectedTime === slot.time, booked: !slot.available }"
          :disabled="!slot.available"
          :aria-pressed="slot.available ? selectedTime === slot.time : undefined"
          :aria-label="`${slot.time}, ${slot.available ? 'available' : 'booked'}`"
          @click="$emit('select-time', slot.time)"
        >
          <strong>{{ slot.time }}</strong>
          <span>{{ slot.available ? 'Available' : 'Booked' }}</span>
        </button>
      </div>
      <FormFieldError id="preferredTime-error" :message="timeError" />
    </fieldset>
  </section>
</template>
