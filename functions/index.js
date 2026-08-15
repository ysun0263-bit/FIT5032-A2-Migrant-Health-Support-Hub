import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import { defineSecret, defineString } from 'firebase-functions/params'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import {
  EmailConfigurationError,
  sendBulkEmails,
  sendSingleEmail,
} from './services/emailService.js'
import {
  ValidationError,
  validEmailAddress,
  validateBulkEmailPayload,
  validateEmailPayload,
} from './utils/validation.js'

initializeApp()

const resendApiKey = defineSecret('RESEND_API_KEY')
const resendFromEmail = defineString('RESEND_FROM_EMAIL', {
  default: 'Migrant Health Support Hub <onboarding@resend.dev>',
})
const emailDeliveryMode = defineString('EMAIL_DELIVERY_MODE', { default: 'resend' })

async function requireActiveAdmin(uid) {
  let snapshot
  try {
    snapshot = await getFirestore().doc(`users/${uid}`).get()
  } catch {
    throw new HttpsError('internal', 'Administrator authorization could not be checked.')
  }

  const profile = snapshot.data()
  if (!snapshot.exists || profile?.role !== 'admin' || profile?.active !== true) {
    throw new HttpsError('permission-denied', 'An active administrator account is required.')
  }
}

async function resolveBulkRecipients(recipientUserIds) {
  let snapshots

  try {
    const database = getFirestore()
    snapshots = await database.getAll(
      ...recipientUserIds.map((userId) => database.doc(`users/${userId}`)),
    )
  } catch {
    throw new HttpsError('internal', 'Recipients could not be checked.')
  }

  const recipients = []
  const skippedResults = []

  snapshots.forEach((snapshot, index) => {
    const userId = recipientUserIds[index]
    const profile = snapshot.data()
    const email = typeof profile?.email === 'string' ? profile.email.trim().toLowerCase() : ''

    if (
      !snapshot.exists
      || profile?.active !== true
      || email.length > 254
      || !validEmailAddress(email)
    ) {
      skippedResults.push({ userId, status: 'skipped' })
      return
    }

    recipients.push({ userId, email })
  })

  return { recipients, skippedResults }
}

export const sendEmail = onCall(
  {
    region: 'australia-southeast1',
    secrets: [resendApiKey],
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in before sending email.')
    }

    await requireActiveAdmin(request.auth.uid)

    let email
    try {
      email = validateEmailPayload(request.data)
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new HttpsError('invalid-argument', error.message)
      }
      throw new HttpsError('invalid-argument', 'Email request is invalid.')
    }

    const logContext = {
      callerUid: request.auth.uid,
      recipientDomain: email.to.split('@').at(-1),
      attachmentFilename: email.attachment?.filename ?? null,
      attachmentBytes: email.attachment?.size ?? 0,
    }

    try {
      const result = await sendSingleEmail({
        ...email,
        mode: emailDeliveryMode.value(),
        apiKey: emailDeliveryMode.value() === 'mock' ? undefined : resendApiKey.value(),
        fromEmail: resendFromEmail.value(),
      })
      logger.info('Admin email accepted', { ...logContext, providerId: result.id, provider: result.provider })
      return { success: true, id: result.id }
    } catch (error) {
      if (error instanceof EmailConfigurationError) {
        logger.warn('Admin email configuration failure', { ...logContext, category: 'configuration' })
        throw new HttpsError('failed-precondition', 'Email delivery is not configured.')
      }

      logger.error('Admin email provider failure', { ...logContext, category: 'provider' })
      throw new HttpsError('internal', 'The email could not be sent. Please try again.')
    }
  },
)

export const sendBulkEmail = onCall(
  {
    region: 'australia-southeast1',
    secrets: [resendApiKey],
    timeoutSeconds: 120,
    memory: '256MiB',
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Sign in before sending bulk email.')
    }

    await requireActiveAdmin(request.auth.uid)

    let bulkEmail
    try {
      bulkEmail = validateBulkEmailPayload(request.data)
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new HttpsError('invalid-argument', error.message)
      }
      throw new HttpsError('invalid-argument', 'Bulk email request is invalid.')
    }

    const { recipients, skippedResults } = await resolveBulkRecipients(
      bulkEmail.recipientUserIds,
    )
    const mode = emailDeliveryMode.value()
    const delivery = await sendBulkEmails({
      recipients,
      subject: bulkEmail.subject,
      message: bulkEmail.message,
      attachment: bulkEmail.attachment,
      mode,
      apiKey: mode === 'mock' ? undefined : resendApiKey.value(),
      fromEmail: resendFromEmail.value(),
      concurrency: 4,
    })
    const summary = {
      requestedCount: bulkEmail.requestedCount,
      uniqueRecipientCount: bulkEmail.recipientUserIds.length,
      validRecipientCount: recipients.length,
      sentCount: delivery.sentCount,
      failedCount: delivery.failedCount,
      skippedCount: skippedResults.length,
      duplicateCount: bulkEmail.duplicateCount,
      results: [...delivery.results, ...skippedResults],
    }

    logger.info('Admin bulk email completed', {
      callerUid: request.auth.uid,
      requestedCount: summary.requestedCount,
      validRecipientCount: summary.validRecipientCount,
      sentCount: summary.sentCount,
      failedCount: summary.failedCount,
      skippedCount: summary.skippedCount,
      attachmentFilename: bulkEmail.attachment?.filename ?? null,
      attachmentBytes: bulkEmail.attachment?.size ?? 0,
      provider: mode,
    })

    return summary
  },
)
