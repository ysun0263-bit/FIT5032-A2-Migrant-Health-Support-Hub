import { Resend } from 'resend'

export class EmailConfigurationError extends Error {}

function mockResult() {
  return {
    id: `mock-${Date.now().toString(36)}`,
    provider: 'mock',
  }
}

export async function sendSingleEmail({
  to,
  subject,
  message,
  attachment,
  mode = process.env.EMAIL_DELIVERY_MODE || 'resend',
  apiKey,
  fromEmail = process.env.RESEND_FROM_EMAIL,
}) {
  if (mode === 'mock') {
    return mockResult()
  }
  if (mode !== 'resend') {
    throw new EmailConfigurationError('Email delivery mode is not configured.')
  }
  if (!apiKey || !fromEmail) {
    throw new EmailConfigurationError('Email provider configuration is incomplete.')
  }

  const resend = new Resend(apiKey)
  const response = await resend.emails.send({
    from: fromEmail,
    to: [to],
    subject,
    text: message,
    attachments: attachment
      ? [{ filename: attachment.filename, content: attachment.base64 }]
      : undefined,
  })

  if (response.error || !response.data?.id) {
    throw new Error('The email provider did not accept the message.')
  }

  return { id: response.data.id, provider: 'resend' }
}

export async function sendBulkEmails({
  recipients,
  subject,
  message,
  attachment,
  mode,
  apiKey,
  fromEmail,
  concurrency = 4,
  deliver = sendSingleEmail,
}) {
  const results = new Array(recipients.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < recipients.length) {
      const index = nextIndex
      nextIndex += 1
      const recipient = recipients[index]

      try {
        await deliver({
          to: recipient.email,
          subject,
          message,
          attachment,
          mode,
          apiKey,
          fromEmail,
        })
        results[index] = { userId: recipient.userId, status: 'sent' }
      } catch {
        results[index] = { userId: recipient.userId, status: 'failed' }
      }
    }
  }

  const workerCount = Math.min(Math.max(1, concurrency), recipients.length)
  await Promise.all(Array.from({ length: workerCount }, () => worker()))

  return {
    sentCount: results.filter(({ status }) => status === 'sent').length,
    failedCount: results.filter(({ status }) => status === 'failed').length,
    results,
  }
}
