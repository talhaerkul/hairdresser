"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Appointment, Review } from "@/types";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  getCustomerAppointments,
  cancelAppointment,
} from "@/services/appointmentService";
import { getReviewByAppointmentId } from "@/services/reviewService";
import ReviewModal from "@/components/review/ReviewModal";

export default function MyAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [appointmentReviews, setAppointmentReviews] = useState<{
    [key: string]: Review | null;
  }>({});

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;

      try {
        const appointmentsList = await getCustomerAppointments(user.uid);
        setAppointments(appointmentsList);

        // Her randevu için değerlendirme olup olmadığını kontrol et
        const reviewsPromises = appointmentsList.map((appointment) =>
          getReviewByAppointmentId(appointment.id)
        );

        const reviewsResults = await Promise.all(reviewsPromises);

        // Değerlendirmeleri randevu ID'lerine göre bir objede saklayalım
        const reviewsMap: { [key: string]: Review | null } = {};
        reviewsResults.forEach((review, index) => {
          reviewsMap[appointmentsList[index].id] = review;
        });

        setAppointmentReviews(reviewsMap);
      } catch (error) {
        console.error("Randevular alınamadı:", error);
        toast.error("Randevularınız alınamadı");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user]);

  const handleCancelAppointment = async (appointmentId: string) => {
    if (isCancelling) return;

    setIsCancelling(true);
    try {
      // Randevu durumunu güncelle
      await cancelAppointment(appointmentId);

      // Lokal durumu güncelle
      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment.id === appointmentId
            ? { ...appointment, status: "cancelled" }
            : appointment
        )
      );

      toast.success("Randevu başarıyla iptal edildi");
    } catch (error) {
      console.error("Randevu iptal edilirken hata oluştu:", error);
      toast.error("Randevu iptal edilirken hata oluştu");
    } finally {
      setIsCancelling(false);
    }
  };

  const openReviewModal = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);

    // Mevcut değerlendirmeyi kontrol et
    const review = appointmentReviews[appointment.id];
    setExistingReview(review);

    setIsReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setIsReviewModalOpen(false);
    setSelectedAppointment(null);
    setExistingReview(null);
  };

  const handleReviewSuccess = async () => {
    if (!selectedAppointment) return;

    // Değerlendirmeyi yeniden yükle
    const updatedReview = await getReviewByAppointmentId(
      selectedAppointment.id
    );

    // Değerlendirmeler objesini güncelle
    setAppointmentReviews((prev) => ({
      ...prev,
      [selectedAppointment.id]: updatedReview,
    }));
  };

  // Randevuları filtreleme ve sıralama
  const filteredAppointments = appointments
    .filter((appointment) => {
      const appointmentDate = parseISO(
        `${appointment.date}T${appointment.time}`
      );
      const now = new Date();

      if (filter === "upcoming") {
        return appointment.status !== "cancelled" && appointmentDate > now;
      } else if (filter === "past") {
        return appointment.status === "completed" || appointmentDate < now;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = parseISO(`${a.date}T${a.time}`);
      const dateB = parseISO(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });

  return (
    <ProtectedRoute allowedRoles={["customer", "barber"]}>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Randevularım
          </h1>

          {/* Filtre */}
          <div className="mb-6 flex justify-center">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                  filter === "upcoming"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setFilter("upcoming")}
              >
                Yaklaşan
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium ${
                  filter === "past"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setFilter("past")}
              >
                Geçmiş
              </button>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setFilter("all")}
              >
                Tümü
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredAppointments.length > 0 ? (
            <div className="space-y-6">
              {filteredAppointments.map((appointment) => {
                const appointmentDate = parseISO(
                  `${appointment.date}T${appointment.time}`
                );
                const isPast = appointmentDate < new Date();
                const canCancel = !isPast && appointment.status !== "cancelled";
                const canReview =
                  (isPast || appointment.status === "completed") &&
                  appointment.status !== "cancelled";
                const hasReview = !!appointmentReviews[appointment.id];

                return (
                  <div
                    key={appointment.id}
                    className={`bg-white rounded-lg shadow-sm overflow-hidden border-l-4 ${
                      appointment.status === "cancelled"
                        ? "border-red-500"
                        : appointment.status === "completed"
                        ? "border-green-500"
                        : appointment.status === "confirmed"
                        ? "border-blue-500"
                        : "border-yellow-500"
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {appointment.serviceName}
                            <span className="ml-2 text-sm text-gray-500">
                              ({appointment.barberName})
                            </span>
                          </h3>
                          <div className="flex items-center mt-2">
                            <svg
                              className="h-5 w-5 text-gray-500 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <span className="text-gray-800">
                              {format(
                                parseISO(appointment.date),
                                "d MMMM yyyy",
                                { locale: tr }
                              )}
                              , {appointment.time}
                            </span>
                          </div>
                          <div className="flex items-center mt-1">
                            <svg
                              className="h-5 w-5 text-gray-500 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="text-gray-800">
                              {appointment.duration} dakika
                            </span>
                          </div>
                          <div className="mt-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                appointment.status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : appointment.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : appointment.status === "confirmed"
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

                            {hasReview && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Değerlendirildi
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 md:mt-0 text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {appointment.servicePrice} ₺
                          </div>

                          <div className="mt-2 space-y-2">
                            {canReview && (
                              <button
                                onClick={() => openReviewModal(appointment)}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium block"
                              >
                                {hasReview
                                  ? "Değerlendirmeyi Düzenle"
                                  : "Değerlendir"}
                              </button>
                            )}

                            {canCancel && (
                              <button
                                onClick={() =>
                                  handleCancelAppointment(appointment.id)
                                }
                                disabled={isCancelling}
                                className="text-sm text-red-600 hover:text-red-800 font-medium block"
                              >
                                {isCancelling
                                  ? "İptal Ediliyor..."
                                  : "Randevuyu İptal Et"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Değerlendirme Özeti (Varsa) */}
                      {hasReview && appointmentReviews[appointment.id] && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <div className="flex items-center">
                            <div className="flex text-yellow-400 mr-2">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i <
                                    Math.floor(
                                      appointmentReviews[appointment.id]
                                        ?.rating || 0
                                    )
                                      ? "text-yellow-500"
                                      : "text-gray-300"
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">
                              {appointmentReviews[appointment.id]?.rating || 0}
                              /5
                            </span>
                          </div>
                          {appointmentReviews[appointment.id]?.comment && (
                            <p className="mt-1 text-sm text-gray-600">
                              {appointmentReviews[appointment.id]?.comment}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white py-10 px-6 rounded-lg shadow-sm text-center">
              <svg
                className="h-12 w-12 text-gray-400 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Henüz randevunuz bulunmamaktadır
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === "upcoming"
                  ? "Yaklaşan randevunuz bulunmamaktadır."
                  : filter === "past"
                  ? "Geçmiş randevunuz bulunmamaktadır."
                  : "Hiç randevunuz bulunmamaktadır."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Değerlendirme Modalı */}
      {selectedAppointment && (
        <ReviewModal
          appointment={selectedAppointment}
          existingReview={existingReview}
          isOpen={isReviewModalOpen}
          onClose={closeReviewModal}
          onSuccess={handleReviewSuccess}
        />
      )}
    </ProtectedRoute>
  );
}
