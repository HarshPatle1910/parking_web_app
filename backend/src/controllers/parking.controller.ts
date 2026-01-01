import { Request, Response } from 'express';
import { parkingService } from '../services/parking.service';
import { vehicleEntrySchema, vehicleExitSchema, chargeCalculationSchema } from '../utils/validation';
import { logger } from '../utils/logger';

export class ParkingController {
  /**
   * POST /api/parking/entry
   * Record vehicle entry
   */
  async recordEntry(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const validatedData = vehicleEntrySchema.parse(req.body);

      const session = await parkingService.recordEntry(ownerId, validatedData);

      res.status(201).json({
        success: true,
        data: session,
        message: 'Vehicle entry recorded successfully',
      });
    } catch (error: any) {
      logger.error('Error in recordEntry controller', { error });
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to record vehicle entry',
      });
    }
  }

  /**
   * POST /api/parking/exit
   * Record vehicle exit
   */
  async recordExit(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const validatedData = vehicleExitSchema.parse(req.body);

      const session = await parkingService.recordExit(ownerId, validatedData);

      res.status(200).json({
        success: true,
        data: session,
        message: 'Vehicle exit recorded successfully',
      });
    } catch (error: any) {
      logger.error('Error in recordExit controller', { error });
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to record vehicle exit',
      });
    }
  }

  /**
   * POST /api/parking/calculate-charge
   * Calculate or override parking charge
   */
  async calculateCharge(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const validatedData = chargeCalculationSchema.parse(req.body);

      const session = await parkingService.calculateCharge(ownerId, validatedData);

      res.status(200).json({
        success: true,
        data: session,
        message: 'Charge calculated successfully',
      });
    } catch (error: any) {
      logger.error('Error in calculateCharge controller', { error });
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to calculate charge',
      });
    }
  }

  /**
   * POST /api/parking/send-receipt
   * Send receipt via WhatsApp
   */
  async sendReceipt(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const { sessionId, recipientPhone } = req.body;

      if (!sessionId || !recipientPhone) {
        res.status(400).json({
          success: false,
          error: 'sessionId and recipientPhone are required',
        });
        return;
      }

      const result = await parkingService.sendReceipt(ownerId, sessionId, recipientPhone);

      res.status(200).json({
        success: result.success,
        message: result.success
          ? 'Receipt sent successfully'
          : 'Failed to send receipt',
      });
    } catch (error: any) {
      logger.error('Error in sendReceipt controller', { error });
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to send receipt',
      });
    }
  }

  /**
   * GET /api/parking/dashboard
   * Get dashboard statistics
   */
  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const stats = await parkingService.getDashboardStats(ownerId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Error in getDashboardStats controller', { error });
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get dashboard stats',
      });
    }
  }

  /**
   * GET /api/parking/search?q=vehicleNumber
   * Search vehicles by number
   */
  async searchVehicles(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const query = req.query.q as string;

      if (!query) {
        res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
        return;
      }

      const sessions = await parkingService.searchVehicles(ownerId, query);

      res.status(200).json({
        success: true,
        data: sessions,
      });
    } catch (error: any) {
      logger.error('Error in searchVehicles controller', { error });
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to search vehicles',
      });
    }
  }
}

export const parkingController = new ParkingController();

