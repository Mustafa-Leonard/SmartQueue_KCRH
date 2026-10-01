import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

(async function ensureAdmin() {
  try {
    const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
    const name = process.env.INITIAL_ADMIN_NAME?.trim();
    const phone = process.env.INITIAL_ADMIN_PHONE?.trim();
    const password = process.env.INITIAL_ADMIN_PASSWORD;

    if (!email || !name || !phone || !password || password.length < 14) {
      throw new Error('Set INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_NAME, INITIAL_ADMIN_PHONE, and a password of at least 14 characters.');
    }

    const existingAdmin = await prisma.user.findUnique({ where: { email } });
    if (existingAdmin) {
      if (existingAdmin.role !== 'ADMIN') {
        throw new Error('The configured initial admin email is already assigned to a non-admin account.');
      }
      console.info('The configured administrator already exists; no changes were made.');
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const admin = await prisma.user.create({
      data: { name, email, phone, password: hashed, role: 'ADMIN' },
      select: { email: true }
    });
    console.info('Initial administrator created:', admin.email);
  } catch (err) {
    console.error('Failed to ensure admin:', err.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
