const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const FULL_NAME_MAX_LENGTH = 80

export function normaliseEmail(email) {
  return email.trim().toLowerCase()
}

export function validateRegistrationForm(form, users) {
  const errors = {}
  const fullName = form.fullName.trim()
  const email = normaliseEmail(form.email)

  if (!fullName) {
    errors.fullName = 'Enter your full name.'
  } else if (fullName.length < 2) {
    errors.fullName = 'Name must be at least 2 characters.'
  } else if (fullName.length > FULL_NAME_MAX_LENGTH) {
    errors.fullName = `Name must be ${FULL_NAME_MAX_LENGTH} characters or fewer.`
  }

  if (!email) {
    errors.email = 'Enter your email address.'
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address.'
  } else if (users.some((user) => normaliseEmail(user.email) === email)) {
    errors.email = 'An account with this email already exists.'
  }

  if (!form.password) {
    errors.password = 'Enter a password.'
  } else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  } else if (!/[A-Z]/.test(form.password)) {
    errors.password = 'Password must include at least one uppercase letter.'
  } else if (!/[a-z]/.test(form.password)) {
    errors.password = 'Password must include at least one lowercase letter.'
  } else if (!/\d/.test(form.password)) {
    errors.password = 'Password must include at least one number.'
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Confirm your password.'
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Passwords must match.'
  }

  if (!form.acknowledgement) {
    errors.acknowledgement = 'Confirm that you understand this is a coursework demo.'
  }

  return errors
}

export function validateLoginForm(form) {
  const errors = {}
  const email = normaliseEmail(form.email)

  if (!email) {
    errors.email = 'Enter your email address.'
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!form.password) {
    errors.password = 'Enter your password.'
  }

  return errors
}
