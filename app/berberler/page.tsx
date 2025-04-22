"use client";

import { useState, useEffect } from "react";
import { Barber } from "@/types";
import BerberCard from "@/components/berber/BerberCard";
import { getAllBarbers } from "@/services/berberService";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function BerbersPage() {
  const [berbers, setBerbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState(0);

  useEffect(() => {
    const fetchBerbers = async () => {
      try {
        const berberData = await getAllBarbers();
        setBerbers(berberData);
      } catch (error) {
        console.error("Berberler alınamadı:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBerbers();
  }, []);

  // Filtreleme ve arama
  const filteredBerbers = berbers.filter((berber) => {
    const matchesSearch = berber.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesRating = filterRating === 0 || berber.rating >= filterRating;
    return matchesSearch && matchesRating;
  });

  return (
    <ProtectedRoute>
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Berberler
          </h1>

          {/* Filtreleme ve Arama */}
          <div className="mb-8 bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Berber Ara
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Berber adı..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:w-64">
                <label
                  htmlFor="rating"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Minimum Puan
                </label>
                <select
                  id="rating"
                  value={filterRating}
                  onChange={(e) => setFilterRating(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Tümü</option>
                  <option value={1}>1+ Yıldız</option>
                  <option value={2}>2+ Yıldız</option>
                  <option value={3}>3+ Yıldız</option>
                  <option value={4}>4+ Yıldız</option>
                  <option value={5}>5 Yıldız</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredBerbers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBerbers.map((berber) => (
                <BerberCard key={berber.id} berber={berber} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white shadow rounded-lg">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-xl font-medium text-gray-900">
                Kayıtlı Berber Bulunamadı
              </h3>
              <p className="mt-1 text-gray-500 text-lg">
                {searchTerm || filterRating > 0
                  ? "Arama kriterlerine uygun berber bulunamadı."
                  : "Şu anda sistemimizde kayıtlı berber bulunmuyor."}
              </p>
              <div className="mt-6">
                <a
                  href="/kayit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Berber Olarak Kaydol
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
