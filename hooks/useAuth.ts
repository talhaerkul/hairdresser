import { useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { User, Service } from "@/types";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserData,
  updateUserProfile,
} from "@/services/authService";
import { ref, get, set, push, remove, update } from "firebase/database";

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  // Kullanıcı durumunu izle
  useEffect(() => {
    console.log("useAuth - Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log(
          "useAuth - Auth state changed: User authenticated",
          user.uid
        );
        setUser(user);
      } else {
        console.log("useAuth - Auth state changed: No user");
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Kayıt ol
  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: "customer" | "barber" = "customer",
    photoURL?: string | null,
    location?: string | null,
    specialization?: string | null
  ) => {
    try {
      console.log("useAuth - Signing up user:", email);
      setLoading(true);
      setError("");

      const result = await registerUser(email, password, name, role, photoURL);

      // Berber için ek bilgileri ekle
      if (role === "barber") {
        const userData: Partial<User> = {};

        if (location) {
          userData.location = location;
        }

        if (specialization) {
          userData.specialization = specialization;
        }

        // Eğer location veya specialization varsa profili güncelle
        if (Object.keys(userData).length > 0) {
          await updateUserProfile(result.uid, userData);
        }
      }

      console.log("useAuth - User registered successfully:", result.uid);
      return result;
    } catch (error: any) {
      console.error("useAuth - Sign up error:", error.message);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Giriş yap
  const signIn = async (email: string, password: string) => {
    try {
      console.log("useAuth - Signing in user:", email);
      setLoading(true);
      setError("");

      const result = await loginUser(email, password);
      console.log("useAuth - User signed in:", result.uid);
      return result;
    } catch (error: any) {
      console.log("useAuth - Sign in error:", error.message);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Çıkış yap
  const logout = async () => {
    try {
      console.log("useAuth - Logging out user");
      setLoading(true);
      await logoutUser();
      router.push("/");
    } catch (error: any) {
      console.error("useAuth - Logout error:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı bilgilerini getir
  const fetchUserData = async (userId: string): Promise<User | null> => {
    try {
      console.log("useAuth - Getting user data for:", userId);
      return await getUserData(userId);
    } catch (error: any) {
      console.error("useAuth - Error fetching user data:", error.message);
      return null;
    }
  };

  // Kullanıcı profilini güncelle
  const updateProfile = async (
    userId: string,
    userData: Partial<User>
  ): Promise<User> => {
    try {
      console.log("useAuth - Updating user profile for:", userId);
      const updatedUser = await updateUserProfile(userId, userData);
      return updatedUser;
    } catch (error: any) {
      console.error("useAuth - Error updating user profile:", error.message);
      throw error;
    }
  };

  // Kullanıcı lokasyonunu güncelle
  const updateLocation = async (
    userId: string,
    location: string
  ): Promise<User> => {
    try {
      console.log("useAuth - Updating location for:", userId);
      return await updateProfile(userId, { location });
    } catch (error: any) {
      console.error("useAuth - Error updating location:", error.message);
      throw error;
    }
  };

  // Kullanıcı uzmanlık alanını güncelle
  const updateSpecialization = async (
    userId: string,
    specialization: string
  ): Promise<User> => {
    try {
      console.log("useAuth - Updating specialization for:", userId);
      return await updateProfile(userId, { specialization });
    } catch (error: any) {
      console.error("useAuth - Error updating specialization:", error.message);
      throw error;
    }
  };

  // Kullanıcının hizmetlerini getir
  const getUserServices = async (userId: string): Promise<Service[]> => {
    try {
      console.log("useAuth - Getting services for user:", userId);
      const servicesRef = ref(db, "services");
      const servicesSnapshot = await get(servicesRef);

      const servicesList: Service[] = [];
      if (servicesSnapshot.exists()) {
        servicesSnapshot.forEach((child) => {
          const service = child.val() as Service;
          if (service.barberId === userId) {
            // Assign the key as id but don't spread the service object which might already have an id
            const { id, ...serviceRest } = service;
            servicesList.push({
              id: child.key as string,
              ...serviceRest,
            });
          }
        });
      }

      return servicesList;
    } catch (error: any) {
      console.error("useAuth - Error fetching user services:", error.message);
      return [];
    }
  };

  // Yeni hizmet ekle
  const addService = async (
    userId: string,
    serviceData: Omit<Service, "id" | "barberId">
  ): Promise<Service> => {
    try {
      console.log("useAuth - Adding service for user:", userId);

      // Yeni servis oluştur
      const servicesRef = ref(db, "services");
      const newServiceRef = push(servicesRef);
      const serviceId = newServiceRef.key as string;

      // Service nesnesini oluştur
      const serviceToSave = {
        ...serviceData,
        barberId: userId,
      };

      // Firebase'e kaydet
      await set(newServiceRef, serviceToSave);

      // Kaydedilen servisi döndür
      return {
        id: serviceId,
        ...serviceToSave,
      } as Service;
    } catch (error: any) {
      console.error("useAuth - Error adding service:", error.message);
      throw error;
    }
  };

  // Hizmet güncelle
  const updateService = async (
    serviceId: string,
    serviceData: Partial<Service>
  ): Promise<void> => {
    try {
      console.log("useAuth - Updating service:", serviceId);
      const serviceRef = ref(db, `services/${serviceId}`);

      // Firebase'in undefined değerleri kabul etmemesi için
      const cleanedData = { ...serviceData };
      Object.keys(cleanedData).forEach((key) => {
        if (cleanedData[key as keyof Partial<Service>] === undefined) {
          delete cleanedData[key as keyof Partial<Service>];
        }
      });

      await update(serviceRef, {
        ...cleanedData,
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("useAuth - Error updating service:", error.message);
      throw error;
    }
  };

  // Hizmet sil
  const deleteService = async (serviceId: string): Promise<void> => {
    try {
      console.log("useAuth - Deleting service:", serviceId);
      const serviceRef = ref(db, `services/${serviceId}`);
      await remove(serviceRef);
    } catch (error: any) {
      console.error("useAuth - Error deleting service:", error.message);
      throw error;
    }
  };

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    logout,
    getUserData: fetchUserData,
    updateProfile,
    updateLocation,
    updateSpecialization,
    getUserServices,
    addService,
    updateService,
    deleteService,
  };
}
