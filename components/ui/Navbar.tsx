"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@/types";
import { getUserData } from "@/services/authService";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const data = await getUserData(user.uid);
          if (data) {
            setUserData(data);
          }
        } catch (error) {
          console.error("Kullanıcı bilgileri alınamadı:", error);
        }
      }
      setLoading(false);
    };

    fetchUserData();
  }, [user]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const getLinkClassName = (path: string) => {
    const baseClasses = "block py-2 px-4 text-sm hover:bg-blue-50 rounded";
    return pathname === path
      ? `${baseClasses} text-blue-600 font-medium`
      : `${baseClasses} text-gray-700`;
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-blue-600">
                Berber Randevu
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link href="/" className={getLinkClassName("/")}>
              Ana Sayfa
            </Link>
            <Link href="/berberler" className={getLinkClassName("/berberler")}>
              Berberler
            </Link>

            {!loading && (
              <>
                {user ? (
                  <div className="relative ml-3">
                    <div className="flex items-center space-x-3">
                      {userData?.role === "customer" && (
                        <>
                          <Link
                            href="/randevularim"
                            className={getLinkClassName("/randevularim")}
                          >
                            Randevularım
                          </Link>
                          <Link
                            href="/favorilerim"
                            className={getLinkClassName("/favorilerim")}
                          >
                            Favorilerim
                          </Link>
                        </>
                      )}
                      {userData?.role === "barber" && (
                        <Link
                          href="/takvim"
                          className={getLinkClassName("/takvim")}
                        >
                          Takvimim
                        </Link>
                      )}
                      {userData?.role === "admin" && (
                        <Link
                          href="/admin"
                          className={getLinkClassName("/admin")}
                        >
                          Admin Panel
                        </Link>
                      )}
                      <Link
                        href="/profil"
                        className={getLinkClassName("/profil")}
                      >
                        Profil
                      </Link>
                      <button
                        onClick={logout}
                        className="py-2 px-4 text-sm text-white bg-red-500 hover:bg-red-600 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Çıkış
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Link
                      href="/giris"
                      className="py-2 px-4 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Giriş
                    </Link>
                    <Link
                      href="/kayit"
                      className="py-2 px-4 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Üye Ol
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Menüyü Aç</span>
              {isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              className={getLinkClassName("/")}
              onClick={closeMenu}
            >
              Ana Sayfa
            </Link>
            <Link
              href="/berberler"
              className={getLinkClassName("/berberler")}
              onClick={closeMenu}
            >
              Berberler
            </Link>

            {!loading && (
              <>
                {user ? (
                  <>
                    {userData?.role === "customer" && (
                      <>
                        <Link
                          href="/randevularim"
                          className={getLinkClassName("/randevularim")}
                          onClick={closeMenu}
                        >
                          Randevularım
                        </Link>
                        <Link
                          href="/favorilerim"
                          className={getLinkClassName("/favorilerim")}
                          onClick={closeMenu}
                        >
                          Favorilerim
                        </Link>
                      </>
                    )}
                    {userData?.role === "barber" && (
                      <Link
                        href="/takvim"
                        className={getLinkClassName("/takvim")}
                        onClick={closeMenu}
                      >
                        Takvimim
                      </Link>
                    )}
                    {userData?.role === "admin" && (
                      <Link
                        href="/admin"
                        className={getLinkClassName("/admin")}
                        onClick={closeMenu}
                      >
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      href="/profil"
                      className={getLinkClassName("/profil")}
                      onClick={closeMenu}
                    >
                      Profil
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        closeMenu();
                      }}
                      className="block w-full text-left py-2 px-4 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      Çıkış
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/giris"
                      className={getLinkClassName("/giris")}
                      onClick={closeMenu}
                    >
                      Giriş
                    </Link>
                    <Link
                      href="/kayit"
                      className={getLinkClassName("/kayit")}
                      onClick={closeMenu}
                    >
                      Üye Ol
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
