import { PrismaClient } from '@prisma/client';
import { whatsappService } from './whatsapp.service';
import { logger } from '../utils/logger';
import { VehicleEntryRequest, VehicleExitRequest, ChargeCalculationRequest } from '../types';

const prisma = new PrismaClient();

export class ParkingService {
  /**
   * Record vehicle entry
   */
  async recordEntry(ownerId: string, data: VehicleEntryRequest) {
    try {
      // Check if there's an active session for this vehicle
      const activeSession = await prisma.parkingSession.findFirst({
        where: {
          ownerId,
          vehicleNumber: data.vehicleNumber,
          status: 'active',
        },
      });

      if (activeSession) {
        throw new Error('Vehicle already has an active parking session');
      }

      // Create new parking session
      const session = await prisma.parkingSession.create({
        data: {
          ownerId,
          vehicleNumber: data.vehicleNumber,
          entryTime: data.timestamp ? new Date(data.timestamp) : new Date(),
          entryImageUrl: data.imageUrl,
          status: 'active',
        },
      });

      // Update vehicle history
      await this.updateVehicleHistory(ownerId, data.vehicleNumber);

      logger.info('Vehicle entry recorded', {
        sessionId: session.id,
        vehicleNumber: data.vehicleNumber,
        ownerId,
      });

      return session;
    } catch (error) {
      logger.error('Error recording vehicle entry', { error, data });
      throw error;
    }
  }

  /**
   * Record vehicle exit
   */
  async recordExit(ownerId: string, data: VehicleExitRequest) {
    try {
      // Find active session
      const session = await prisma.parkingSession.findFirst({
        where: {
          ownerId,
          vehicleNumber: data.vehicleNumber,
          status: 'active',
        },
        orderBy: {
          entryTime: 'desc',
        },
      });

      if (!session) {
        throw new Error('No active parking session found for this vehicle');
      }

      const exitTime = data.timestamp ? new Date(data.timestamp) : new Date();
      const durationMinutes = Math.floor(
        (exitTime.getTime() - session.entryTime.getTime()) / (1000 * 60)
      );

      // Get owner settings for auto-calculation
      const settings = await prisma.parkingSettings.findUnique({
        where: { ownerId },
      });

      let amount: number | null = null;
      if (settings?.autoCalculate && settings.hourlyRate > 0) {
        const hours = durationMinutes / 60;
        amount = Math.ceil(hours) * settings.hourlyRate; // Round up to nearest hour
      }

      // Update session
      const updatedSession = await prisma.parkingSession.update({
        where: { id: session.id },
        data: {
          exitTime,
          exitImageUrl: data.imageUrl,
          durationMinutes,
          amount,
          status: 'completed',
        },
      });

      logger.info('Vehicle exit recorded', {
        sessionId: updatedSession.id,
        vehicleNumber: data.vehicleNumber,
        durationMinutes,
        amount,
      });

      return updatedSession;
    } catch (error) {
      logger.error('Error recording vehicle exit', { error, data });
      throw error;
    }
  }

  /**
   * Calculate or override parking charge
   */
  async calculateCharge(ownerId: string, data: ChargeCalculationRequest) {
    try {
      const session = await prisma.parkingSession.findFirst({
        where: {
          id: data.sessionId,
          ownerId,
        },
      });

      if (!session) {
        throw new Error('Parking session not found');
      }

      if (session.status !== 'completed') {
        throw new Error('Session must be completed before calculating charge');
      }

      let amount: number;

      // Manual override
      if (data.amount !== undefined) {
        amount = data.amount;
      } else {
        // Auto-calculate
        const settings = await prisma.parkingSettings.findUnique({
          where: { ownerId },
        });

        const hourlyRate = data.hourlyRate || settings?.hourlyRate || 0;
        
        if (hourlyRate <= 0) {
          throw new Error('Hourly rate not configured');
        }

        if (!session.durationMinutes) {
          throw new Error('Duration not available for calculation');
        }

        const hours = session.durationMinutes / 60;
        amount = Math.ceil(hours) * hourlyRate;
      }

      const updatedSession = await prisma.parkingSession.update({
        where: { id: session.id },
        data: {
          amount,
          amountType: data.amount !== undefined ? 'manual' : 'auto',
        },
      });

      logger.info('Charge calculated', {
        sessionId: session.id,
        amount,
        type: updatedSession.amountType,
      });

      return updatedSession;
    } catch (error) {
      logger.error('Error calculating charge', { error, data });
      throw error;
    }
  }

  /**
   * Send receipt via WhatsApp
   */
  async sendReceipt(ownerId: string, sessionId: string, recipientPhone: string) {
    try {
      const session = await prisma.parkingSession.findFirst({
        where: {
          id: sessionId,
          ownerId,
        },
      });

      if (!session) {
        throw new Error('Parking session not found');
      }

      if (session.status !== 'completed' || !session.exitTime || !session.amount) {
        throw new Error('Session must be completed with exit time and amount');
      }

      if (!session.durationMinutes) {
        throw new Error('Duration not available');
      }

      // Send WhatsApp message
      const sent = await whatsappService.sendReceipt({
        to: recipientPhone,
        vehicleNumber: session.vehicleNumber,
        entryTime: session.entryTime,
        exitTime: session.exitTime,
        duration: session.durationMinutes,
        amount: session.amount,
      });

      if (sent) {
        await prisma.parkingSession.update({
          where: { id: session.id },
          data: {
            receiptSent: true,
            receiptSentAt: new Date(),
          },
        });
      }

      return { success: sent };
    } catch (error) {
      logger.error('Error sending receipt', { error, sessionId });
      throw error;
    }
  }

  /**
   * Update vehicle history
   */
  private async updateVehicleHistory(ownerId: string, vehicleNumber: string) {
    try {
      await prisma.vehicleHistory.upsert({
        where: {
          vehicleNumber_ownerId: {
            vehicleNumber,
            ownerId,
          },
        },
        update: {
          totalVisits: { increment: 1 },
          lastVisit: new Date(),
        },
        create: {
          vehicleNumber,
          ownerId,
          totalVisits: 1,
          lastVisit: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error updating vehicle history', { error });
      // Don't throw - this is not critical
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(ownerId: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Today's earnings
      const todaySessions = await prisma.parkingSession.findMany({
        where: {
          ownerId,
          status: 'completed',
          exitTime: {
            gte: today,
          },
        },
      });

      const todayEarnings = todaySessions.reduce(
        (sum, session) => sum + (session.amount || 0),
        0
      );

      // Active vehicles
      const activeVehicles = await prisma.parkingSession.count({
        where: {
          ownerId,
          status: 'active',
        },
      });

      // Total sessions today
      const totalSessions = todaySessions.length;

      // Average duration
      const completedSessions = todaySessions.filter(
        (s) => s.durationMinutes !== null
      );
      const averageDuration =
        completedSessions.length > 0
          ? completedSessions.reduce(
              (sum, s) => sum + (s.durationMinutes || 0),
              0
            ) / completedSessions.length
          : 0;

      // Recent sessions (last 10)
      const recentSessions = await prisma.parkingSession.findMany({
        where: {
          ownerId,
        },
        orderBy: {
          entryTime: 'desc',
        },
        take: 10,
      });

      // Earnings chart data (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const lastWeekSessions = await prisma.parkingSession.findMany({
        where: {
          ownerId,
          status: 'completed',
          exitTime: {
            gte: sevenDaysAgo,
          },
        },
      });

      // Group by date
      const earningsByDate = new Map<string, number>();
      lastWeekSessions.forEach((session) => {
        if (session.exitTime) {
          const dateKey = session.exitTime.toISOString().split('T')[0];
          const current = earningsByDate.get(dateKey) || 0;
          earningsByDate.set(dateKey, current + (session.amount || 0));
        }
      });

      const earningsChart = Array.from(earningsByDate.entries())
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        todayEarnings,
        activeVehicles,
        totalSessions,
        averageDuration: Math.round(averageDuration),
        recentSessions: recentSessions.map((s) => ({
          id: s.id,
          vehicleNumber: s.vehicleNumber,
          entryTime: s.entryTime,
          exitTime: s.exitTime,
          durationMinutes: s.durationMinutes,
          amount: s.amount,
          status: s.status,
          receiptSent: s.receiptSent,
        })),
        earningsChart,
      };
    } catch (error) {
      logger.error('Error getting dashboard stats', { error, ownerId });
      throw error;
    }
  }

  /**
   * Search vehicles by number
   */
  async searchVehicles(ownerId: string, query: string) {
    try {
      const sessions = await prisma.parkingSession.findMany({
        where: {
          ownerId,
          vehicleNumber: {
            contains: query,
            mode: 'insensitive',
          },
        },
        orderBy: {
          entryTime: 'desc',
        },
        take: 50,
      });

      return sessions;
    } catch (error) {
      logger.error('Error searching vehicles', { error, ownerId, query });
      throw error;
    }
  }
}

export const parkingService = new ParkingService();

