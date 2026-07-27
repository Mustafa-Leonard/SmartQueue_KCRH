import prisma from '../../config/database.js';

export const getAllSettings = async () => {
  return prisma.systemSetting.findMany({
    orderBy: { key: 'asc' }
  });
};

export const getSettingByKey = async (key) => {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  if (!setting) {
    const err = new Error('Setting not found');
    err.statusCode = 404;
    throw err;
  }
  return setting;
};

export const upsertSetting = async (key, value, description) => {
  return prisma.systemSetting.upsert({
    where: { key },
    update: { value, description },
    create: { key, value, description }
  });
};

export const deleteSetting = async (key) => {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  if (!setting) {
    const err = new Error('Setting not found');
    err.statusCode = 404;
    throw err;
  }
  return prisma.systemSetting.delete({ where: { key } });
};

export const getDefaults = () => {
  return {
    NOTIFICATION_ENABLED: 'true',
    WORKING_HOURS_START: '08:00',
    WORKING_HOURS_END: '17:00',
    SLOT_DURATION_MINUTES: '30',
    MAX_WAITING_PER_COUNTER: '20',
    AUTO_CONFIRM_APPOINTMENTS: 'true',
    SMS_ALERTS_ENABLED: 'true',
    EMAIL_ALERTS_ENABLED: 'true',
    DISPLAY_BOARD_REFRESH_SECONDS: '5'
  };
};

