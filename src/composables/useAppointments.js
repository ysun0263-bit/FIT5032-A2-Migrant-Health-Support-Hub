import { ref } from 'vue'
import { createId } from '../utils/ids.js'
import { APPOINTMENTS_STORAGE_KEY, readStorageArray, writeStorageArray } from '../utils/storage.js'

export function useAppointments() {
  const appointments = ref(readStorageArray(APPOINTMENTS_STORAGE_KEY))

  function persist(nextAppointments) {
    appointments.value = nextAppointments
    writeStorageArray(APPOINTMENTS_STORAGE_KEY, nextAppointments)
  }

  function addAppointment(form) {
    const appointment = {
      id: createId('booking'),
      userId: null,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      preferredLanguage: form.preferredLanguage,
      supportTopic: form.supportTopic,
      preferredDate: form.preferredDate,
      preferredTime: form.preferredTime,
      contactPreference: form.contactPreference,
      notes: form.notes.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    persist([appointment, ...appointments.value])
    return appointment
  }

  function deleteAppointment(id) {
    persist(appointments.value.filter((appointment) => appointment.id !== id))
  }

  function reloadAppointments() {
    appointments.value = readStorageArray(APPOINTMENTS_STORAGE_KEY)
  }

  return {
    appointments,
    addAppointment,
    deleteAppointment,
    reloadAppointments,
  }
}
