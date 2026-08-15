<script setup>
import { computed, nextTick, reactive, ref } from 'vue'
import {
  EMAIL_ATTACHMENT_ACCEPT,
  sendAdminEmail,
  sendBulkAdminEmail,
  validateBulkEmailForm,
  validateEmailAttachment,
  validateEmailForm,
} from '../services/emailService.js'

const props = defineProps({
  selectedUsers: { type: Array, default: () => [] },
})
const emit = defineEmits(['clear-selection'])

const mode = ref('single')
const form = reactive({ to: '', subject: '', message: '' })
const errors = reactive({})
const attachment = ref()
const fileInput = ref()
const sending = ref(false)
const status = ref({ type: '', message: '' })
const fieldRefs = {}
const selectedCount = computed(() => props.selectedUsers.length)
const selectedPreview = computed(() => props.selectedUsers.slice(0, 3))
const remainingCount = computed(() => Math.max(0, selectedCount.value - selectedPreview.value.length))
const sendLabel = computed(() => {
  if (mode.value === 'single') return sending.value ? 'Sending...' : 'Send Email'
  return sending.value
    ? `Sending to ${selectedCount.value} users...`
    : `Send to ${selectedCount.value} users`
})

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

function changeMode(nextMode) {
  mode.value = nextMode
  clearErrors()
  status.value = { type: '', message: '' }
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

async function focusFirstError() {
  await nextTick()
  const fieldOrder = mode.value === 'bulk'
    ? ['recipients', 'subject', 'message', 'attachment']
    : ['to', 'subject', 'message', 'attachment']
  const firstInvalidField = fieldOrder.find((field) => errors[field])
  fieldRefs[firstInvalidField]?.focus()
}

async function handleSubmit() {
  if (sending.value) return

  clearErrors()
  status.value = { type: '', message: '' }
  const recipientUserIds = props.selectedUsers.map((user) => user.uid ?? user.id).filter(Boolean)
  const validation = mode.value === 'bulk'
    ? validateBulkEmailForm({ recipientUserIds, ...form, attachment: attachment.value })
    : validateEmailForm({ ...form, attachment: attachment.value })
  Object.assign(errors, validation)

  if (Object.keys(errors).length) {
    status.value = { type: 'error', message: 'Review the highlighted email fields.' }
    await focusFirstError()
    return
  }

  sending.value = true
  try {
    if (mode.value === 'bulk') {
      const result = await sendBulkAdminEmail({
        recipientUserIds,
        subject: form.subject,
        message: form.message,
        attachment: attachment.value,
      })
      const parts = [`${result.sentCount} sent`]
      if (result.failedCount) parts.push(`${result.failedCount} failed`)
      if (result.skippedCount) parts.push(`${result.skippedCount} skipped`)
      status.value = {
        type: result.failedCount || result.skippedCount ? 'warning' : 'success',
        message: result.failedCount || result.skippedCount
          ? `${parts.join(', ')}.`
          : `${result.sentCount} emails sent successfully.`,
      }
      emit('clear-selection')
    } else {
      const result = await sendAdminEmail({ ...form, attachment: attachment.value })
      status.value = {
        type: 'success',
        message: `Email sent successfully. Reference: ${result.id}`,
      }
      form.to = ''
    }
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
      <h2 id="admin-email-title">Send email</h2>
      <p>
        Send a single or bulk plain-text message with an optional attachment. Do not include
        sensitive health information in this coursework demonstration.
      </p>
    </div>

    <form class="form-grid" novalidate @submit.prevent="handleSubmit">
      <fieldset class="full-width-field email-mode-fieldset">
        <legend>Email mode</legend>
        <div class="email-mode-options">
          <label>
            <input
              type="radio"
              name="email-mode"
              value="single"
              :checked="mode === 'single'"
              :disabled="sending"
              @change="changeMode('single')"
            />
            Single Email
          </label>
          <label>
            <input
              :ref="(element) => setFieldRef('recipients', element)"
              type="radio"
              name="email-mode"
              value="bulk"
              :checked="mode === 'bulk'"
              :disabled="sending"
              @change="changeMode('bulk')"
            />
            Bulk Email
          </label>
        </div>
      </fieldset>

      <label v-if="mode === 'single'">
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

      <div
        v-else
        class="bulk-recipient-summary full-width-field"
        :class="{ invalid: errors.recipients }"
        :aria-describedby="errors.recipients ? 'bulk-recipients-error' : 'bulk-recipients-help'"
      >
        <div>
          <strong>{{ selectedCount }} users selected</strong>
          <ul v-if="selectedPreview.length" id="bulk-recipients-help">
            <li v-for="user in selectedPreview" :key="user.uid ?? user.id">
              {{ user.fullName }}
            </li>
            <li v-if="remainingCount">+ {{ remainingCount }} more</li>
          </ul>
          <span v-else id="bulk-recipients-help" class="field-help">
            Select active users in the Users table.
          </span>
        </div>
        <button
          type="button"
          class="button secondary"
          :disabled="!selectedCount || sending"
          @click="$emit('clear-selection')"
        >
          Clear selection
        </button>
        <span
          v-if="errors.recipients"
          id="bulk-recipients-error"
          class="field-error full-width-field"
          role="alert"
        >
          {{ errors.recipients }}
        </span>
      </div>

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
        <button
          type="submit"
          class="button primary"
          :disabled="sending"
          :aria-label="mode === 'bulk'
            ? `Send bulk email to ${selectedCount} selected users`
            : 'Send single email'"
        >
          {{ sendLabel }}
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
