import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('--- Checking Users in Database ---');
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users in database:`);
  
  const passwordsToTest = [
    'Admin@2024',
    'admin2026',
    'Staff@2024',
    'Staff@2026',
    'Patient@2024',
    'Patient@2026',
    'admin123',
    'password',
    '123456',
    'patient123'
  ];

  for (const user of users) {
    console.log(`\nUser: ${user.name} | Email: "${user.email}" | Role: ${user.role} | Active: ${user.isActive}`);
    console.log(`Stored Hash: ${user.password}`);
    
    let matched = false;
    for (const pwd of passwordsToTest) {
      const match = await bcrypt.compare(pwd, user.password);
      if (match) {
        console.log(`  ==> MATCHES password: "${pwd}"`);
        matched = true;
      }
    }
    if (!matched) {
      console.log(`  ==> NO MATCH found in tested passwords!`);
    }
  }

  await prisma.$disconnect();
}

checkUsers().catch(console.error);
