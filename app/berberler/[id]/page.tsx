"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Barber, Service, Availability, Appointment } from "@/types";
import Image from "next/image";
import toast from "react-hot-toast";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { tr } from "date-fns/locale";
import { format, parseISO, isAfter, isBefore, addMinutes } from "date-fns";
import {
  getBarberById,
  getBarberAvailability,
  getBarberAppointments,
} from "@/services/berberService";
import { createAppointment } from "@/services/appointmentService";

export default function BarberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [berber, setBerber] = useState<Barber | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<
    Appointment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  // Aktif randevu adımı için durum
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  const barberId = params?.id as string;

  useEffect(() => {
    const fetchBarberData = async () => {
      try {
        if (!barberId) return;

        // Berber bilgilerini getir
        const berberData = await getBarberById(barberId);
        if (!berberData) {
          toast.error("Berber bulunamadı");
          router.push("/berberler");
          return;
        }

        setBerber(berberData);
        setServices(berberData.services || []);

        // Müsait zamanları getir
        const availabilityList = await getBarberAvailability(barberId);
        setAvailability(availabilityList);

        // Mevcut randevuları getir
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const appointmentsList = await getBarberAppointments(barberId, today);
        setExistingAppointments(appointmentsList);
      } catch (error) {
        console.error("Berber bilgileri alınamadı:", error);
        toast.error("Berber bilgileri alınamadı");
      } finally {
        setLoading(false);
      }
    };

    fetchBarberData();
  }, [barberId, router]);

  // Hizmet seçildiğinde bir sonraki adıma geç
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setActiveStep(2);
    // Reset time selection when service changes
    setSelectedTime(null);
  };

  // Tarih seçildiğinde bir sonraki adıma geç
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setActiveStep(3);
    }
  };

  const getAvailableTimesForDate = (date: Date) => {
    if (!berber || !selectedService) return [];

    const dateString = format(date, "yyyy-MM-dd");

    // Seçilen gün için müsait zaman aralıklarını bul
    const dayAvailability = availability.find(
      (a) => a.date === dateString && a.isAvailable
    );

    if (!dayAvailability) return [];

    // Başlangıç ve bitiş zamanlarını parse et
    const startTime = parseISO(`${dateString}T${dayAvailability.startTime}`);
    const endTime = parseISO(`${dateString}T${dayAvailability.endTime}`);

    // Seçilen servisin süresi
    const serviceDuration = selectedService.duration; // dakika cinsinden

    // Mevcut randevuları bul
    const dayAppointments = existingAppointments.filter(
      (appointment) =>
        appointment.date === dateString && appointment.status !== "cancelled" // İptal edilen randevuları hariç tut
    );

    // Müsait zaman aralıklarını hesapla (30 dakikalık aralıklarla)
    const availableTimes: string[] = [];
    let currentTime = startTime;

    while (
      isBefore(currentTime, endTime) ||
      format(currentTime, "HH:mm") === format(endTime, "HH:mm")
    ) {
      const timeString = format(currentTime, "HH:mm");

      // Bu zaman için bir randevu kontrolü yap
      const timeEndWithService = addMinutes(currentTime, serviceDuration);

      // Bu saatte çakışan bir randevu var mı kontrol et
      const hasOverlap = dayAppointments.some((appointment) => {
        const appointmentStart = parseISO(`${dateString}T${appointment.time}`);
        const appointmentEnd = addMinutes(
          appointmentStart,
          appointment.duration
        );

        // Çakışma kontrolü: Randevu başlangıç ve bitiş zamanları arasında çakışma var mı?
        return (
          // Yeni randevu başlangıcı mevcut randevu aralığına denk geliyor mu?
          ((isAfter(currentTime, appointmentStart) ||
            format(currentTime, "HH:mm") ===
              format(appointmentStart, "HH:mm")) &&
            isBefore(currentTime, appointmentEnd)) ||
          // Yeni randevu bitişi mevcut randevu aralığına denk geliyor mu?
          (isAfter(timeEndWithService, appointmentStart) &&
            isBefore(timeEndWithService, appointmentEnd)) ||
          // Yeni randevu tamamen mevcut randevuyu kapsıyor mu?
          (isBefore(currentTime, appointmentStart) &&
            isAfter(timeEndWithService, appointmentEnd))
        );
      });

      // Eğer çakışma yoksa ve mesai bitiş saatinden önce bitiyorsa, müsait zamanlara ekle
      if (
        !hasOverlap &&
        (isBefore(timeEndWithService, endTime) ||
          format(timeEndWithService, "HH:mm") === format(endTime, "HH:mm"))
      ) {
        availableTimes.push(timeString);
      }

      // 30 dakika ilerlet
      currentTime = addMinutes(currentTime, 30);
    }

    return availableTimes;
  };

  const handleBookAppointment = async () => {
    if (!user) {
      toast.error("Randevu almak için giriş yapmalısınız");
      router.push("/giris?redirect=/berberler/" + barberId);
      return;
    }

    if (!berber || !selectedService || !selectedDate || !selectedTime) {
      toast.error("Lütfen tüm randevu bilgilerini doldurun");
      return;
    }

    setIsBooking(true);

    try {
      // Randevu nesnesi oluştur
      const appointmentData: Omit<Appointment, "id"> = {
        barberId: berber.id,
        barberName: berber.name,
        customerId: user.uid,
        customerName: user.displayName || "İsimsiz Müşteri",
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        date: format(selectedDate, "yyyy-MM-dd"),
        time: selectedTime,
        duration: selectedService.duration,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Randevu oluştur
      await createAppointment(appointmentData);

      toast.success("Randevu başarıyla oluşturuldu");
      router.push("/randevularim");
    } catch (error) {
      console.error("Randevu oluşturulurken hata oluştu:", error);
      toast.error("Randevu oluşturulurken hata oluştu");
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!berber) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Berber Bulunamadı
          </h1>
          <p className="text-gray-600 mb-6">
            Aradığınız berber bilgilerine ulaşılamadı.
          </p>
          <button
            className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition"
            onClick={() => router.push("/berberler")}
          >
            Berberlere Dön
          </button>
        </div>
      </div>
    );
  }

  const availableTimes =
    selectedService && selectedDate
      ? getAvailableTimesForDate(selectedDate)
      : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {loading ? (
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      ) : berber ? (
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3 relative h-56 md:h-auto">
                (
                <Image
                  src={berber.photoURL || "/berber_profile.png"}
                  alt={berber.name}
                  fill
                  className="object-cover"
                />
                )
              </div>
              <div className="md:w-2/3 p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {berber.name}
                </h1>
                <div className="flex items-center mb-4">
                  <span className="text-yellow-400 mr-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </span>
                  <span className="text-gray-600">
                    {berber.rating || "Yeni"}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">
                  {berber.description || "Açıklama bulunmamaktadır."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {berber.location || "Konum Belirtilmemiş"}
                  </span>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {berber.specialization || "Uzmanlık Belirtilmemiş"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Randevu Al
              </h2>

              {/* Adım göstergesi */}
              <div className="mb-8">
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      activeStep >= 1
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    1
                  </div>
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      activeStep >= 2 ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  ></div>
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      activeStep >= 2
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    2
                  </div>
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      activeStep >= 3 ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  ></div>
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      activeStep >= 3
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    3
                  </div>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-gray-600">Hizmet Seçimi</span>
                  <span className="text-sm text-gray-600">Tarih Seçimi</span>
                  <span className="text-sm text-gray-600">Saat Seçimi</span>
                </div>
              </div>

              <div className="md:flex">
                {/* Adım 1: Hizmet Seçimi */}
                {activeStep === 1 && (
                  <div className="w-full">
                    <h3 className="text-xl font-semibold mb-4">Hizmet Seçin</h3>
                    {services && services.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {services.map((service) => (
                          <div
                            key={service.id}
                            onClick={() => handleServiceSelect(service)}
                            className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                              selectedService?.id === service.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {service.name}
                                </h4>
                                <p className="text-sm text-gray-500 mt-1">
                                  {service.duration} dakika
                                </p>
                                {service.description && (
                                  <p className="text-sm text-gray-600 mt-2">
                                    {service.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-lg font-semibold text-blue-600">
                                {service.price} ₺
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-6 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">
                          Herhangi bir hizmet bulunamadı
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Adım 2: Tarih Seçimi */}
                {activeStep === 2 && (
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold">Tarih Seçin</h3>
                      <button
                        onClick={() => setActiveStep(1)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        &larr; Hizmet Seçimine Dön
                      </button>
                    </div>
                    <div className="flex flex-col md:flex-row">
                      <div className="mx-auto mb-4 md:mb-0">
                        <DayPicker
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateSelect}
                          locale={tr}
                          modifiers={{
                            available: (date) => {
                              const dateStr = format(date, "yyyy-MM-dd");
                              return availability.some(
                                (a) => a.date === dateStr && a.isAvailable
                              );
                            },
                          }}
                          modifiersStyles={{
                            available: {
                              backgroundColor: "#f0f9ff",
                              color: "#3b82f6",
                              fontWeight: "bold",
                            },
                          }}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const dateStr = format(date, "yyyy-MM-dd");
                            return (
                              date < today ||
                              !availability.some(
                                (a) => a.date === dateStr && a.isAvailable
                              )
                            );
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Adım 3: Saat Seçimi */}
                {activeStep === 3 && selectedDate && (
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold">Saat Seçin</h3>
                      <button
                        onClick={() => setActiveStep(2)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        &larr; Tarih Seçimine Dön
                      </button>
                    </div>
                    <p className="mb-4 text-gray-600">
                      Seçilen tarih:{" "}
                      {format(selectedDate, "d MMMM yyyy", { locale: tr })}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {getAvailableTimesForDate(selectedDate).length > 0 ? (
                        getAvailableTimesForDate(selectedDate).map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`py-2 px-4 border rounded-md transition-colors ${
                              selectedTime === time
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                            }`}
                          >
                            {time}
                          </button>
                        ))
                      ) : (
                        <div className="col-span-full text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">
                            Bu tarihte müsait saat bulunmamaktadır
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Seçim Özeti ve Randevu Butonu */}
              {selectedService && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Randevu Özeti</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Hizmet</p>
                        <p className="font-medium">
                          {selectedService.name} - {selectedService.price} ₺
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tarih</p>
                        <p className="font-medium">
                          {selectedDate
                            ? format(selectedDate, "d MMMM yyyy", {
                                locale: tr,
                              })
                            : "Seçilmedi"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Saat</p>
                        <p className="font-medium">
                          {selectedTime ? selectedTime : "Seçilmedi"}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleBookAppointment}
                      disabled={
                        isBooking ||
                        !selectedService ||
                        !selectedDate ||
                        !selectedTime
                      }
                      className={`w-full mt-4 py-3 px-4 rounded-md text-white font-medium ${
                        isBooking ||
                        !selectedService ||
                        !selectedDate ||
                        !selectedTime
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {isBooking ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                          İşlem Yapılıyor
                        </span>
                      ) : (
                        "Randevu Oluştur"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">Berber bulunamadı</p>
          </div>
        </div>
      )}
    </div>
  );
}
