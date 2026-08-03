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

// Shape returned by GET /api/technicians — the backend hydrates the
// `user` relation and a list of `service`s for each profile. Cards on
// /technicians read both `user.name` and the nested `service` array.
export interface TechnicianProfile {
  id: string;
  userId: string;
  bio?: string | null;
  yearsOfExperience?: number | null;
  averageRating?: number;
  totalReviews?: number;
  user: {
    id: string;
    name: string;
    email?: string;
    phone?: string | null;
    profileImage?: string | null;
  };
  service?: Array<{
    id: string;
    title: string;
    hourlyRate: string | number;
    location?: string;
    averageRating?: number;
    category?: { id: string; name: string };
  }>;
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
  bookingDate: string;
  startTime: string;
  endTime: string;
  hourlyRate?: number | string;
  totalAmount: number | string;
  customerAddress?: string | null;
  createdAt: string;
  technician?: {
    id: string;
    bio?: string;
    yearsOfExperience?: number;
    averageRating?: number;
    totalReviews?: number;
    profileImage?: string | null;
    user?: {
      id: string;
      name: string;
      email?: string;
      phone?: string;
      profileImage?: string | null;
    };
  };
  service?: {
    id: string;
    title: string;
    description?: string;
    hourlyRate: number | string;
    location?: string;
    category?: { id: string; name: string };
  };
  payment?: {
    id: string;
    amount?: number | string;
    status: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "SUCCEEDED";
    paymentMethod?: string | null;
    currency?: string;
    stripePaymentIntentId?: string | null;
    paidAt?: string | null;
    createdAt?: string;
  };
  review?: { id: string; rating: number; comment?: string };
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