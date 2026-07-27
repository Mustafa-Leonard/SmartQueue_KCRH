import nodemailer from 'nodemailer';
import africastalking from 'africastalking';
import config from '../../config/env.js';
import prisma from '../../config/database.js';

let atSMS = null;

// Initialize Africa's Talking
if (config.NOTIFICATION_ENABLED && config.AT.API_KEY) {
  try {
    const at = africastalking({
      apiKey: config.AT.API_KEY,
      username: config.AT.USERNAME
    });
    atSMS = at.SMS;
  } catch (err) {
    console.error('Failed to initialize Africa\'s Talking SDK:', err.message);
  }
}

// Initialize Nodemailer SMTP Transporter
const transporter = nodemailer.createTransport({
  host: config.SMTP.HOST,
  port: config.SMTP.PORT,
  secure: config.SMTP.PORT === 465, // True for 465, false for 587
  auth: {
    user: config.SMTP.USER,
    pass: config.SMTP.PASS
  }
});

export const sendSMS = async (phone, message, userId = null) => {
  console.info(`[SMS Dispatch] To: ${phone} | Msg: "${message}"`);
  if (!config.NOTIFICATION_ENABLED) {
    return { status: 'DISABLED' };
  }

  let status = 'SENT';
  try {
    if (atSMS && config.AT.USERNAME !== 'sandbox') {
      await atSMS.send({
        to: [phone],
        message: message,
        from: config.AT.SENDER_ID
      });
    } else if (atSMS && config.AT.USERNAME === 'sandbox') {
      // Sandbox mode
      await atSMS.send({
        to: [phone],
        message: message
      });
    } else {
      console.warn('Africa\'s Talking SMS SDK not initialized. SMS simulated.');
      status = 'SIMULATED';
    }
  } catch (error) {
    console.error(`SMS send failure to ${phone}:`, error.message);
    status = 'FAILED';
  }

  // Log in db
  await prisma.notification.create({
    data: {
      type: 'SMS',
      recipient: phone,
      message,
      status,
      userId
    }
  });
};

export const sendEmail = async (to, subject, htmlContent, userId = null) => {
  console.info(`[Email Dispatch] To: ${to} | Sub: "${subject}"`);
  if (!config.NOTIFICATION_ENABLED) {
    return { status: 'DISABLED' };
  }

  let status = 'SENT';
  try {
    if (config.SMTP.USER && config.SMTP.PASS) {
      await transporter.sendMail({
        from: config.SMTP.FROM,
        to,
        subject,
        html: htmlContent
      });
    } else {
      console.warn('SMTP configuration missing. Email simulated.');
      status = 'SIMULATED';
    }
  } catch (error) {
    console.error(`Email send failure to ${to}:`, error.message);
    status = 'FAILED';
  }

  // Log in db
  await prisma.notification.create({
    data: {
      type: 'EMAIL',
      recipient: to,
      subject,
      message: htmlContent.substring(0, 500), // Log prefix/truncated message
      status,
      userId
    }
  });
};

export const sendWelcomeMessage = async (user) => {
  const smsMsg = `Welcome to KCRH SmartQueue, ${user.name}. Your patient account is successfully created.`;
  const emailSubject = 'Welcome to Kilifi County Referral Hospital SmartQueue';
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
      <h2 style="color: #0b5a60;">Welcome to KCRH SmartQueue</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>Thank you for registering with Kilifi County Referral Hospital SmartQueue system. Your account is active.</p>
      <p>You can now book appointments, check-in to queues, and follow real-time queue states from your phone.</p>
      <hr style="border: 0; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #777;">Kilifi County Referral Hospital. Committed to quality service.</p>
    </div>
  `;

  await Promise.all([
    sendSMS(user.phone, smsMsg, user.id),
    sendEmail(user.email, emailSubject, emailHtml, user.id)
  ]);
};

export const sendTicketIssuedMessage = async (user, ticket, serviceName, position, waitMin) => {
  const smsMsg = `KCRH Queue: Ticket ${ticket.ticketNumber} created for ${serviceName}. Position: ${position}. Est. wait: ${waitMin} mins. Track live at ${config.FRONTEND_URL}/track/${ticket.ticketCode}`;
  const emailSubject = `KCRH Queue Ticket - ${ticket.ticketNumber}`;
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
      <h2 style="color: #0b5a60; border-bottom: 2px solid #0b5a60; padding-bottom: 10px;">Queue Ticket Registered</h2>
      <p>Dear ${user.name},</p>
      <p>You have joined the queue at KCRH. Here are your ticket credentials:</p>
      <table style="width: 100%; margin: 15px 0; border-collapse: collapse;">
        <tr><td style="padding: 5px; font-weight: bold;">Ticket Number:</td><td style="padding: 5px; font-size: 20px; color: #0b5a60; font-weight: bold;">${ticket.ticketNumber}</td></tr>
        <tr><td style="padding: 5px; font-weight: bold;">Service:</td><td style="padding: 5px;">${serviceName}</td></tr>
        <tr><td style="padding: 5px; font-weight: bold;">Initial Position:</td><td style="padding: 5px;">${position}</td></tr>
        <tr><td style="padding: 5px; font-weight: bold;">Estimated Wait:</td><td style="padding: 5px;">${waitMin} minutes</td></tr>
      </table>
      <p>Keep track of queue progress live on your mobile device: <a href="${config.FRONTEND_URL}/track/${ticket.ticketCode}" style="color: #0b5a60; font-weight: bold;">Track Ticket Live</a></p>
      <hr style="border: 0; border-top: 1px solid #eee; margin-top: 20px;" />
      <p style="font-size: 11px; color: #777;">Please ensure you are at the waiting area before your number is called.</p>
    </div>
  `;

  await Promise.all([
    sendSMS(user.phone, smsMsg, user.id),
    sendEmail(user.email, emailSubject, emailHtml, user.id)
  ]);
};

export const sendTicketCalledMessage = async (user, ticket, counterName) => {
  const smsMsg = `KCRH Alert: Ticket ${ticket.ticketNumber} is CALLED! Please proceed to ${counterName} immediately.`;
  await sendSMS(user.phone, smsMsg, user.id);
};

export const sendAppointmentConfirmedMessage = async (user, appointment, serviceName) => {
  const smsMsg = `KCRH Appointment: Your appointment for ${serviceName} on ${appointment.date.toISOString().split('T')[0]} at ${appointment.timeSlot} is CONFIRMED.`;
  const emailSubject = 'KCRH Appointment Confirmed';
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
      <h2 style="color: #0b5a60;">Appointment Confirmed</h2>
      <p>Dear ${user.name},</p>
      <p>We are pleased to confirm your appointment details at Kilifi County Referral Hospital:</p>
      <div style="background-color: #f7f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <p><strong>Service:</strong> ${serviceName}</p>
        <p><strong>Date:</strong> ${appointment.date.toISOString().split('T')[0]}</p>
        <p><strong>Time Slot:</strong> ${appointment.timeSlot}</p>
        <p><strong>Status:</strong> Confirmed</p>
      </div>
      <p>Please check in at the reception 15 minutes before your scheduled slot.</p>
    </div>
  `;

  await Promise.all([
    sendSMS(user.phone, smsMsg, user.id),
    sendEmail(user.email, emailSubject, emailHtml, user.id)
  ]);
};
