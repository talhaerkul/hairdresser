"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import BerberCard from "@/components/berber/BerberCard";
import { useRouter } from "next/navigation";

export default function FavoriteBarbers() {
  const { user, loading: authLoading } = useAuth();
  const { favoriteBarbers, loading: favoritesLoading, error } = useFavorites();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Kullanıcı giriş yapmamışsa ana sayfaya yönlendir
    if (isClient && !authLoading && !user) {
      router.push("/giris?redirect=/favorilerim");
    }
  }, [isClient, user, authLoading, router]);

  if (!isClient) {
    return null;
  }

  if (authLoading || favoritesLoading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Favori Berberlerim
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {favoriteBarbers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            Favori berberiniz bulunmamaktadır
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Berberler sayfasından berberleri favorilerinize ekleyebilirsiniz.
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.push("/berberler")}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Berberleri Görüntüle
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteBarbers.map((berber) => (
            <BerberCard key={berber.id} berber={berber} />
          ))}
        </div>
      )}
    </div>
  );
}
