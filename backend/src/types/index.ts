// Common types and interfaces

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface VehicleEntryRequest {
  vehicleNumber: string;
  imageUrl?: string;
  timestamp?: string;
}

export interface VehicleExitRequest {
  vehicleNumber: string;
  imageUrl?: string;
  timestamp?: string;
}

export interface ChargeCalculationRequest {
  sessionId: string;
  amount?: number; // If provided, manual override
  hourlyRate?: number; // Optional override
}

export interface DashboardStats {
  todayEarnings: number;
  activeVehicles: number;
  totalSessions: number;
  averageDuration: number;
  recentSessions: ParkingSession[];
  earningsChart: EarningsData[];
}

export interface EarningsData {
  date: string;
  amount: number;
}

export interface ParkingSession {
  id: string;
  vehicleNumber: string;
  entryTime: Date;
  exitTime?: Date;
  durationMinutes?: number;
  amount?: number;
  status: string;
  receiptSent: boolean;
}

export interface WhatsAppMessage {
  to: string;
  vehicleNumber: string;
  entryTime: Date;
  exitTime: Date;
  duration: number;
  amount: number;
  paymentLink?: string;
}

