import { ref, get, set, update, remove, push } from "firebase/database";
import { db } from "@/lib/firebase";
import { Appointment, Availability } from "@/types";

// Berberin randevularını getir
export const getBarberAppointments = async (
  barberId: string
): Promise<Appointment[]> => {
  try {
    console.log(
      "AppointmentService - Getting appointments for barber:",
      barberId
    );
    const appointmentsRef = ref(db, "appointments");
    const appointmentsSnapshot = await get(appointmentsRef);

    const appointmentsList: Appointment[] = [];
    if (appointmentsSnapshot.exists()) {
      appointmentsSnapshot.forEach((child) => {
        const appointment = {
          id: child.key as string,
          ...child.val(),
        } as Appointment;

        // İstemci tarafında filtreleme - sadece bu berberin randevularını al
        if (appointment.barberId === barberId) {
          appointmentsList.push(appointment);
        }
      });
    }

    return appointmentsList;
  } catch (error: any) {
    console.error(
      "AppointmentService - Error fetching appointments:",
      error.message
    );
    throw error;
  }
};

// Müşterinin randevularını getir
export const getCustomerAppointments = async (
  customerId: string
): Promise<Appointment[]> => {
  try {
    console.log(
      "AppointmentService - Getting appointments for customer:",
      customerId
    );
    const appointmentsRef = ref(db, "appointments");
    const appointmentsSnapshot = await get(appointmentsRef);

    const appointmentsList: Appointment[] = [];
    if (appointmentsSnapshot.exists()) {
      appointmentsSnapshot.forEach((child) => {
        const appointment = {
          id: child.key as string,
          ...child.val(),
        } as Appointment;

        // İstemci tarafında filtreleme - sadece bu müşterinin randevularını al
        if (appointment.customerId === customerId) {
          appointmentsList.push(appointment);
        }
      });
    }

    return appointmentsList;
  } catch (error: any) {
    console.error(
      "AppointmentService - Error fetching appointments:",
      error.message
    );
    throw error;
  }
};

// Randevu durumunu güncelle
export const updateAppointmentStatus = async (
  appointmentId: string,
  newStatus: "confirmed" | "cancelled" | "completed" | "pending"
): Promise<void> => {
  try {
    console.log(
      `AppointmentService - Updating appointment ${appointmentId} status to ${newStatus}`
    );
    const appointmentRef = ref(db, `appointments/${appointmentId}`);
    await update(appointmentRef, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(
      "AppointmentService - Error updating appointment status:",
      error.message
    );
    throw error;
  }
};

// Yeni randevu oluştur
export const createAppointment = async (
  appointmentData: Omit<Appointment, "id">
): Promise<string> => {
  try {
    console.log("AppointmentService - Creating new appointment");
    const appointmentsRef = ref(db, "appointments");
    const newAppointmentRef = push(appointmentsRef);

    // Tarih alanını ekle
    const newAppointment = {
      ...appointmentData,
      createdAt: new Date().toISOString(),
      status: appointmentData.status || "pending",
    };

    await set(newAppointmentRef, newAppointment);
    return newAppointmentRef.key as string;
  } catch (error: any) {
    console.error(
      "AppointmentService - Error creating appointment:",
      error.message
    );
    throw error;
  }
};

// Randevu iptal et
export const cancelAppointment = async (
  appointmentId: string
): Promise<void> => {
  try {
    console.log("AppointmentService - Cancelling appointment:", appointmentId);
    await updateAppointmentStatus(appointmentId, "cancelled");
  } catch (error: any) {
    console.error(
      "AppointmentService - Error cancelling appointment:",
      error.message
    );
    throw error;
  }
};

// Berberin müsaitlik zamanlarını getir
export const getBarberAvailability = async (
  barberId: string
): Promise<Availability[]> => {
  try {
    console.log(
      "AppointmentService - Getting availability for barber:",
      barberId
    );
    const availabilitiesRef = ref(db, `users/${barberId}/availability`);
    const availabilitiesSnapshot = await get(availabilitiesRef);

    const availabilitiesList: Availability[] = [];
    if (availabilitiesSnapshot.exists()) {
      availabilitiesSnapshot.forEach((child) => {
        availabilitiesList.push({
          id: child.key as string,
          ...child.val(),
        } as Availability);
      });
    }

    return availabilitiesList;
  } catch (error: any) {
    console.error(
      "AppointmentService - Error fetching availability:",
      error.message
    );
    throw error;
  }
};

// Berberin müsaitlik zamanlarını güncelle
export const updateBarberAvailability = async (
  barberId: string,
  dateString: string,
  availabilityData: {
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }
): Promise<void> => {
  try {
    console.log(
      `AppointmentService - Updating availability for barber ${barberId} on ${dateString}`
    );
    const availabilityRef = ref(
      db,
      `users/${barberId}/availability/${dateString}`
    );

    await set(availabilityRef, {
      barberId,
      date: dateString,
      startTime: availabilityData.startTime,
      endTime: availabilityData.endTime,
      isAvailable: availabilityData.isAvailable,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(
      "AppointmentService - Error updating availability:",
      error.message
    );
    throw error;
  }
};

// Berberin birden çok gün için müsaitlik zamanlarını güncelle
export const updateMultipleDaysAvailability = async (
  barberId: string,
  workingHours: Record<
    string,
    { startTime: string; endTime: string; isAvailable: boolean }
  >
): Promise<void> => {
  try {
    console.log(
      "AppointmentService - Updating multiple days availability for barber:",
      barberId
    );

    // Her gün için müsaitlik durumunu güncelle
    for (const [dateString, hours] of Object.entries(workingHours)) {
      await updateBarberAvailability(barberId, dateString, hours);
    }
  } catch (error: any) {
    console.error(
      "AppointmentService - Error updating multiple days availability:",
      error.message
    );
    throw error;
  }
};
