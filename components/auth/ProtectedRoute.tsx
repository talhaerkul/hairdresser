"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User } from "@/types";
import { checkAndCreateUserInDatabase } from "@/services/authService";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("customer" | "barber" | "admin")[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, loading, getUserData } = useAuth();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      console.log(
        "ProtectedRoute - Auth state:",
        loading ? "loading" : user ? "authenticated" : "not authenticated"
      );

      if (!loading && !user) {
        console.log(
          "ProtectedRoute - No authenticated user, redirecting to login"
        );
        router.push("/giris");
        return;
      }

      if (user) {
        console.log("ProtectedRoute - User authenticated:", user.uid);
        try {
          // Kullanıcı verilerini getir, yoksa oluştur
          let userData: User | null = await getUserData(user.uid);

          if (!userData) {
            console.log(
              "ProtectedRoute - User data doesn't exist, creating new entry"
            );
            try {
              userData = await checkAndCreateUserInDatabase(user);
              console.log("ProtectedRoute - User data created in database");
            } catch (createError) {
              console.error(
                "ProtectedRoute - Error creating user data:",
                createError
              );
              // Varsayılan rol ile devam et
              userData = {
                id: user.uid,
                name: user.displayName || "",
                email: user.email || "",
                role: "customer",
                createdAt: new Date().toISOString(),
              };
            }
          }

          setUserRole(userData.role);

          if (allowedRoles && !allowedRoles.includes(userData.role as any)) {
            console.log(
              "ProtectedRoute - User does not have required role, redirecting"
            );
            router.push("/yetkisiz");
          }
        } catch (error) {
          console.error("ProtectedRoute - Error checking user role:", error);

          // Bağlantı hatası durumunda varsayılan rol ile devam et
          if (
            (error as any)?.code === "NETWORK_ERROR" ||
            ((error as Error)?.message || "").includes("offline")
          ) {
            console.warn(
              "ProtectedRoute - Network/database error, using default customer role"
            );
            setUserRole("customer");

            if (allowedRoles && !allowedRoles.includes("customer")) {
              router.push("/yetkisiz");
            }
          } else {
            router.push("/giris");
          }
        }
      }

      setIsLoading(false);
    };

    checkRole();
  }, [user, loading, router, allowedRoles, getUserData]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
