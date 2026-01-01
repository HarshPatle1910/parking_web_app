import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ownerRegistrationSchema, ownerLoginSchema } from '../utils/validation';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class AuthController {
  /**
   * POST /api/auth/register
   * Register new owner
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = ownerRegistrationSchema.parse(req.body);

      // Check if email already exists
      const existingOwner = await prisma.owner.findUnique({
        where: { email: validatedData.email },
      });

      if (existingOwner) {
        res.status(400).json({
          success: false,
          error: 'Email already registered',
        });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      // Create owner
      const owner = await prisma.owner.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          name: validatedData.name,
          shopName: validatedData.shopName,
          phone: validatedData.phone,
        },
      });

      // Create default parking settings
      await prisma.parkingSettings.create({
        data: {
          ownerId: owner.id,
          hourlyRate: 5.0, // Default rate
          currency: 'USD',
          autoCalculate: true,
          whatsappEnabled: true,
        },
      });

      // Generate JWT token
      const token = this.generateToken(owner.id, owner.email);

      logger.info('Owner registered', { ownerId: owner.id, email: owner.email });

      res.status(201).json({
        success: true,
        data: {
          owner: {
            id: owner.id,
            email: owner.email,
            name: owner.name,
            shopName: owner.shopName,
          },
          token,
        },
        message: 'Owner registered successfully',
      });
    } catch (error: any) {
      logger.error('Error in register controller', { error });
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to register owner',
      });
    }
  }

  /**
   * POST /api/auth/login
   * Login owner
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = ownerLoginSchema.parse(req.body);

      // Find owner
      const owner = await prisma.owner.findUnique({
        where: { email: validatedData.email },
      });

      if (!owner) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(
        validatedData.password,
        owner.password
      );

      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
        return;
      }

      // Generate JWT token
      const token = this.generateToken(owner.id, owner.email);

      logger.info('Owner logged in', { ownerId: owner.id, email: owner.email });

      res.status(200).json({
        success: true,
        data: {
          owner: {
            id: owner.id,
            email: owner.email,
            name: owner.name,
            shopName: owner.shopName,
          },
          token,
        },
        message: 'Login successful',
      });
    } catch (error: any) {
      logger.error('Error in login controller', { error });
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to login',
      });
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: string, email: string): string {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    // Type assertion needed because jsonwebtoken's StringValue type is strict
    // but runtime accepts standard string values like '7d', '1h', etc.
    return jwt.sign(
      { userId, email },
      jwtSecret,
      { expiresIn: jwtExpiresIn } as jwt.SignOptions
    );
  }
}

export const authController = new AuthController();

