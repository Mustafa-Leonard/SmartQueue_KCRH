import * as settingsService from './settings.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { z } from 'zod';

export const upsertSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string().min(1, 'Value is required'),
  description: z.string().optional()
});

export const getAll = asyncHandler(async (req, res) => {
  const settings = await settingsService.getAllSettings();
  const defaults = settingsService.getDefaults();

  // Merge DB settings with defaults
  const merged = {};
  for (const [key, defaultVal] of Object.entries(defaults)) {
    merged[key] = defaultVal;
  }
  settings.forEach(s => { merged[s.key] = s.value; });

  // Return as array of objects
  const settingsArray = Object.entries(merged).map(([key, value]) => ({
    key,
    value,
    description: settings.find(s => s.key === key)?.description || ''
  }));

  return successResponse(res, 'Settings retrieved successfully', { settings: settingsArray });
});

export const upsert = asyncHandler(async (req, res) => {
  const { key, value, description } = req.body;
  const setting = await settingsService.upsertSetting(key, value, description);
  return successResponse(res, 'Setting saved successfully', { setting });
});

export const remove = asyncHandler(async (req, res) => {
  await settingsService.deleteSetting(req.params.key);
  return successResponse(res, 'Setting deleted successfully');
});

