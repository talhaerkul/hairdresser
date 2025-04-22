"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Appointment, Availability } from "@/types";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  format,
  parseISO,
  addDays,
  startOfWeek,
  addWeeks,
  subWeeks,
} from "date-fns";
import { tr } from "date-fns/locale";
import toast from "react-hot-toast";
import {
  getBarberAppointments,
  getBarberAvailability,
  updateAppointmentStatus,
  updateMultipleDaysAvailability,
} from "@/services/appointmentService";

export default function BarberCalendarPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // Çalışma saatleri için state
  const [workingHours, setWorkingHours] = useState<
    Record<string, { startTime: string; endTime: string; isAvailable: boolean }>
  >({});
  const [isUpdatingHours, setIsUpdatingHours] = useState(false);

  // Günleri oluştur
  const weekDays = [...Array(7)].map((_, i) => addDays(currentWeek, i));

  useEffect(() => {
    const fetchCalendarData = async () => {
      if (!user) return;

      try {
        // Randevuları getir
        const appointmentsList = await getBarberAppointments(user.uid);
        setAppointments(appointmentsList);

        // Müsait zamanları getir
        const availabilitiesList = await getBarberAvailability(user.uid);
        setAvailabilities(availabilitiesList);

        // Çalışma saatlerini hazırla
        const hours: Record<
          string,
          { startTime: string; endTime: string; isAvailable: boolean }
        > = {};

        weekDays.forEach((day) => {
          const dateString = format(day, "yyyy-MM-dd");
          const availability = availabilitiesList.find(
            (a) => a.date === dateString
          );

          hours[dateString] = {
            startTime: availability?.startTime || "09:00",
            endTime: availability?.endTime || "18:00",
            isAvailable: availability?.isAvailable || false,
          };
        });

        setWorkingHours(hours);
      } catch (error) {
        console.error("Takvim verileri alınamadı:", error);
        toast.error("Takvim verileri alınamadı");
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, [user, currentWeek]);

  const handleUpdateAvailability = async () => {
    if (!user) return;

    setIsUpdatingHours(true);

    try {
      // Her gün için müsaitlik durumunu güncelle
      await updateMultipleDaysAvailability(user.uid, workingHours);
      toast.success("Çalışma saatleri güncellendi");
    } catch (error) {
      console.error("Çalışma saatleri güncellenirken hata oluştu:", error);
      toast.error("Çalışma saatleri güncellenirken hata oluştu");
    } finally {
      setIsUpdatingHours(false);
    }
  };

  const handleUpdateAppointmentStatus = async (
    appointmentId: string,
    newStatus: "confirmed" | "cancelled" | "completed"
  ) => {
    try {
      // Randevu durumunu güncelle
      await updateAppointmentStatus(appointmentId, newStatus);

      // Lokal durumu güncelle
      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment.id === appointmentId
            ? { ...appointment, status: newStatus }
            : appointment
        )
      );

      toast.success("Randevu durumu güncellendi");
    } catch (error) {
      console.error("Randevu durumu güncellenirken hata oluştu:", error);
      toast.error("Randevu durumu güncellenirken hata oluştu");
    }
  };

  const toggleDayAvailability = (date: string) => {
    setWorkingHours((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        isAvailable: !prev[date].isAvailable,
      },
    }));
  };

  const updateHourSetting = (
    date: string,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setWorkingHours((prev) => ({
      ...prev,
      [date]: {
        ...prev[date],
        [field]: value,
      },
    }));
  };

  const getDayAppointments = (date: string) => {
    return appointments.filter((appointment) => appointment.date === date);
  };

  return (
    <ProtectedRoute allowedRoles={["barber"]}>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Takvimim
            </h1>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                className="px-3 py-2 text-sm sm:px-4 sm:py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Önceki Hafta
              </button>
              <button
                onClick={() => setCurrentWeek(new Date())}
                className="px-3 py-2 text-sm sm:px-4 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Bu Hafta
              </button>
              <button
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                className="px-3 py-2 text-sm sm:px-4 sm:py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Sonraki Hafta
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Çalışma Saatleri Ayarları */}
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-8 overflow-x-auto">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Çalışma Saatleri
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 min-w-max sm:min-w-0">
                  {weekDays.map((day, index) => {
                    const dateString = format(day, "yyyy-MM-dd");
                    const daySettings = workingHours[dateString];

                    return (
                      <div
                        key={dateString}
                        className={`p-3 sm:p-4 border rounded-lg ${
                          daySettings?.isAvailable
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="font-medium mb-2">
                          {format(day, "EEEE", { locale: tr })}
                          <div className="text-sm text-gray-500">
                            {format(day, "d MMMM", { locale: tr })}
                          </div>
                        </div>

                        <div className="flex items-center mb-3">
                          <input
                            type="checkbox"
                            id={`available-${dateString}`}
                            checked={daySettings?.isAvailable || false}
                            onChange={() => toggleDayAvailability(dateString)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor={`available-${dateString}`}
                            className="ml-2 text-sm text-gray-700"
                          >
                            Müsait
                          </label>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              Başlangıç
                            </label>
                            <input
                              type="time"
                              value={daySettings?.startTime || "09:00"}
                              onChange={(e) =>
                                updateHourSetting(
                                  dateString,
                                  "startTime",
                                  e.target.value
                                )
                              }
                              className="w-full p-1 text-sm border border-gray-300 rounded"
                              disabled={!daySettings?.isAvailable}
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              Bitiş
                            </label>
                            <input
                              type="time"
                              value={daySettings?.endTime || "18:00"}
                              onChange={(e) =>
                                updateHourSetting(
                                  dateString,
                                  "endTime",
                                  e.target.value
                                )
                              }
                              className="w-full p-1 text-sm border border-gray-300 rounded"
                              disabled={!daySettings?.isAvailable}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Kaydet Butonu */}
                <div className="flex justify-end mb-8 mt-2">
                  <button
                    onClick={handleUpdateAvailability}
                    disabled={isUpdatingHours}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 flex items-center"
                  >
                    {isUpdatingHours ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Kaydediyor...
                      </>
                    ) : (
                      "Çalışma Saatlerini Kaydet"
                    )}
                  </button>
                </div>

                {/* Randevular */}
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Randevular
                  </h2>

                  <div className="space-y-8">
                    {weekDays.map((day) => {
                      const dateString = format(day, "yyyy-MM-dd");
                      const dayAppointments = getDayAppointments(dateString);

                      return (
                        <div key={dateString} className="border-t pt-6">
                          <h3 className="font-medium text-lg text-gray-900 mb-4">
                            {format(day, "d MMMM EEEE", { locale: tr })}
                          </h3>

                          {dayAppointments.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th
                                      scope="col"
                                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                      Saat
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                      Müşteri
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                      Hizmet
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                      Durum
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                      İşlemler
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {dayAppointments.map((appointment) => (
                                    <tr key={appointment.id}>
                                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {appointment.time} (
                                        {appointment.duration} dk)
                                      </td>
                                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {appointment.customerName}
                                      </td>
                                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {appointment.serviceName}
                                      </td>
                                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        <span
                                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            appointment.status === "cancelled"
                                              ? "bg-red-100 text-red-800"
                                              : appointment.status ===
                                                "completed"
                                              ? "bg-green-100 text-green-800"
                                              : appointment.status ===
                                                "confirmed"
                                              ? "bg-blue-100 text-blue-800"
                                              : "bg-yellow-100 text-yellow-800"
                                          }`}
                                        >
                                          {appointment.status === "cancelled"
                                            ? "İptal Edildi"
                                            : appointment.status === "completed"
                                            ? "Tamamlandı"
                                            : appointment.status === "confirmed"
                                            ? "Onaylandı"
                                            : "Onay Bekleniyor"}
                                        </span>
                                      </td>
                                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        <div className="flex flex-col space-y-2">
                                          {appointment.status === "pending" && (
                                            <button
                                              onClick={() =>
                                                handleUpdateAppointmentStatus(
                                                  appointment.id,
                                                  "confirmed"
                                                )
                                              }
                                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                            >
                                              Onayla
                                            </button>
                                          )}

                                          {(appointment.status === "pending" ||
                                            appointment.status ===
                                              "confirmed") && (
                                            <button
                                              onClick={() =>
                                                handleUpdateAppointmentStatus(
                                                  appointment.id,
                                                  "cancelled"
                                                )
                                              }
                                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                            >
                                              İptal Et
                                            </button>
                                          )}

                                          {appointment.status ===
                                            "confirmed" && (
                                            <button
                                              onClick={() =>
                                                handleUpdateAppointmentStatus(
                                                  appointment.id,
                                                  "completed"
                                                )
                                              }
                                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                            >
                                              Tamamlandı
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="p-6 text-center text-gray-500">
                              Bu gün için randevu bulunmuyor.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
