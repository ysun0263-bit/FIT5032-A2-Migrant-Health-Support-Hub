import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import { defineSecret, defineString } from 'firebase-functions/params'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { EmailConfigurationError, sendSingleEmail } from './services/emailService.js'
import { ValidationError, validateEmailPayload } from './utils/validation.js'

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
