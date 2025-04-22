import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { FavoriteBarber, Barber } from "@/types";
import {
  getUserFavoriteBarbers,
  isBarberFavorite,
  addFavoriteBarber,
  removeFavoriteBarber,
  getBarberById,
} from "@/services/berberService";

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteBarber[]>([]);
  const [favoriteBarbers, setFavoriteBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Favori berberleri getir
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setFavoriteBarbers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const favoritesList = await getUserFavoriteBarbers(user.uid);
      setFavorites(favoritesList);

      // Favori berberlerin detaylarını getir
      const barbers: Barber[] = [];
      for (const favorite of favoritesList) {
        const barber = await getBarberById(favorite.barberId);
        if (barber) {
          barbers.push(barber);
        }
      }
      setFavoriteBarbers(barbers);
    } catch (error: any) {
      console.error("Favori berberler alınamadı:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Favori kontrol et
  const checkIsFavorite = useCallback(
    async (barberId: string) => {
      if (!user) return { isFavorite: false };
      try {
        return await isBarberFavorite(user.uid, barberId);
      } catch (error: any) {
        console.error("Favori kontrolü yapılamadı:", error);
        return { isFavorite: false };
      }
    },
    [user]
  );

  // Favorilere ekle
  const addToFavorites = useCallback(
    async (barberId: string) => {
      if (!user) return null;
      try {
        setError("");
        const favoriteId = await addFavoriteBarber(user.uid, barberId);
        await fetchFavorites(); // Favorileri yeniden yükle
        return favoriteId;
      } catch (error: any) {
        console.error("Favorilere eklenirken hata oluştu:", error);
        setError(error.message);
        return null;
      }
    },
    [user, fetchFavorites]
  );

  // Favorilerden çıkar
  const removeFromFavorites = useCallback(
    async (favoriteId: string) => {
      try {
        setError("");
        await removeFavoriteBarber(favoriteId);
        await fetchFavorites(); // Favorileri yeniden yükle
        return true;
      } catch (error: any) {
        console.error("Favorilerden çıkarılırken hata oluştu:", error);
        setError(error.message);
        return false;
      }
    },
    [fetchFavorites]
  );

  // Component mount olduğunda favorileri getir
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return {
    favorites,
    favoriteBarbers,
    loading,
    error,
    fetchFavorites,
    checkIsFavorite,
    addToFavorites,
    removeFromFavorites,
  };
}
