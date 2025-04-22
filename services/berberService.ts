import {
  ref,
  get,
  query,
  orderByChild,
  equalTo,
  set,
  push,
  remove,
  update,
} from "firebase/database";
import { db } from "@/lib/firebase";
import {
  Barber,
  Service,
  Availability,
  Appointment,
  FavoriteBarber,
} from "@/types";

// Tüm berberleri getir
export const getAllBarbers = async (): Promise<Barber[]> => {
  try {
    const usersRef = ref(db, "users");
    const usersSnapshot = await get(
      query(usersRef, orderByChild("role"), equalTo("barber"))
    );

    const berberData: Barber[] = [];
    if (usersSnapshot.exists()) {
      usersSnapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val() as Barber;
        // Ensure required fields have default values
        data.rating = data.rating ?? 0;
        data.reviewCount = data.reviewCount ?? 0;
        data.experience = data.experience ?? 0;
        data.services = data.services || [];

        // Hizmetleri getir
        try {
          const servicesRef = ref(db, `users/${childSnapshot.key}/services`);
          get(servicesRef).then((servicesSnapshot) => {
            if (servicesSnapshot.exists()) {
              const services: Service[] = [];
              servicesSnapshot.forEach((serviceSnapshot) => {
                services.push({
                  id: serviceSnapshot.key,
                  ...serviceSnapshot.val(),
                } as Service);
              });
              data.services = services;
            }
          });
        } catch (error) {
          console.error(
            `Berber ${childSnapshot.key} için hizmetler alınamadı:`,
            error
          );
        }

        berberData.push({
          ...data,
          id: childSnapshot.key,
        });
      });
    }

    return berberData;
  } catch (error) {
    console.error("Berberler alınamadı:", error);
    throw error;
  }
};

// Belirli bir berberi getir
export const getBarberById = async (
  barberId: string
): Promise<Barber | null> => {
  try {
    const berberRef = ref(db, `users/${barberId}`);
    const berberSnapshot = await get(berberRef);

    if (!berberSnapshot.exists()) {
      return null;
    }

    const berberData = berberSnapshot.val() as Barber;
    const berber: Barber = {
      ...berberData,
      id: barberId,
      services: [],
    };

    // Hizmetleri getir
    const servicesRef = ref(db, `services`);
    const servicesQuery = query(
      servicesRef,
      orderByChild("barberId"),
      equalTo(barberId)
    );
    const servicesSnapshot = await get(servicesQuery);

    if (servicesSnapshot.exists()) {
      const servicesList: Service[] = [];
      servicesSnapshot.forEach((serviceSnapshot) => {
        servicesList.push({
          id: serviceSnapshot.key,
          ...serviceSnapshot.val(),
        } as Service);
      });
      berber.services = servicesList;
    }

    return berber;
  } catch (error) {
    console.error("Berber bilgileri alınamadı:", error);
    throw error;
  }
};

// Berberin müsaitlik zamanlarını getir
export const getBarberAvailability = async (
  barberId: string
): Promise<Availability[]> => {
  try {
    const availabilityRef = ref(db, `users/${barberId}/availability`);
    const availabilitySnapshot = await get(availabilityRef);

    const availabilityList: Availability[] = [];
    if (availabilitySnapshot.exists()) {
      availabilitySnapshot.forEach((daySnapshot) => {
        availabilityList.push({
          id: daySnapshot.key,
          ...daySnapshot.val(),
        } as Availability);
      });
    }

    return availabilityList;
  } catch (error) {
    console.error("Müsaitlik bilgileri alınamadı:", error);
    throw error;
  }
};

// Berberin mevcut randevularını getir
export const getBarberAppointments = async (
  barberId: string,
  fromDate?: Date
): Promise<Appointment[]> => {
  try {
    const appointmentsRef = ref(db, "appointments");
    const appointmentsSnapshot = await get(appointmentsRef);

    const appointmentsList: Appointment[] = [];
    if (appointmentsSnapshot.exists()) {
      const today = fromDate ? fromDate.toISOString().split("T")[0] : null;

      appointmentsSnapshot.forEach((appointmentSnapshot) => {
        const appointment = {
          id: appointmentSnapshot.key,
          ...appointmentSnapshot.val(),
        } as Appointment;

        // Sadece belirtilen berberin randevularını al
        if (appointment.barberId === barberId) {
          // Tarih filtresi varsa ve tarih bugünden küçükse ekleme
          if (today && appointment.date < today) {
            return;
          }

          appointmentsList.push(appointment);
        }
      });
    }

    // Randevuları tarih ve saate göre sırala
    return appointmentsList.sort((a, b) => {
      // Önce tarihe göre sırala
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      // Tarihler aynıysa saate göre sırala
      return a.time.localeCompare(b.time);
    });
  } catch (error) {
    console.error("Randevu bilgileri alınamadı:", error);
    throw error;
  }
};

// Favori berber ekle
export const addFavoriteBarber = async (
  customerId: string,
  barberId: string
): Promise<string> => {
  try {
    const favoritesRef = ref(db, `favorites`);
    const newFavoriteRef = push(favoritesRef);

    const favoriteData: Omit<FavoriteBarber, "id"> = {
      customerId,
      barberId,
      createdAt: new Date().toISOString(),
    };

    await set(newFavoriteRef, favoriteData);
    return newFavoriteRef.key as string;
  } catch (error) {
    console.error("Favori eklenirken hata oluştu:", error);
    throw error;
  }
};

// Favori berberi kaldır
export const removeFavoriteBarber = async (
  favoriteId: string
): Promise<void> => {
  try {
    const favoriteRef = ref(db, `favorites/${favoriteId}`);
    await remove(favoriteRef);
  } catch (error) {
    console.error("Favori kaldırılırken hata oluştu:", error);
    throw error;
  }
};

// Müşterinin favori berberlerini getir
export const getUserFavoriteBarbers = async (
  customerId: string
): Promise<FavoriteBarber[]> => {
  try {
    const favoritesRef = ref(db, "favorites");
    const favoritesQuery = query(
      favoritesRef,
      orderByChild("customerId"),
      equalTo(customerId)
    );
    const favoritesSnapshot = await get(favoritesQuery);

    const favorites: FavoriteBarber[] = [];
    if (favoritesSnapshot.exists()) {
      favoritesSnapshot.forEach((favoriteSnapshot) => {
        favorites.push({
          id: favoriteSnapshot.key,
          ...favoriteSnapshot.val(),
        } as FavoriteBarber);
      });
    }

    return favorites;
  } catch (error) {
    console.error("Favori berberler alınamadı:", error);
    throw error;
  }
};

// Berber favori mi kontrolü
export const isBarberFavorite = async (
  customerId: string,
  barberId: string
): Promise<{ isFavorite: boolean; favoriteId?: string }> => {
  try {
    const favoritesRef = ref(db, "favorites");
    const favoritesSnapshot = await get(favoritesRef);

    if (favoritesSnapshot.exists()) {
      let favoriteId: string | undefined;
      let isFavorite = false;

      favoritesSnapshot.forEach((favoriteSnapshot) => {
        const favorite = favoriteSnapshot.val() as FavoriteBarber;
        if (
          favorite.customerId === customerId &&
          favorite.barberId === barberId
        ) {
          isFavorite = true;
          favoriteId = favoriteSnapshot.key as string;
          return true; // forEach döngüsünü durdur
        }
      });

      return { isFavorite, favoriteId };
    }

    return { isFavorite: false };
  } catch (error) {
    console.error("Favori kontrolü yapılamadı:", error);
    throw error;
  }
};

// Yeni hizmet ekle
export const addService = async (
  service: Omit<Service, "id">
): Promise<string> => {
  try {
    const servicesRef = ref(db, "services");
    const newServiceRef = push(servicesRef);

    // Firebase hata vermemesi için undefined olan description alanını kaldır
    const serviceData = { ...service };
    if (serviceData.description === undefined) {
      delete serviceData.description;
    }

    await set(newServiceRef, serviceData);
    return newServiceRef.key as string;
  } catch (error) {
    console.error("Hizmet eklenirken hata oluştu:", error);
    throw error;
  }
};

// Hizmet güncelle
export const updateService = async (
  serviceId: string,
  serviceData: Partial<Service>
): Promise<void> => {
  try {
    const serviceRef = ref(db, `services/${serviceId}`);

    // Firebase hata vermemesi için undefined değerleri temizle
    const cleanedData = { ...serviceData };
    Object.keys(cleanedData).forEach((key) => {
      if (cleanedData[key as keyof Partial<Service>] === undefined) {
        delete cleanedData[key as keyof Partial<Service>];
      }
    });

    await update(serviceRef, cleanedData);
  } catch (error) {
    console.error("Hizmet güncellenirken hata oluştu:", error);
    throw error;
  }
};

// Hizmet sil
export const deleteService = async (serviceId: string): Promise<void> => {
  try {
    const serviceRef = ref(db, `services/${serviceId}`);
    await remove(serviceRef);
  } catch (error) {
    console.error("Hizmet silinirken hata oluştu:", error);
    throw error;
  }
};
