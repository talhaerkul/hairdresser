"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Firebase Auth ile giriş yap
      const firebaseUser = await signIn(email, password);
      console.log("Login successful, user data checked/created if needed");

      toast.success("Giriş başarılı!");
      router.push("/profil");
    } catch (error: any) {
      let errorMessage = "Giriş yapılamadı";

      if (error.code === "auth/invalid-credential") {
        errorMessage = "E-posta veya şifre hatalı";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "Kullanıcı bulunamadı";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Şifre hatalı";
      } else if (
        error.message?.includes("database") ||
        error.message?.includes("veritabanı")
      ) {
        errorMessage =
          "Veritabanı bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.";
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 mx-auto bg-white rounded-lg shadow-md">
      <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
        Giriş Yap
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Hesabınız yok mu?{" "}
          <Link href="/kayit" className="text-blue-600 hover:underline">
            Üye Ol
          </Link>
        </p>
      </div>
    </div>
  );
}
