import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updatePassword() {
  try {
    const hashedPassword = await bcrypt.hash('admin2026', 10);
    const user = await prisma.user.update({
      where: { email: 'admin@kcrh.go.ke' },
      data: { password: hashedPassword }
    });
    console.log('Admin password updated successfully');
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePassword();
