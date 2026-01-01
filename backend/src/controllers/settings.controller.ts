import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class SettingsController {
  /**
   * GET /api/settings
   * Get owner's parking settings
   */
  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.userId;

      const settings = await prisma.parkingSettings.findUnique({
        where: { ownerId },
      });

      if (!settings) {
        res.status(404).json({
          success: false,
          error: 'Settings not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error: any) {
      logger.error('Error in getSettings controller', { error });
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get settings',
      });
    }
  }

  /**
   * PUT /api/settings
   * Update owner's parking settings
   */
  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = req.user!.userId;
      const {
        hourlyRate,
        currency,
        autoCalculate,
        whatsappEnabled,
        whatsappNumber,
      } = req.body;

      const settings = await prisma.parkingSettings.update({
        where: { ownerId },
        data: {
          hourlyRate: hourlyRate !== undefined ? hourlyRate : undefined,
          currency: currency || undefined,
          autoCalculate: autoCalculate !== undefined ? autoCalculate : undefined,
          whatsappEnabled: whatsappEnabled !== undefined ? whatsappEnabled : undefined,
          whatsappNumber: whatsappNumber || undefined,
        },
      });

      logger.info('Settings updated', { ownerId });

      res.status(200).json({
        success: true,
        data: settings,
        message: 'Settings updated successfully',
      });
    } catch (error: any) {
      logger.error('Error in updateSettings controller', { error });
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update settings',
      });
    }
  }
}

export const settingsController = new SettingsController();

