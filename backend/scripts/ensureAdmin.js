import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

(async function ensureAdmin() {
  try {
    const hashed = await bcrypt.hash('Admin@2024', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@kcrh.go.ke' },
      update: {
        name: 'Dr. Hafsa Ali (Admin)',
        password: hashed,
        role: 'ADMIN',
        isActive: true
      },
      create: {
        name: 'Dr. Hafsa Ali (Admin)',
        email: 'admin@kcrh.go.ke',
        phone: '+254706335499',
        password: hashed,
        role: 'ADMIN'
      }
    });

    console.log('Admin user ensured:', admin.email);
  } catch (err) {
    console.error('Failed to ensure admin:', err.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
