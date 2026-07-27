/**
 * Webhook Service
 * 
 * Manages webhook endpoints for external system integration.
 * Supports HMAC signature verification for secure callbacks.
 */

import crypto from 'crypto';
import prisma from '../config/database.js';
import config from '../config/env.js';

/**
 * Create a webhook endpoint
 */
export const createWebhook = async ({ name, url, secret, events, branchId }) => {
  return prisma.webhook.create({
    data: {
      name,
      url,
      secret: secret || crypto.randomBytes(32).toString('hex'),
      events: JSON.stringify(events || ['*']),
      branchId
    }
  });
};

/**
 * Trigger a webhook event
 */
export const triggerWebhook = async (event, payload, branchId = null) => {
  const where = {
    isActive: true,
    events: { contains: event }
  };
  if (branchId) where.branchId = branchId;

  const webhooks = await prisma.webhook.findMany({ where });

  const results = [];
  for (const webhook of webhooks) {
    try {
      const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload });
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(body)
        .digest('hex');

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event
        },
        body
      });

      await prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          event,
          requestBody: body,
          responseStatus: response.status,
          responseBody: await response.text()
        }
      });

      results.push({ webhookId: webhook.id, status: response.status, success: response.ok });
    } catch (error) {
      await prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          event,
          requestBody: JSON.stringify({ event, payload }),
          responseStatus: 0,
          responseBody: error.message
        }
      });

      results.push({ webhookId: webhook.id, status: 0, success: false, error: error.message });
    }
  }

  return results;
};
