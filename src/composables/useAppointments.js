import { ref } from 'vue'
import { createId } from '../utils/ids.js'
import { APPOINTMENTS_STORAGE_KEY, readStorageArray, writeStorageArray } from '../utils/storage.js'
import { isAdmin } from '../stores/authStore.js'

export function useAppointments() {
  const appointments = ref(readStorageArray(APPOINTMENTS_STORAGE_KEY))

  function persist(nextAppointments) {
    appointments.value = nextAppointments
    writeStorageArray(APPOINTMENTS_STORAGE_KEY, nextAppointments)
  }

  function addAppointment(form, userId = null) {
    const appointment = {
      id: createId('booking'),
      userId,
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

  function deleteAppointment(id, ownerUserId = null) {
    const target = appointments.value.find((appointment) => appointment.id === id)

    if (!target || (ownerUserId && target.userId !== ownerUserId)) {
      return false
    }

    persist(appointments.value.filter((appointment) => appointment.id !== id))
    return true
  }

  function updateAppointmentStatus(id, status) {
    const allowedStatuses = ['pending', 'confirmed', 'completed', 'cancelled']

    if (!isAdmin.value || !allowedStatuses.includes(status)) {
      return false
    }

    persist(
      appointments.value.map((appointment) =>
        appointment.id === id ? { ...appointment, status } : appointment,
      ),
    )
    return true
  }

  function reloadAppointments() {
    appointments.value = readStorageArray(APPOINTMENTS_STORAGE_KEY)
  }

  return {
    appointments,
    addAppointment,
    deleteAppointment,
    updateAppointmentStatus,
    reloadAppointments,
  }
}
