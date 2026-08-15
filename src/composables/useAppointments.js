import { ref, watch } from 'vue'
import {
  AppointmentConflictError,
  createAppointment,
  deleteAppointment as deleteAppointmentDocument,
  subscribeToAllAppointments,
  subscribeToBookingSlots,
  subscribeToUserAppointments,
  updateAppointmentStatus as updateAppointmentStatusDocument,
} from '../services/appointmentService.js'
import { currentUser, isAdmin } from '../stores/authStore.js'

const appointments = ref([])
const appointmentsLoading = ref(true)
const appointmentsError = ref('')
const bookingSlots = ref([])
const bookingSlotsLoading = ref(true)
const bookingSlotsError = ref('')

let stopAuthWatch
let unsubscribeAppointments
let unsubscribeBookingSlots
let subscriptionGeneration = 0

function stopAppointmentSubscription() {
  subscriptionGeneration += 1
  unsubscribeAppointments?.()
  unsubscribeAppointments = undefined
  unsubscribeBookingSlots?.()
  unsubscribeBookingSlots = undefined
}

function startAppointmentSubscription(user, admin) {
  stopAppointmentSubscription()
  appointments.value = []
  appointmentsError.value = ''
  bookingSlots.value = []
  bookingSlotsError.value = ''

  if (!user?.uid) {
    appointmentsLoading.value = false
    bookingSlotsLoading.value = false
    return
  }

  appointmentsLoading.value = true
  bookingSlotsLoading.value = true
  const generation = subscriptionGeneration
  const onData = (nextAppointments) => {
    if (generation !== subscriptionGeneration) {
      return
    }

    appointments.value = nextAppointments
    appointmentsLoading.value = false
  }
  const onError = () => {
    if (generation !== subscriptionGeneration) {
      return
    }

    appointments.value = []
    appointmentsError.value = 'Appointments could not be loaded.'
    appointmentsLoading.value = false
  }

  unsubscribeAppointments = admin
    ? subscribeToAllAppointments(onData, onError)
    : subscribeToUserAppointments(user.uid, onData, onError)

  unsubscribeBookingSlots = subscribeToBookingSlots(
    (nextSlots) => {
      if (generation !== subscriptionGeneration) {
        return
      }

      bookingSlots.value = nextSlots
      bookingSlotsLoading.value = false
    },
    () => {
      if (generation !== subscriptionGeneration) {
        return
      }

      bookingSlots.value = []
      bookingSlotsError.value = 'Appointment availability could not be loaded.'
      bookingSlotsLoading.value = false
    },
  )
}

export function initialiseAppointments() {
  if (stopAuthWatch) {
    return
  }

  stopAuthWatch = watch(
    [currentUser, isAdmin],
    ([user, admin]) => startAppointmentSubscription(user, admin),
    { immediate: true },
  )
}

export function useAppointments() {
  initialiseAppointments()

  async function addAppointment(form) {
    appointmentsError.value = ''

    try {
      return await createAppointment(form)
    } catch (error) {
      appointmentsError.value = error instanceof AppointmentConflictError
        ? error.message
        : 'The appointment could not be created.'
      throw error
    }
  }

  async function deleteAppointment(id) {
    appointmentsError.value = ''

    try {
      await deleteAppointmentDocument(id)
      return true
    } catch {
      appointmentsError.value = 'The appointment could not be deleted.'
      return false
    }
  }

  async function updateAppointmentStatus(id, status) {
    appointmentsError.value = ''

    try {
      await updateAppointmentStatusDocument(id, status)
      return true
    } catch {
      appointmentsError.value = 'The appointment status could not be updated.'
      return false
    }
  }

  return {
    appointments,
    appointmentsLoading,
    appointmentsError,
    bookingSlots,
    bookingSlotsLoading,
    bookingSlotsError,
    addAppointment,
    deleteAppointment,
    updateAppointmentStatus,
  }
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    stopAppointmentSubscription()
    stopAuthWatch?.()
    stopAuthWatch = undefined
  })
}
