<script setup>
import { nextTick, reactive, ref } from 'vue'
import {
  EMAIL_ATTACHMENT_ACCEPT,
  sendAdminEmail,
  validateEmailAttachment,
  validateEmailForm,
} from '../services/emailService.js'

const form = reactive({ to: '', subject: '', message: '' })
const errors = reactive({})
const attachment = ref()
const fileInput = ref()
const sending = ref(false)
const status = ref({ type: '', message: '' })
const fieldRefs = {}
const fieldOrder = ['to', 'subject', 'message', 'attachment']

function setFieldRef(field, element) {
  if (element) fieldRefs[field] = element
}

function setFileInput(element) {
  fileInput.value = element
  setFieldRef('attachment', element)
}

function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key])
}

function setAttachment(file) {
  status.value = { type: '', message: '' }
  delete errors.attachment

  const error = validateEmailAttachment(file)
  if (error) {
    errors.attachment = error
    attachment.value = undefined
    if (fileInput.value) fileInput.value.value = ''
    return
  }
  attachment.value = file
}

function handleFile(event) {
  setAttachment(event.target.files?.[0])
}

function removeAttachment() {
  attachment.value = undefined
  delete errors.attachment
  if (fileInput.value) fileInput.value.value = ''
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} bytes`
  return `${(bytes / 1024).toFixed(1)} KB`
}

async function handleSubmit() {
  clearErrors()
  status.value = { type: '', message: '' }
  Object.assign(errors, validateEmailForm({ ...form, attachment: attachment.value }))

  if (Object.keys(errors).length) {
    status.value = { type: 'error', message: 'Review the highlighted email fields.' }
    await nextTick()
    const firstInvalidField = fieldOrder.find((field) => errors[field])
    fieldRefs[firstInvalidField]?.focus()
    return
  }

  sending.value = true
  try {
    const result = await sendAdminEmail({ ...form, attachment: attachment.value })
    status.value = {
      type: 'success',
      message: `Email sent successfully. Reference: ${result.id}`,
    }
    form.to = ''
    form.subject = ''
    form.message = ''
    removeAttachment()
  } catch (error) {
    status.value = { type: 'error', message: error.message }
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <section class="form-panel admin-email-panel" aria-labelledby="admin-email-title">
    <div>
      <p class="card-tag">Admin email</p>
      <h2 id="admin-email-title">Send a single email</h2>
      <p>
        Send one plain-text message with an optional attachment. Do not include sensitive health
        information in this coursework demonstration.
      </p>
    </div>

    <form class="form-grid" novalidate @submit.prevent="handleSubmit">
      <label>
        Recipient Email (required)
        <input
          :ref="(element) => setFieldRef('to', element)"
          v-model="form.to"
          type="email"
          autocomplete="email"
          required
          :aria-invalid="Boolean(errors.to)"
          :aria-describedby="errors.to ? 'email-to-error' : undefined"
        />
        <span v-if="errors.to" id="email-to-error" class="field-error" role="alert">
          {{ errors.to }}
        </span>
      </label>

      <label>
        Subject (required)
        <input
          :ref="(element) => setFieldRef('subject', element)"
          v-model="form.subject"
          type="text"
          maxlength="150"
          required
          :aria-invalid="Boolean(errors.subject)"
          :aria-describedby="errors.subject ? 'email-subject-error' : undefined"
        />
        <span v-if="errors.subject" id="email-subject-error" class="field-error" role="alert">
          {{ errors.subject }}
        </span>
      </label>

      <label class="full-width-field">
        Message (required)
        <textarea
          :ref="(element) => setFieldRef('message', element)"
          v-model="form.message"
          rows="7"
          maxlength="10000"
          required
          :aria-invalid="Boolean(errors.message)"
          :aria-describedby="errors.message ? 'email-message-error' : 'email-message-help'"
        />
        <span id="email-message-help" class="field-help">
          {{ form.message.length }} / 10,000 characters. Plain text only.
        </span>
        <span v-if="errors.message" id="email-message-error" class="field-error" role="alert">
          {{ errors.message }}
        </span>
      </label>

      <label class="full-width-field">
        Attachment (optional)
        <input
          :ref="setFileInput"
          type="file"
          :accept="EMAIL_ATTACHMENT_ACCEPT"
          :aria-invalid="Boolean(errors.attachment)"
          :aria-describedby="errors.attachment ? 'email-attachment-error' : 'email-attachment-help'"
          @change="handleFile"
        />
        <span id="email-attachment-help" class="field-help">
          One PDF, PNG, JPEG, CSV, or TXT file, up to 3 MB.
        </span>
        <span
          v-if="errors.attachment"
          id="email-attachment-error"
          class="field-error"
          role="alert"
        >
          {{ errors.attachment }}
        </span>
      </label>

      <div v-if="attachment" class="attachment-summary full-width-field">
        <div>
          <strong>{{ attachment.name }}</strong>
          <span>{{ formatBytes(attachment.size) }}</span>
        </div>
        <button type="button" class="button secondary" @click="removeAttachment">
          Remove attachment
        </button>
      </div>

      <div class="full-width-field action-row">
        <button type="submit" class="button primary" :disabled="sending">
          {{ sending ? 'Sending...' : 'Send Email' }}
        </button>
      </div>

      <p
        v-if="status.message"
        class="form-status full-width-field"
        :class="status.type"
        :role="status.type === 'error' ? 'alert' : 'status'"
      >
        {{ status.message }}
      </p>
    </form>
  </section>
</template>
