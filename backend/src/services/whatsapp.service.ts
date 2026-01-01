import twilio from 'twilio';
import axios from 'axios';
import { logger } from '../utils/logger';
import { WhatsAppMessage } from '../types';

/**
 * WhatsApp Service
 * Supports both Twilio and Meta WhatsApp Cloud API
 */
class WhatsAppService {
  private twilioClient: twilio.Twilio | null = null;
  private useTwilio: boolean = false;
  private useMeta: boolean = false;

  constructor() {
    // Initialize Twilio if credentials are available
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;

    if (twilioSid && twilioToken) {
      this.twilioClient = twilio(twilioSid, twilioToken);
      this.useTwilio = true;
      logger.info('WhatsApp service initialized with Twilio');
    }

    // Check for Meta WhatsApp credentials
    if (process.env.META_WHATSAPP_ACCESS_TOKEN && process.env.META_WHATSAPP_PHONE_NUMBER_ID) {
      this.useMeta = true;
      logger.info('WhatsApp service initialized with Meta API');
    }

    if (!this.useTwilio && !this.useMeta) {
      logger.warn('No WhatsApp service configured. Messages will be logged only.');
    }
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${mins} minute${mins > 1 ? 's' : ''}`;
    }
  }

  /**
   * Format message content
   */
  private formatMessage(data: WhatsAppMessage): string {
    const duration = this.formatDuration(data.duration);
    const entryTime = new Date(data.entryTime).toLocaleString();
    const exitTime = new Date(data.exitTime).toLocaleString();

    let message = `🚗 *Parking Receipt*\n\n`;
    message += `Vehicle Number: *${data.vehicleNumber}*\n`;
    message += `Entry Time: ${entryTime}\n`;
    message += `Exit Time: ${exitTime}\n`;
    message += `Duration: ${duration}\n`;
    message += `Amount: *${data.amount.toFixed(2)}*\n`;

    if (data.paymentLink) {
      message += `\nPayment Link: ${data.paymentLink}`;
    }

    message += `\n\nThank you for using our parking service!`;

    return message;
  }

  /**
   * Send WhatsApp message via Twilio
   */
  private async sendViaTwilio(data: WhatsAppMessage): Promise<boolean> {
    if (!this.twilioClient) {
      throw new Error('Twilio client not initialized');
    }

    const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    const message = this.formatMessage(data);

    try {
      await this.twilioClient.messages.create({
        from: twilioWhatsAppNumber,
        to: `whatsapp:${data.to}`,
        body: message,
      });

      logger.info('WhatsApp message sent via Twilio', {
        to: data.to,
        vehicleNumber: data.vehicleNumber,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send WhatsApp message via Twilio', { error });
      throw error;
    }
  }

  /**
   * Send WhatsApp message via Meta API
   */
  private async sendViaMeta(data: WhatsAppMessage): Promise<boolean> {
    const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      throw new Error('Meta WhatsApp credentials not configured');
    }

    const message = this.formatMessage(data);
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

    try {
      await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to: data.to,
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('WhatsApp message sent via Meta API', {
        to: data.to,
        vehicleNumber: data.vehicleNumber,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send WhatsApp message via Meta API', { error });
      throw error;
    }
  }

  /**
   * Send parking receipt via WhatsApp
   */
  async sendReceipt(data: WhatsAppMessage): Promise<boolean> {
    // In development/mock mode, just log the message
    if (process.env.NODE_ENV === 'development' && !this.useTwilio && !this.useMeta) {
      logger.info('WhatsApp message (mock mode)', {
        message: this.formatMessage(data),
        to: data.to,
      });
      return true;
    }

    try {
      // Try Twilio first, then Meta
      if (this.useTwilio) {
        return await this.sendViaTwilio(data);
      } else if (this.useMeta) {
        return await this.sendViaMeta(data);
      } else {
        logger.warn('No WhatsApp service available, message not sent');
        return false;
      }
    } catch (error) {
      logger.error('Failed to send WhatsApp receipt', { error });
      return false;
    }
  }
}

export const whatsappService = new WhatsAppService();

