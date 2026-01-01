import { Server } from 'socket.io';
import { logger } from '../utils/logger';
import { parkingService } from '../services/parking.service';

/**
 * Setup Socket.IO for real-time updates
 */
export function setupSocketIO(io: Server) {
  io.use((socket, next) => {
    // In production, verify JWT token here
    // For now, we'll use a simple auth mechanism
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }
    
    // TODO: Verify JWT token
    // For now, we'll accept any token
    next();
  });

  io.on('connection', (socket) => {
    logger.info('Socket client connected', { socketId: socket.id });

    // Join owner's room for real-time updates
    socket.on('join-owner-room', (ownerId: string) => {
      socket.join(`owner:${ownerId}`);
      logger.info('Socket joined owner room', { socketId: socket.id, ownerId });
    });

    // Handle vehicle entry
    socket.on('vehicle-entry', async (data: { ownerId: string; vehicleNumber: string }) => {
      try {
        // Emit to owner's room
        io.to(`owner:${data.ownerId}`).emit('vehicle-entered', {
          vehicleNumber: data.vehicleNumber,
          timestamp: new Date(),
        });
      } catch (error) {
        logger.error('Error handling vehicle entry socket event', { error });
      }
    });

    // Handle vehicle exit
    socket.on('vehicle-exit', async (data: { ownerId: string; vehicleNumber: string }) => {
      try {
        // Emit to owner's room
        io.to(`owner:${data.ownerId}`).emit('vehicle-exited', {
          vehicleNumber: data.vehicleNumber,
          timestamp: new Date(),
        });
      } catch (error) {
        logger.error('Error handling vehicle exit socket event', { error });
      }
    });

    socket.on('disconnect', () => {
      logger.info('Socket client disconnected', { socketId: socket.id });
    });
  });
}

/**
 * Emit real-time update to owner
 */
export function emitToOwner(io: Server, ownerId: string, event: string, data: any) {
  io.to(`owner:${ownerId}`).emit(event, data);
}

