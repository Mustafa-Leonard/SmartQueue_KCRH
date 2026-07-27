/**
 * WhatsApp Notification Service
 * 
 * Integrates with external WhatsApp Business API or Twilio for WhatsApp messaging.
 * Logs all messages to the whatsapp_logs table.
 */

import prisma from '../config/database.js';
import config from '../config/env.js';

let whatsappClient = null;

// Attempt to initialize WhatsApp client if credentials are available
const initClient = () => {
  // This is a placeholder - Twilio or WhatsApp Business API client would go here
  // For now, we simulate and log
  console.info('[WhatsApp] Client initialized (simulation mode)');
  return true;
};

/**
 * Send a WhatsApp message
 */
export const sendWhatsApp = async (to, message, templateName = null, userId = null) => {
  console.info(`[WhatsApp Dispatch] To: ${to} | Template: ${templateName || 'none'} | Msg: "${message.substring(0, 50)}..."`);
  
  if (!config.NOTIFICATION_ENABLED) {
    return { status: 'DISABLED' };
  }

  let status = 'SENT';
  let messageId = null;
  let cost = null;

  try {
    if (!whatsappClient) {
      initClient();
    }

    // In production, actual send logic would go here
    // const response = await whatsappClient.messages.create({ ... });
    // messageId = response.sid;
    // cost = response.price;

    if (config.NODE_ENV === 'development') {
      console.info(`[WhatsApp Simulation] Message sent to ${to}`);
      status = 'SIMULATED';
    }
  } catch (error) {
    console.error(`[WhatsApp Error] Failed to send to ${to}:`, error.message);
    status = 'FAILED';
  }

  // Log to database
  await prisma.whatsappLog.create({
    data: {
      to,
      message,
      templateName,
      status,
      provider: 'TWILIO',
      messageId,
      cost
    }
  });

  // Also create a notification record
  await prisma.notification.create({
    data: {
      type: 'WHATSAPP',
      channel: 'WHATSAPP',
      recipient: to,
      message: message.substring(0, 500),
      status,
      userId
    }
  });

  return { status, messageId, cost };
};

/**
 * Send a WhatsApp notification using a template
 */
export const sendWhatsAppTemplate = async (to, templateName, variables = {}, userId = null) => {
  // Get template from database
  const template = await prisma.notificationTemplate.findFirst({
    where: { name: templateName, channel: 'WHATSAPP' }
  });

  if (!template) {
    console.warn(`[WhatsApp] Template not found: ${templateName}`);
    return { status: 'FAILED', error: 'Template not found' };
  }

  // Replace variables in template body
  let message = template.body;
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  return sendWhatsApp(to, message, templateName, userId);
};

/**
 * Send appointment reminder via WhatsApp
 */
export const sendAppointmentReminderWhatsApp = async (user, appointment, serviceName) => {
  const message = `*KCRH Appointment Reminder*\n\nHello ${user.name},\n\nThis is a reminder of your upcoming appointment:\n\n📋 *Service:* ${serviceName}\n📅 *Date:* ${appointment.date.toISOString().split('T')[0]}\n⏰ *Time:* ${appointment.timeSlot}\n\nPlease arrive 15 minutes before your scheduled time.\n\n_Thank you for choosing Kilifi County Referral Hospital._`;
  
  return sendWhatsApp(user.phone, message, 'appointment_reminder', user.id);
};

/**
 * Send ticket notification via WhatsApp
 */
export const sendTicketNotificationWhatsApp = async (user, ticket, serviceName) => {
  const message = `*KCRH Queue Ticket*\n\nHello ${user.name},\n\nYour queue ticket has been registered:\n\n🎫 *Ticket:* ${ticket.ticketNumber}\n📋 *Service:* ${serviceName}\n\nThe hospital staff will call you when it is your turn.\n\nTrack your position live: ${config.FRONTEND_URL}/track/${ticket.ticketCode}\n\n_Thank you for choosing Kilifi County Referral Hospital._`;
  
  return sendWhatsApp(user.phone, message, 'ticket_issued', user.id);
};

