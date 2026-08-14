import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { firebaseAuth, firestoreDb } from '../firebase/firebase.js'
import { timestampToIso } from '../utils/timestamps.js'

export const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled']

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
    contactPreference: data.contactPreference,
    notes: data.notes ?? '',
    status: data.status,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
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

  const reference = doc(collection(firestoreDb, 'appointments'))
  const appointment = {
    id: reference.id,
    userId: firebaseUser.uid,
    fullName: form.fullName.trim(),
    email: form.email.trim().toLowerCase(),
    language: form.preferredLanguage,
    supportTopic: form.supportTopic,
    preferredDate: form.preferredDate,
    preferredTime: form.preferredTime,
    contactPreference: form.contactPreference,
    notes: form.notes.trim(),
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(reference, appointment)

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

export function deleteAppointment(appointmentId) {
  return deleteDoc(doc(firestoreDb, 'appointments', appointmentId))
}

export function updateAppointmentStatus(appointmentId, status) {
  if (!APPOINTMENT_STATUSES.includes(status)) {
    throw new Error('Choose a valid appointment status.')
  }

  return updateDoc(doc(firestoreDb, 'appointments', appointmentId), {
    status,
    updatedAt: serverTimestamp(),
  })
}
