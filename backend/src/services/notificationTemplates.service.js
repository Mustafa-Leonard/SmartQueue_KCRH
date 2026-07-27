/**
 * Notification Template Service
 * 
 * Manages notification templates for SMS, Email, and WhatsApp.
 * Provides default templates and variable substitution.
 */

import prisma from '../config/database.js';

const DEFAULT_TEMPLATES = [
  {
    name: 'ticket_created',
    subject: 'Your Queue Ticket - KCRH',
    body: 'Hello {{patientName}},\n\nYour queue ticket has been registered at {{departmentName}}.\n\nTicket Number: {{ticketNumber}}\nService: {{serviceName}}\nPosition: {{position}}\nEstimated Wait: {{estimatedWait}} minutes\n\nTrack your position: {{trackingUrl}}\n\nThank you for choosing Kilifi County Referral Hospital.',
    channel: 'SMS',
    variables: ['patientName', 'departmentName', 'ticketNumber', 'serviceName', 'position', 'estimatedWait', 'trackingUrl']
  },
  {
    name: 'ticket_called',
    subject: 'Your Turn! - KCRH',
    body: 'Hello {{patientName}},\n\nPlease proceed to {{counterName}} immediately.\n\nTicket: {{ticketNumber}}\nDepartment: {{departmentName}}\n\nThank you for waiting.',
    channel: 'SMS',
    variables: ['patientName', 'counterName', 'ticketNumber', 'departmentName']
  },
  {
    name: 'appointment_reminder',
    subject: 'Appointment Reminder - KCRH',
    body: 'Hello {{patientName}},\n\nThis is a reminder of your upcoming appointment:\n\nService: {{serviceName}}\nDate: {{appointmentDate}}\nTime: {{appointmentTime}}\nLocation: {{departmentName}}\n\nPlease arrive 15 minutes before your scheduled time.',
    channel: 'SMS',
    variables: ['patientName', 'serviceName', 'appointmentDate', 'appointmentTime', 'departmentName']
  },
  {
    name: 'appointment_confirmed',
    subject: 'Appointment Confirmed - KCRH',
    body: 'Hello {{patientName}},\n\nYour appointment has been confirmed:\n\nService: {{serviceName}}\nDate: {{appointmentDate}}\nTime: {{appointmentTime}}\n\nTo reschedule, please log into your patient portal.',
    channel: 'SMS',
    variables: ['patientName', 'serviceName', 'appointmentDate', 'appointmentTime']
  },
  {
    name: 'appointment_cancelled',
    subject: 'Appointment Cancelled - KCRH',
    body: 'Hello {{patientName}},\n\nYour appointment has been cancelled:\n\nService: {{serviceName}}\nDate: {{appointmentDate}}\nTime: {{appointmentTime}}\n\nIf this was a mistake, please contact the hospital.',
    channel: 'SMS',
    variables: ['patientName', 'serviceName', 'appointmentDate', 'appointmentTime']
  },
  {
    name: 'queue_alert',
    subject: 'Queue Update - KCRH',
    body: 'Hello {{patientName}},\n\nYour position has changed.\n\nCurrent Position: {{currentPosition}}\nEstimated Wait: {{estimatedWait}} minutes\n\nThank you for your patience.',
    channel: 'SMS',
    variables: ['patientName', 'currentPosition', 'estimatedWait']
  },
  {
    name: 'feedback_acknowledgment',
    subject: 'Thank You for Your Feedback - KCRH',
    body: 'Hello {{patientName}},\n\nThank you for sharing your feedback with us. We value your input and use it to improve our services.\n\nRating: {{rating}}/5\n\nKilifi County Referral Hospital',
    channel: 'EMAIL',
    variables: ['patientName', 'rating']
  },
  {
    name: 'feedback_response',
    subject: 'Response to Your Feedback - KCRH',
    body: 'Hello {{patientName}},\n\nHospital administration has responded to your feedback:\n\n"{{adminResponse}}"\n\nThank you for helping us improve.',
    channel: 'EMAIL',
    variables: ['patientName', 'adminResponse']
  },
  {
    name: 'welcome_message',
    subject: 'Welcome to KCRH SmartQueue',
    body: 'Hello {{patientName}},\n\nWelcome to Kilifi County Referral Hospital SmartQueue system.\n\nWith your account you can:\n- Join queues remotely\n- Track your position in real-time\n- Book appointments\n- Receive notifications\n\nThank you for choosing KCRH.',
    channel: 'SMS',
    variables: ['patientName']
  }
];

/**
 * Initialize default notification templates
 */
export const initializeDefaultTemplates = async () => {
  for (const template of DEFAULT_TEMPLATES) {
    const existing = await prisma.notificationTemplate.findUnique({
      where: { name: template.name }
    });

    if (!existing) {
      await prisma.notificationTemplate.create({
        data: {
          name: template.name,
          subject: template.subject,
          body: template.body,
          channel: template.channel,
          variables: JSON.stringify(template.variables)
        }
      });
      console.log(`[Templates] Created: ${template.name}`);
    }
  }
};

/**
 * Get all notification templates
 */
export const getAllTemplates = async () => {
  return prisma.notificationTemplate.findMany({
    orderBy: { name: 'asc' }
  });
};

/**
 * Get template by name
 */
export const getTemplateByName = async (name) => {
  return prisma.notificationTemplate.findUnique({ where: { name } });
};

/**
 * Create or update a template
 */
export const upsertTemplate = async ({ name, subject, body, channel, variables }) => {
  return prisma.notificationTemplate.upsert({
    where: { name },
    update: { subject, body, channel, variables: variables ? JSON.stringify(variables) : undefined },
    create: { name, subject, body, channel, variables: variables ? JSON.stringify(variables) : '[]' }
  });
};

/**
 * Render a template with variables
 */
export const renderTemplate = (template, variables) => {
  let rendered = template.body;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return {
    subject: template.subject ? template.subject.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`) : undefined,
    body: rendered
  };
};
