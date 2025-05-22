"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import Image from "next/image";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from "@/lib/firebase";

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"customer" | "barber">("customer");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor!");
      return;
    }

    if (password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır!");
      return;
    }

    setIsLoading(true);

    try {
      // Eğer profileImage varsa, önce storage'a yükle, yoksa default değeri kullan
      let photoURL = "/berber_profile.png";

      await signUp(email, password, name, role, photoURL);
      toast.success("Kayıt başarılı! Giriş yapabilirsiniz.");
      router.push("/giris");
    } catch (error: any) {
      let errorMessage = "Kayıt oluşturulamadı";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Bu e-posta adresi zaten kullanılıyor";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Geçersiz e-posta adresi";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Şifre çok zayıf";
      } else if (
        error.message?.includes("database") ||
        error.message?.includes("veritabanı")
      ) {
        errorMessage =
          "Veritabanı hatası oluştu. Lütfen daha sonra tekrar deneyin.";
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 mx-auto bg-white rounded-lg shadow-md">
      <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
        Üye Ol
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Profil fotoğrafı yükleme */}
        <div className="flex flex-col items-center mb-4">
          <div className="relative w-24 h-24 mb-2 overflow-hidden bg-gray-100 rounded-full">
            <div className="flex items-center justify-center w-full h-full text-gray-400">
              <Image
                src={"/berber_profile.png"}
                alt="Profil Önizleme"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="name"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            Ad Soyad
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            E-posta
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            Şifre
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            Şifre Tekrar
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Kullanıcı Tipi
          </label>
          <div className="flex space-x-4">
            <div className="flex items-center">
              <input
                id="customer"
                type="radio"
                value="customer"
                checked={role === "customer"}
                onChange={() => setRole("customer")}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                required
              />
              <label
                htmlFor="customer"
                className="ml-2 text-sm font-medium text-gray-700"
              >
                Müşteri
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="barber"
                type="radio"
                value="barber"
                checked={role === "barber"}
                onChange={() => setRole("barber")}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <label
                htmlFor="barber"
                className="ml-2 text-sm font-medium text-gray-700"
              >
                Berber
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={
            isLoading
          }
          className="w-full py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {isLoading ? "Kayıt oluşturuluyor..." : "Üye Ol"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Zaten hesabınız var mı?{" "}
          <Link href="/giris" className="text-blue-600 hover:underline">
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  );
}
