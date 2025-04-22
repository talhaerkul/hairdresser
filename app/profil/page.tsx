"use client";

import { useAuth } from "@/hooks/useAuth";
import { User } from "@/types";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { checkAndCreateUserInDatabase } from "@/services/authService";
import BerberHizmetleri from "./berber-hizmetleri";

export default function ProfilePage() {
  const { user, getUserData, updateProfile } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [formValues, setFormValues] = useState({
    name: "",
    phone: "",
    location: "",
    specialization: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "services">("profile");
  const [dataFetched, setDataFetched] = useState(false);
  console.log("Auth user object:", user);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user && !dataFetched) {
        setLoading(true);
        console.log("Fetching user data for:", user.uid);
        try {
          // Kullanıcı verilerini getir
          let data = await getUserData(user.uid);

          if (data) {
            console.log("User data exists in database");
            setUserData(data);
            setName(data.name || user.displayName || "");
            setPhone(data.phone || "");

            // Also set form values so they're ready when editing starts
            setFormValues({
              name: data.name || user.displayName || "",
              phone: data.phone || "",
              location: data.role === "barber" ? data.location || "" : "",
              specialization:
                data.role === "barber" ? data.specialization || "" : "",
            });
          } else {
            console.log(
              "User data does not exist in database, creating from auth data"
            );
            try {
              // Veritabanında yoksa oluştur
              data = await checkAndCreateUserInDatabase(user);
              console.log("Created new user entry in database");

              // Local state'i güncelle
              setUserData(data);
              setName(data.name);
            } catch (createError) {
              console.error("Error creating user data:", createError);
              toast.error("Kullanıcı profili oluşturulamadı, tekrar deneyin");

              // Veritabanı hatası olsa bile auth verileriyle devam et
              setUserData({
                id: user.uid,
                name: user.displayName || "",
                email: user.email || "",
                role: "customer",
              });
              setName(user.displayName || "");
            }
          }
        } catch (error) {
          console.error("Kullanıcı bilgileri alınamadı:", error);
          toast.error("Kullanıcı bilgileri alınamadı");

          // Auth verilerini yedek olarak kullan
          if (user) {
            setUserData({
              id: user.uid,
              name: user.displayName || "",
              email: user.email || "",
              role: "customer",
            });
            setName(user.displayName || "");
          }
        } finally {
          setDataFetched(true);
          setLoading(false);
        }
      } else if (!user) {
        console.log("No authenticated user found");
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, getUserData, dataFetched]);

  // Set initial form values when editing starts
  useEffect(() => {
    if (isEditing && userData) {
      setFormValues({
        name: userData.name || "",
        phone: userData.phone || "",
        location: userData.role === "barber" ? userData.location || "" : "",
        specialization:
          userData.role === "barber" ? userData.specialization || "" : "",
      });
    }
  }, [isEditing, userData]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Telefon alanı için sadece sayı kontrolü
    if (name === "phone") {
      // Sadece sayıları kabul et
      const onlyNums = value.replace(/[^0-9]/g, "");
      setFormValues((prev) => ({
        ...prev,
        [name]: onlyNums,
      }));
    } else {
      setFormValues((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    try {
      // Kullanıcı bilgilerini güncelle
      const updateData: any = {
        name: formValues.name,
        phone: formValues.phone,
      };

      if (userData && userData.role === "barber") {
        updateData.location = formValues.location;
        updateData.specialization = formValues.specialization;
      }

      const updatedUser = await updateProfile(user.uid, updateData);

      // State'leri güncelle
      setUserData(updatedUser);
      setName(updatedUser.name || "");
      setPhone(updatedUser.phone || "");

      setIsEditing(false);
      toast.success("Profil bilgileriniz güncellendi");
    } catch (error) {
      console.error("Profil güncellenirken hata oluştu:", error);
      toast.error("Profil güncellenirken hata oluştu");
    } finally {
      setIsUpdating(false);
    }
  };

  // Telefon numarasını format fonksiyonu
  const formatPhoneNumber = (phoneNumberString: string) => {
    // Telefon numarasındaki tüm rakam olmayan karakterleri temizle
    const cleaned = phoneNumberString.replace(/\D/g, "");

    // Telefon numarası formatı: 5XX XXX XX XX
    const match = cleaned.match(/^(\d{1})(\d{2})(\d{3})(\d{2})(\d{2})$/);

    if (match) {
      return `${match[1]}${match[2]} ${match[3]} ${match[4]} ${match[5]}`;
    }

    // Eğer numara 10 hane değilse olduğu gibi göster
    return phoneNumberString;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Profilim
          </h1>

          {userData?.role === "barber" && (
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-lg ${
                      activeTab === "profile"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    onClick={() => setActiveTab("profile")}
                  >
                    Profilim
                  </button>
                  <button
                    className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-lg ${
                      activeTab === "services"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    onClick={() => setActiveTab("services")}
                  >
                    Hizmetlerim
                  </button>
                </nav>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : userData ? (
            <>
              {(activeTab === "profile" || userData.role !== "barber") && (
                <div className="bg-white shadow overflow-hidden rounded-lg">
                  <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Kullanıcı Bilgileri
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Kişisel detaylar ve randevu bilgileri
                      </p>
                    </div>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Düzenle
                      </button>
                    )}
                  </div>
                  <div className="border-t border-gray-200">
                    {isEditing ? (
                      <form onSubmit={handleUpdateProfile} className="p-4">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor="name"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Ad Soyad
                            </label>
                            <input
                              type="text"
                              id="name"
                              name="name"
                              value={formValues.name}
                              onChange={handleFormChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="email"
                              className="block text-sm font-medium text-gray-700"
                            >
                              E-posta
                            </label>
                            <input
                              type="email"
                              id="email"
                              value={userData.email}
                              disabled
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="phone"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Telefon
                            </label>
                            <input
                              type="tel"
                              id="phone"
                              name="phone"
                              value={formValues.phone}
                              onChange={handleFormChange}
                              placeholder="5XX XXX XX XX"
                              inputMode="numeric"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="role"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Kullanıcı Tipi
                            </label>
                            <input
                              type="text"
                              id="role"
                              value={
                                userData.role === "customer"
                                  ? "Müşteri"
                                  : userData.role === "barber"
                                  ? "Berber"
                                  : "Admin"
                              }
                              disabled
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50"
                            />
                          </div>
                          {userData.role === "barber" && (
                            <>
                              <div>
                                <label
                                  htmlFor="location"
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  Konum
                                </label>
                                <input
                                  type="text"
                                  id="location"
                                  name="location"
                                  value={formValues.location}
                                  onChange={handleFormChange}
                                  placeholder="Örn: İstanbul/Kadıköy"
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor="specialization"
                                  className="block text-sm font-medium text-gray-700"
                                >
                                  Uzmanlık Alanı
                                </label>
                                <input
                                  type="text"
                                  id="specialization"
                                  name="specialization"
                                  value={formValues.specialization}
                                  onChange={handleFormChange}
                                  placeholder="Örn: Sakal Tıraşı, Saç Bakımı"
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            </>
                          )}
                        </div>
                        <div className="mt-6 flex items-center space-x-4">
                          <button
                            type="submit"
                            disabled={isUpdating}
                            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
                          >
                            {isUpdating ? "Güncelleniyor..." : "Güncelle"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                          >
                            İptal
                          </button>
                        </div>
                      </form>
                    ) : (
                      <dl className="divide-y divide-gray-200">
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">
                            Ad Soyad
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {userData.name}
                          </dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">
                            E-posta
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {userData.email}
                          </dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">
                            Telefon
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {userData.phone
                              ? formatPhoneNumber(userData.phone)
                              : "-"}
                          </dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">
                            Kullanıcı Tipi
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {userData.role === "customer"
                              ? "Müşteri"
                              : userData.role === "barber"
                              ? "Berber"
                              : "Admin"}
                          </dd>
                        </div>
                        {/* Kayıt Tarihi */}
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                          <dt className="text-sm font-medium text-gray-500">
                            Kayıt Tarihi
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {userData.createdAt
                              ? new Date(userData.createdAt).toLocaleDateString(
                                  "tr-TR"
                                )
                              : "-"}
                          </dd>
                        </div>
                        {userData.role === "barber" && (
                          <>
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">
                                Konum
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {userData.location || "-"}
                              </dd>
                            </div>
                            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                              <dt className="text-sm font-medium text-gray-500">
                                Uzmanlık Alanı
                              </dt>
                              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                {userData.specialization || "-"}
                              </dd>
                            </div>
                          </>
                        )}
                      </dl>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "services" && userData.role === "barber" && (
                <BerberHizmetleri />
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">
                Kullanıcı bilgileri yüklenemedi. Lütfen tekrar deneyin.
              </p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
