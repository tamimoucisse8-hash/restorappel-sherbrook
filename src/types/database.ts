export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "owner" | "admin";
export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type SubscriptionPlan = "trial" | "launch_19" | "standard_29";
export type SubscriptionStatus = "trial" | "active" | "past_due" | "cancelled";

export interface DayOpeningHours {
  open: string;   // ex: "11:00"
  close: string;  // ex: "22:00"
  closed: boolean;
}

export interface OpeningHours {
  lundi: DayOpeningHours;
  mardi: DayOpeningHours;
  mercredi: DayOpeningHours;
  jeudi: DayOpeningHours;
  vendredi: DayOpeningHours;
  samedi: DayOpeningHours;
  dimanche: DayOpeningHours;
}

export interface Restaurant {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  address: string;
  phone: string;
  cuisine_type: string;
  image_url: string | null;
  opening_hours: OpeningHours;
  max_tables: number;
  max_party_size: number;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  restaurant_id: string;
  customer_name: string;
  customer_phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS ou HH:MM
  party_size: number;
  status: ReservationStatus;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  restaurant_id: string;
  paddle_subscription_id: string | null;
  paddle_customer_id: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}
