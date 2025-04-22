export interface User {
  id: string;
  name: string;
  email: string;
  role: "customer" | "barber" | "admin";
  photoURL?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
  location?: string; // Kullanıcı konumu (berber profilleri için)
  specialization?: string; // Uzmanlık alanı (berber profilleri için)
}

export interface Barber extends User {
  services: Service[];
  availability: Availability[];
  rating: number;
  reviewCount: number;
  experience: number; // Yıl cinsinden
  description?: string;
  location?: string; // Berber konumu
  specialization?: string; // Berber uzmanlık alanı
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // Dakika cinsinden
  description?: string;
  barberId: string;
}

export interface Availability {
  id: string;
  barberId: string;
  date: string; // YYYY-MM-DD formatında
  startTime: string; // HH:MM formatında
  endTime: string; // HH:MM formatında
  isAvailable: boolean;
}

export interface Appointment {
  id: string;
  customerId: string;
  barberId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD formatında
  time: string; // HH:MM formatında
  duration: number; // Dakika cinsinden
  status: "pending" | "confirmed" | "cancelled" | "completed";
  createdAt: string;
  updatedAt: string;
  serviceName: string; // Servis adı
  servicePrice: number; // Servis ücreti
  barberName: string; // Berber adı
  customerName: string; // Müşteri adı
}

export interface Review {
  id: string;
  customerId: string;
  barberId: string;
  appointmentId: string;
  rating: number; // 1-5 arası
  comment?: string;
  createdAt: string;
}

export interface FavoriteBarber {
  id: string;
  customerId: string;
  barberId: string;
  createdAt: string;
}
