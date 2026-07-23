import { isBeforeToday } from './date.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const NOTES_MAX_LENGTH = 500

export function validateAppointmentForm(form) {
  const errors = {}
  const fullName = form.fullName.trim()
  const email = form.email.trim()
  const notes = form.notes.trim()

  if (!fullName) {
    errors.fullName = 'Enter your full name.'
  } else if (fullName.length < 2) {
    errors.fullName = 'Name must be at least 2 characters.'
  }

  if (!email) {
    errors.email = 'Enter your email address.'
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address, such as name@example.com.'
  }

  if (!form.preferredLanguage) {
    errors.preferredLanguage = 'Select a preferred language.'
  }

  if (!form.supportTopic) {
    errors.supportTopic = 'Select a support topic.'
  }

  if (!form.preferredDate) {
    errors.preferredDate = 'Select a preferred date.'
  } else if (isBeforeToday(form.preferredDate)) {
    errors.preferredDate = 'Choose today or a future date.'
  }

  if (!form.preferredTime) {
    errors.preferredTime = 'Select a preferred time.'
  }

  if (!form.contactPreference) {
    errors.contactPreference = 'Select how you prefer to be contacted.'
  }

  if (notes.length > NOTES_MAX_LENGTH) {
    errors.notes = `Notes must be ${NOTES_MAX_LENGTH} characters or fewer.`
  }

  return errors
}
