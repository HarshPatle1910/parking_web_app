import { z } from 'zod';

// Vehicle entry validation
export const vehicleEntrySchema = z.object({
  vehicleNumber: z.string().min(1, 'Vehicle number is required').max(20),
  imageUrl: z.string().url().optional(),
  timestamp: z.string().datetime().optional(),
});

// Vehicle exit validation
export const vehicleExitSchema = z.object({
  vehicleNumber: z.string().min(1, 'Vehicle number is required').max(20),
  imageUrl: z.string().url().optional(),
  timestamp: z.string().datetime().optional(),
});

// Charge calculation validation
export const chargeCalculationSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  amount: z.number().positive().optional(),
  hourlyRate: z.number().positive().optional(),
});

// Owner registration validation
export const ownerRegistrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  shopName: z.string().min(1, 'Shop name is required'),
  phone: z.string().optional(),
});

// Owner login validation
export const ownerLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

