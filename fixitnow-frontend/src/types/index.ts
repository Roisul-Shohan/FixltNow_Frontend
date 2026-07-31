export type Role = "ADMIN" | "TECHNICIAN" | "CUSTOMER";
export type BookingStatus = "PENDING" | "ACCEPTED" | "PAID" | "COMPLETED" | "DECLINED" | "CANCELLED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  address?: string | null;
  image?: string | null;
  status?: "ACTIVE" | "BLOCKED";
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  image?: string;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  image?: string;
  bio?: string;
  experience?: number;
  averageRating?: number;
  totalReviews?: number;
  hourlyRate?: number;
  category?: { name: string; slug?: string };
}

export interface AvailabilitySlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  hourlyRate: number;
  location?: string;
  averageRating?: number;
  totalReviews?: number;
  category?: Category;
  technician?: Technician;
  availabilities?: AvailabilitySlot[];
  reviews?: Review[];
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  customer?: { name: string; image?: string };
  createdAt: string;
}

export interface Booking {
  id: string;
  status: BookingStatus;
  scheduledAt: string;
  durationHours: number;
  totalAmount: number;
  notes?: string | null;
  createdAt: string;
  customer?: { id: string; name: string };
  technician?: { id: string; name: string };
  service?: { id: string; title: string; hourlyRate: number };
  availability?: { date: string; startTime: string; endTime: string };
  payment?: { id: string; status: string };
  review?: { id: string; rating: number };
}

export interface Payment {
  id: string;
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  method?: string;
  transactionId?: string;
  createdAt: string;
  booking?: Booking;
}

export interface ApiSuccess<T = any> {
  success: true;
  statusCode: number;
  message?: string;
  data: T;
  meta?: { page?: number; limit?: number; total?: number };
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errorSources?: Array<{ path: string; message: string }>;
}