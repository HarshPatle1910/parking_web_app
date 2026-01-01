export interface Owner {
  id: string;
  email: string;
  name: string;
  shopName: string;
}

export interface ParkingSession {
  id: string;
  vehicleNumber: string;
  entryTime: string;
  exitTime?: string;
  durationMinutes?: number;
  amount?: number;
  status: string;
  receiptSent: boolean;
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

export interface AuthResponse {
  success: boolean;
  data: {
    owner: Owner;
    token: string;
  };
  message: string;
}

