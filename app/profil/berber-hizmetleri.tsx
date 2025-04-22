"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Service } from "@/types";
import { toast } from "react-hot-toast";
import {
  addService,
  updateService,
  deleteService,
  getBarberById,
} from "@/services/berberService";

export default function BerberHizmetleri() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadServices = async () => {
      if (!user) return;

      try {
        const berber = await getBarberById(user.uid);
        if (berber && berber.services) {
          setServices(berber.services);
        }
      } catch (error) {
        console.error("Hizmetler yüklenirken hata oluştu:", error);
        toast.error("Hizmetler yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [user]);

  const handleAddClick = () => {
    // Yeni ekleme modunu başlat
    setEditingService(null);
    setName("");
    setPrice("");
    setDuration("");
    setDescription("");
    setShowForm(true);
  };

  const handleEditClick = (service: Service) => {
    // Düzenleme modunu başlat
    setEditingService(service);
    setName(service.name);
    setPrice(service.price.toString());
    setDuration(service.duration.toString());
    setDescription(service.description || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Oturum açmanız gerekiyor");
      return;
    }

    if (!name || !price || !duration) {
      toast.error("Lütfen gerekli alanları doldurun");
      return;
    }

    setIsSubmitting(true);

    try {
      // Tanımlı bir description değeri oluştur (boş string yerine undefined)
      const descriptionValue = description ? description : undefined;

      const serviceData = {
        name,
        price: parseFloat(price),
        duration: parseInt(duration),
        description: descriptionValue,
        barberId: user.uid,
      };

      if (editingService) {
        // Mevcut hizmeti güncelle
        await updateService(editingService.id, serviceData);
        toast.success("Hizmet başarıyla güncellendi");

        // Yerel state'i güncelle
        setServices(
          services.map((s) =>
            s.id === editingService.id
              ? ({ ...serviceData, id: editingService.id } as Service)
              : s
          )
        );
      } else {
        // Yeni hizmet ekle
        const serviceId = await addService(serviceData);
        toast.success("Hizmet başarıyla eklendi");

        // Yerel state'e ekle
        setServices([
          ...services,
          { ...serviceData, id: serviceId } as Service,
        ]);
      }

      // Formu kapat
      setShowForm(false);
    } catch (error) {
      console.error("Hizmet kaydedilirken hata oluştu:", error);
      toast.error("Hizmet kaydedilemedi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async (serviceId: string) => {
    if (window.confirm("Bu hizmeti silmek istediğinizden emin misiniz?")) {
      try {
        await deleteService(serviceId);
        toast.success("Hizmet başarıyla silindi");

        // Yerel state'den kaldır
        setServices(services.filter((s) => s.id !== serviceId));
      } catch (error) {
        console.error("Hizmet silinirken hata oluştu:", error);
        toast.error("Hizmet silinemedi");
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingService(null);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Hizmetlerim</h2>
        <button
          onClick={handleAddClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Yeni Hizmet Ekle
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {showForm && (
            <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium mb-4">
                {editingService ? "Hizmeti Düzenle" : "Yeni Hizmet Ekle"}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hizmet Adı *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fiyat (₺) *
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Süre (dakika) *
                    </label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      min="5"
                      step="5"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Açıklama
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:bg-blue-400"
                  >
                    {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {services.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3 className="mt-2 text-md font-medium text-gray-900">
                Henüz hiç hizmetiniz bulunmuyor
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Müşterilerinize sunduğunuz hizmetleri ekleyin.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Hizmet Adı
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Fiyat
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Süre
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Açıklama
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {services.map((service) => (
                    <tr key={service.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {service.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {service.price.toFixed(2)} ₺
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {service.duration} dk
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {service.description || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditClick(service)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDeleteClick(service.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
