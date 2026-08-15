import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { firebaseAuth, firestoreDb } from '../firebase/firebase.js'
import {
  buildSlotKey,
  isBookableDate,
  isOccupyingAppointmentStatus,
} from '../utils/bookingSlots.js'
import { timestampToIso } from '../utils/timestamps.js'

export const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled']

export class AppointmentConflictError extends Error {
  constructor() {
    super('This time slot is no longer available. Please choose another time.')
    this.name = 'AppointmentConflictError'
    this.code = 'slot-conflict'
  }
}

function normaliseAppointment(snapshot) {
  const data = snapshot.data()

  return {
    id: snapshot.id,
    userId: data.userId,
    fullName: data.fullName,
    email: data.email,
    preferredLanguage: data.language,
    language: data.language,
    supportTopic: data.supportTopic,
    preferredDate: data.preferredDate,
    preferredTime: data.preferredTime,
    slotKey: data.slotKey ?? '',
    contactPreference: data.contactPreference,
    notes: data.notes ?? '',
    status: data.status,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  }
}

function normaliseBookingSlot(snapshot) {
  const data = snapshot.data()
  return {
    slotKey: snapshot.id,
    appointmentId: data.appointmentId,
    date: data.date,
    time: data.time,
  }
}

function subscribe(source, onData, onError) {
  return onSnapshot(
    source,
    (snapshot) => {
      const appointments = snapshot.docs
        .map(normaliseAppointment)
        .sort(
          (left, right) =>
            right.createdAt.localeCompare(left.createdAt) || left.id.localeCompare(right.id),
        )
      onData(appointments)
    },
    onError,
  )
}

export async function createAppointment(form) {
  const firebaseUser = firebaseAuth.currentUser

  if (!firebaseUser) {
    throw new Error('Login is required before creating an appointment.')
  }

  if (!isBookableDate(form.preferredDate)) {
    throw new Error('Choose a future weekday within the booking window.')
  }

  const slotKey = buildSlotKey(form.preferredDate, form.preferredTime)
  const reference = doc(collection(firestoreDb, 'appointments'))
  const slotReference = doc(firestoreDb, 'bookingSlots', slotKey)
  const appointment = {
    id: reference.id,
    userId: firebaseUser.uid,
    fullName: form.fullName.trim(),
    email: form.email.trim().toLowerCase(),
    language: form.preferredLanguage,
    supportTopic: form.supportTopic,
    preferredDate: form.preferredDate,
    preferredTime: form.preferredTime,
    slotKey,
    contactPreference: form.contactPreference,
    notes: form.notes.trim(),
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await runTransaction(firestoreDb, async (transaction) => {
    const existingSlot = await transaction.get(slotReference)

    if (existingSlot.exists()) {
      throw new AppointmentConflictError()
    }

    transaction.set(reference, appointment)
    transaction.set(slotReference, {
      slotKey,
      appointmentId: reference.id,
      date: appointment.preferredDate,
      time: appointment.preferredTime,
      createdAt: serverTimestamp(),
    })
  })

  return {
    ...appointment,
    preferredLanguage: appointment.language,
    createdAt: '',
    updatedAt: '',
  }
}

export function subscribeToUserAppointments(userId, onData, onError) {
  return subscribe(
    query(collection(firestoreDb, 'appointments'), where('userId', '==', userId)),
    onData,
    onError,
  )
}

export function subscribeToAllAppointments(onData, onError) {
  return subscribe(collection(firestoreDb, 'appointments'), onData, onError)
}

export function subscribeToBookingSlots(onData, onError) {
  return onSnapshot(
    collection(firestoreDb, 'bookingSlots'),
    (snapshot) => onData(snapshot.docs.map(normaliseBookingSlot)),
    onError,
  )
}

export function deleteAppointment(appointmentId) {
  const appointmentReference = doc(firestoreDb, 'appointments', appointmentId)

  return runTransaction(firestoreDb, async (transaction) => {
    const appointmentSnapshot = await transaction.get(appointmentReference)

    if (!appointmentSnapshot.exists()) {
      return
    }

    const { slotKey } = appointmentSnapshot.data()
    transaction.delete(appointmentReference)

    if (slotKey) {
      transaction.delete(doc(firestoreDb, 'bookingSlots', slotKey))
    }
  })
}

export function updateAppointmentStatus(appointmentId, status) {
  if (!APPOINTMENT_STATUSES.includes(status)) {
    throw new Error('Choose a valid appointment status.')
  }

  const appointmentReference = doc(firestoreDb, 'appointments', appointmentId)

  return runTransaction(firestoreDb, async (transaction) => {
    const appointmentSnapshot = await transaction.get(appointmentReference)

    if (!appointmentSnapshot.exists()) {
      throw new Error('The appointment no longer exists.')
    }

    const appointment = appointmentSnapshot.data()
    const slotReference = appointment.slotKey
      ? doc(firestoreDb, 'bookingSlots', appointment.slotKey)
      : null

    if (slotReference) {
      const slotSnapshot = await transaction.get(slotReference)

      if (status === 'cancelled') {
        if (slotSnapshot.exists()) {
          transaction.delete(slotReference)
        }
      } else if (isOccupyingAppointmentStatus(status) && !slotSnapshot.exists()) {
        transaction.set(slotReference, {
          slotKey: appointment.slotKey,
          appointmentId,
          date: appointment.preferredDate,
          time: appointment.preferredTime,
          createdAt: serverTimestamp(),
        })
      } else if (slotSnapshot.exists() && slotSnapshot.data().appointmentId !== appointmentId) {
        throw new AppointmentConflictError()
      }
    }

    transaction.update(appointmentReference, {
      status,
      updatedAt: serverTimestamp(),
    })
  })
}
