import { Barber } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useFavorites } from "@/hooks/useFavorites";

interface BerberCardProps {
  berber: Barber;
}

export default function BerberCard({ berber }: BerberCardProps) {
  // Default values for rating and reviewCount if they're undefined
  const rating = berber.rating ?? 0;
  const reviewCount = berber.reviewCount ?? 0;
  const experience = berber.experience ?? 0;

  const { user } = useAuth();
  const { checkIsFavorite, addToFavorites, removeFromFavorites } =
    useFavorites();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);

  // Favori durumunu kontrol et
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (user && berber.id) {
        const result = await checkIsFavorite(berber.id);
        setIsFavorite(result.isFavorite);
        setFavoriteId(result.favoriteId);
      } else {
        setIsFavorite(false);
        setFavoriteId(undefined);
      }
    };

    checkFavoriteStatus();
  }, [user, berber.id, checkIsFavorite]);

  // Favori ekle/kaldır
  const toggleFavorite = async () => {
    if (!user) return;
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      if (isFavorite && favoriteId) {
        await removeFromFavorites(favoriteId);
        setIsFavorite(false);
        setFavoriteId(undefined);
      } else {
        const newFavoriteId = await addToFavorites(berber.id);
        if (newFavoriteId) {
          setIsFavorite(true);
          setFavoriteId(newFavoriteId);
        }
      }
    } catch (error) {
      console.error("Favori işlemi başarısız:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48">
        <Image
          src={berber.photoURL || "/berber_profile.png"}
          alt={berber.name}
          className="object-cover"
          fill
        />
        {user && (
          <button
            onClick={toggleFavorite}
            disabled={isProcessing}
            className="absolute top-2 right-2 p-2 bg-white bg-opacity-70 rounded-full shadow hover:bg-opacity-100 transition-all duration-200"
            aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
          >
            <svg
              className={`h-6 w-6 ${
                isFavorite ? "text-red-500 fill-current" : "text-gray-400"
              }`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={isFavorite ? "0" : "2"}
              fill={isFavorite ? "currentColor" : "none"}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {berber.name}
        </h3>
        <div className="flex items-center mb-2">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`h-5 w-5 ${
                  i < Math.floor(rating) ? "text-yellow-500" : "text-gray-300"
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="ml-2 text-sm text-gray-600">
            {rating.toFixed(1)} ({reviewCount} değerlendirme)
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          {berber.description || `${experience} yıllık deneyim`}
        </p>
        <div className="border-t border-gray-200 pt-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Hizmetler</h4>
          <ul className="space-y-1">
            {(berber.services || []).slice(0, 3).map((service) => (
              <li
                key={service.id}
                className="text-sm text-gray-600 flex justify-between"
              >
                <span>{service.name}</span>
                <span className="font-medium">{service.price} ₺</span>
              </li>
            ))}
            {(berber.services || []).length > 3 && (
              <li className="text-sm text-gray-500 italic">
                + {(berber.services || []).length - 3} daha fazla
              </li>
            )}
          </ul>
        </div>
        <div className="mt-4">
          <Link
            href={`/berberler/${berber.id}`}
            className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-md transition-colors"
          >
            Randevu Al
          </Link>
        </div>
      </div>
    </div>
  );
}
