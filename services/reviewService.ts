import {
  ref,
  get,
  push,
  set,
  remove,
  query,
  orderByChild,
  equalTo,
  update,
} from "firebase/database";
import { db } from "@/lib/firebase";
import { Review } from "@/types";

// Değerlendirme ekleme
export const addReview = async (
  customerId: string,
  barberId: string,
  appointmentId: string,
  rating: number,
  comment?: string
): Promise<string> => {
  try {
    // Yeni değerlendirme referansı oluştur
    const reviewsRef = ref(db, "reviews");
    const newReviewRef = push(reviewsRef);

    // Değerlendirme verisini hazırla
    const reviewData: Omit<Review, "id"> = {
      customerId,
      barberId,
      appointmentId,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };

    // Veritabanına kaydet
    await set(newReviewRef, reviewData);

    // Berberin puan ortalamasını güncelle
    await updateBarberRating(barberId);

    return newReviewRef.key as string;
  } catch (error) {
    console.error("Değerlendirme eklenirken hata oluştu:", error);
    throw error;
  }
};

// Değerlendirme silme
export const deleteReview = async (
  reviewId: string,
  barberId: string
): Promise<void> => {
  try {
    const reviewRef = ref(db, `reviews/${reviewId}`);
    await remove(reviewRef);

    // Berberin puan ortalamasını güncelle
    await updateBarberRating(barberId);
  } catch (error) {
    console.error("Değerlendirme silinirken hata oluştu:", error);
    throw error;
  }
};

// Değerlendirme güncelleme
export const updateReview = async (
  reviewId: string,
  barberId: string,
  rating: number,
  comment?: string
): Promise<void> => {
  try {
    const reviewRef = ref(db, `reviews/${reviewId}`);
    const reviewSnapshot = await get(reviewRef);

    if (!reviewSnapshot.exists()) {
      throw new Error("Değerlendirme bulunamadı");
    }

    const existingReview = reviewSnapshot.val() as Review;

    // Sadece değiştirilecek alanları güncelle
    const updates = {
      rating,
      comment,
      updatedAt: new Date().toISOString(),
    };

    await set(reviewRef, { ...existingReview, ...updates });

    // Berberin puan ortalamasını güncelle
    await updateBarberRating(barberId);
  } catch (error) {
    console.error("Değerlendirme güncellenirken hata oluştu:", error);
    throw error;
  }
};

// Berberin değerlendirmelerini getir
export const getBarberReviews = async (barberId: string): Promise<Review[]> => {
  try {
    const reviewsRef = ref(db, "reviews");
    const reviewsQuery = query(
      reviewsRef,
      orderByChild("barberId"),
      equalTo(barberId)
    );
    const reviewsSnapshot = await get(reviewsQuery);

    const reviews: Review[] = [];
    if (reviewsSnapshot.exists()) {
      reviewsSnapshot.forEach((reviewSnapshot) => {
        reviews.push({
          id: reviewSnapshot.key,
          ...reviewSnapshot.val(),
        } as Review);
      });
    }

    // Değerlendirmeleri tarihe göre sırala (en yeniden en eskiye)
    return reviews.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error("Değerlendirmeler alınamadı:", error);
    throw error;
  }
};

// Randevunun değerlendirmesini kontrol et
export const getReviewByAppointmentId = async (
  appointmentId: string
): Promise<Review | null> => {
  try {
    const reviewsRef = ref(db, "reviews");
    const reviewsQuery = query(
      reviewsRef,
      orderByChild("appointmentId"),
      equalTo(appointmentId)
    );
    const reviewsSnapshot = await get(reviewsQuery);

    if (reviewsSnapshot.exists()) {
      let review: Review | null = null;
      reviewsSnapshot.forEach((reviewSnapshot) => {
        review = {
          id: reviewSnapshot.key,
          ...reviewSnapshot.val(),
        } as Review;
        return true; // forEach döngüsünü durdur
      });
      return review;
    }

    return null;
  } catch (error) {
    console.error("Değerlendirme kontrolü yapılamadı:", error);
    throw error;
  }
};

// Berberin ortalama puanını güncelle
export const updateBarberRating = async (barberId: string): Promise<void> => {
  try {
    // Berberin tüm değerlendirmelerini getir
    const reviews = await getBarberReviews(barberId);

    if (reviews.length === 0) {
      // Değerlendirme yoksa sıfırla
      const berberRef = ref(db, `users/${barberId}`);
      await update(berberRef, {
        rating: 0,
        reviewCount: 0,
      });
      return;
    }

    // Ortalama puanı hesapla
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Berberin verilerini güncelle
    const berberRef = ref(db, `users/${barberId}`);
    await update(berberRef, {
      rating: averageRating,
      reviewCount: reviews.length,
    });
  } catch (error) {
    console.error("Berber puanı güncellenirken hata oluştu:", error);
    throw error;
  }
};
