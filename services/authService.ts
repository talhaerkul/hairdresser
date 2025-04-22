import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { ref, set, get, update } from "firebase/database";
import { auth, db } from "@/lib/firebase";
import { User } from "@/types";

// Kayıt ol
export const registerUser = async (
  email: string,
  password: string,
  name: string,
  role: "customer" | "barber" = "customer",
  photoURL?: string | null
): Promise<FirebaseUser> => {
  try {
    console.log("AuthService - Registering user:", email);

    // Firebase Authentication ile kullanıcı oluştur
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Kullanıcı profilini güncelle
    await updateProfile(userCredential.user, {
      displayName: name,
      photoURL: photoURL || undefined,
    });

    // Realtime Database'e kullanıcı verisini kaydet
    await createUserInDatabase(userCredential.user.uid, {
      id: userCredential.user.uid,
      name,
      email,
      role,
      photoURL: photoURL || undefined,
      createdAt: new Date().toISOString(),
    });

    return userCredential.user;
  } catch (error: any) {
    console.error("AuthService - Registration error:", error.message);
    throw error;
  }
};

// Giriş yap
export const loginUser = async (
  email: string,
  password: string
): Promise<FirebaseUser> => {
  try {
    console.log("AuthService - Login user:", email);

    // Firebase Authentication ile giriş yap
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Kullanıcı veritabanı kaydını kontrol et, yoksa oluştur
    await checkAndCreateUserInDatabase(userCredential.user);

    return userCredential.user;
  } catch (error: any) {
    console.error("AuthService - Login error:", error.message);
    throw error;
  }
};

// Çıkış yap
export const logoutUser = async (): Promise<void> => {
  try {
    console.log("AuthService - Logging out user");
    await signOut(auth);
  } catch (error: any) {
    console.error("AuthService - Logout error:", error.message);
    throw error;
  }
};

// Kullanıcı bilgilerini getir
export const getUserData = async (userId: string): Promise<User | null> => {
  try {
    console.log("AuthService - Getting user data for:", userId);
    const userSnapshot = await get(ref(db, `users/${userId}`));

    if (userSnapshot.exists()) {
      console.log("AuthService - User data found in database");
      return userSnapshot.val() as User;
    }

    console.log("AuthService - No user data found in database");
    return null;
  } catch (error: any) {
    console.error("AuthService - Error fetching user data:", error.message);
    return null;
  }
};

// Kullanıcı profil bilgilerini güncelle
export const updateUserProfile = async (
  userId: string,
  userData: Partial<User>
): Promise<User> => {
  try {
    console.log("AuthService - Updating user profile for:", userId);

    // Güncellenecek değerleri hazırla
    const updates = {
      ...userData,
      updatedAt: new Date().toISOString(),
    };

    // Veritabanını güncelle
    await update(ref(db, `users/${userId}`), updates);

    // Güncellenmiş verileri al ve döndür
    const updatedData = await getUserData(userId);
    if (!updatedData) {
      throw new Error("Güncellenmiş kullanıcı verisi alınamadı");
    }

    return updatedData;
  } catch (error: any) {
    console.error("AuthService - Error updating user profile:", error.message);
    throw error;
  }
};

// Kullanıcıyı veritabanında oluştur
export const createUserInDatabase = async (
  userId: string,
  userData: User
): Promise<void> => {
  try {
    console.log("AuthService - Creating user in database:", userId);

    // Users collection'ı yoksa oluştur (burada bir şey yapmaya gerek yok çünkü Realtime DB otomatik oluşturur)
    await set(ref(db, `users/${userId}`), userData);

    console.log("AuthService - User created in database successfully");
  } catch (error: any) {
    console.error(
      "AuthService - Error creating user in database:",
      error.message
    );
    throw error;
  }
};

// Kullanıcı veritabanı kaydını kontrol et, yoksa oluştur
export const checkAndCreateUserInDatabase = async (
  user: FirebaseUser
): Promise<User> => {
  try {
    console.log("AuthService - Checking if user exists in database:", user.uid);
    const userSnapshot = await get(ref(db, `users/${user.uid}`));

    if (userSnapshot.exists()) {
      console.log("AuthService - User exists in database");
      return userSnapshot.val() as User;
    }

    console.log("AuthService - User does not exist in database, creating...");
    const newUserData: User = {
      id: user.uid,
      name: user.displayName || "",
      email: user.email || "",
      photoURL: user.photoURL || undefined,
      role: "customer", // Varsayılan rol
      createdAt: new Date().toISOString(),
    };

    await createUserInDatabase(user.uid, newUserData);
    return newUserData;
  } catch (error: any) {
    console.error(
      "AuthService - Error checking/creating user in database:",
      error.message
    );
    throw error;
  }
};
