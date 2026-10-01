import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('This seed script creates known demo accounts and must not run in production.');
  }

  console.log('Seeding KCRH database...');

  // 1. Create / Update Users with known passwords
  const adminPassword = await bcrypt.hash('Admin@2024', 12);
  const staffPassword = await bcrypt.hash('Staff@2024', 12);
  const patientPassword = await bcrypt.hash('Patient@2024', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@kcrh.go.ke' },
    update: {
      password: adminPassword,
      isActive: true,
      role: 'ADMIN'
    },
    create: {
      name: 'Dr. Jane Mwangi (Admin)',
      email: 'admin@kcrh.go.ke',
      phone: '+254700000001',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@kcrh.go.ke' },
    update: {
      password: staffPassword,
      isActive: true,
      role: 'STAFF'
    },
    create: {
      name: 'Nurse Alice Kemboi',
      email: 'staff@kcrh.go.ke',
      phone: '+254700000002',
      password: staffPassword,
      role: 'STAFF',
    },
  });

  const patient = await prisma.user.upsert({
    where: { email: 'patient@gmail.com' },
    update: {
      password: patientPassword,
      isActive: true,
      role: 'CUSTOMER'
    },
    create: {
      name: 'John Kamau',
      email: 'patient@gmail.com',
      phone: '+254700000003',
      password: patientPassword,
      role: 'CUSTOMER',
    },
  });

  console.log('Users created/verified with default passwords.');

  // 2. Create / Update Branches
  const branchesData = [
    { name: 'Outpatient Department (OPD)', description: 'General clinic, consultations and checkups', location: 'Block A, Ground Floor' },
    { name: 'Emergency & Trauma', description: '24/7 urgent medical attention', location: 'Emergency Wing, Gate 2' },
    { name: 'Pharmacy', description: 'Medicine dispensing and prescription consultation', location: 'Block B, Ground Floor' },
    { name: 'Laboratory Services', description: 'Blood tests, pathology, urine analysis', location: 'Block A, First Floor' },
    { name: 'Radiology & Imaging', description: 'X-Ray, Ultrasound, CT Scan', location: 'Block A, Basement' },
    { name: 'Maternal & Child Health', description: 'Antenatal care, immunizations, pediatrics', location: 'Maternity Wing' }
  ];

  const branches = [];
  for (const b of branchesData) {
    const branch = await prisma.branch.upsert({
      where: { name: b.name },
      update: {
        description: b.description,
        location: b.location
      },
      create: {
        name: b.name,
        description: b.description,
        location: b.location
      }
    });
    branches.push(branch);
  }
  console.log('Branches created.');

  // Find seeded OPD, Pharmacy, Lab branches
  const opdBranch = branches.find(b => b.name.startsWith('Outpatient'));
  const pharmacyBranch = branches.find(b => b.name.startsWith('Pharmacy'));
  const labBranch = branches.find(b => b.name.startsWith('Lab'));

  // 3. Create / Retrieve Services
  const servicesMap = {};
  const servicesToCreate = [
    { branchId: opdBranch?.id, name: 'General Consultation', description: 'Standard clinical checkup with medical officer', estimatedTime: 15 },
    { branchId: opdBranch?.id, name: 'Specialist Clinic', description: 'Cardiology, Diabetes, Orthopedics consultations', estimatedTime: 25 },
    { branchId: pharmacyBranch?.id, name: 'NHIF Dispensing', description: 'Dispensing medicine under NHIF / SHA cover', estimatedTime: 10 },
    { branchId: pharmacyBranch?.id, name: 'Cash Dispensing', description: 'Over-the-counter paid dispensing', estimatedTime: 5 },
    { branchId: labBranch?.id, name: 'Phlebotomy (Blood Draw)', description: 'Blood sample drawing', estimatedTime: 8 }
  ];

  for (const s of servicesToCreate) {
    if (!s.branchId) continue;
    let service = await prisma.service.findFirst({
      where: { name: s.name, branchId: s.branchId }
    });
    if (!service) {
      service = await prisma.service.create({ data: s });
    }
    servicesMap[s.name] = service;
  }
  console.log('Services verified/created.');

  // 4. Create / Update Counters
  if (opdBranch && servicesMap['General Consultation']) {
    let counter1 = await prisma.counter.findFirst({ where: { branchId: opdBranch.id, number: 1 } });
    if (!counter1) {
      await prisma.counter.create({
        data: {
          name: 'OPD Desk 1',
          number: 1,
          status: 'OPEN',
          branchId: opdBranch.id,
          staffId: staff.id,
          serviceRelations: {
            connect: [{ id: servicesMap['General Consultation'].id }, ...(servicesMap['Specialist Clinic'] ? [{ id: servicesMap['Specialist Clinic'].id }] : [])]
          }
        }
      });
    } else {
      await prisma.counter.update({
        where: { id: counter1.id },
        data: {
          status: 'OPEN',
          staffId: staff.id
        }
      });
    }

    let counter2 = await prisma.counter.findFirst({ where: { branchId: opdBranch.id, number: 2 } });
    if (!counter2) {
      await prisma.counter.create({
        data: {
          name: 'OPD Desk 2',
          number: 2,
          status: 'CLOSED',
          branchId: opdBranch.id,
          serviceRelations: {
            connect: [{ id: servicesMap['General Consultation'].id }]
          }
        }
      });
    }
  }

  if (pharmacyBranch && servicesMap['NHIF Dispensing']) {
    let counterPharma = await prisma.counter.findFirst({ where: { branchId: pharmacyBranch.id, number: 1 } });
    if (!counterPharma) {
      await prisma.counter.create({
        data: {
          name: 'Dispensing Window A',
          number: 1,
          status: 'CLOSED',
          branchId: pharmacyBranch.id,
          serviceRelations: {
            connect: [{ id: servicesMap['NHIF Dispensing'].id }, ...(servicesMap['Cash Dispensing'] ? [{ id: servicesMap['Cash Dispensing'].id }] : [])]
          }
        }
      });
    }
  }
  console.log('Counters verified/created.');

  // 5. Create active queue for today in OPD branch
  if (opdBranch && servicesMap['General Consultation']) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let queue = await prisma.queue.findFirst({
      where: { branchId: opdBranch.id, date: today }
    });

    if (!queue) {
      queue = await prisma.queue.create({
        data: {
          date: today,
          branchId: opdBranch.id,
          isOpen: true
        }
      });
    }

    const existingTicket = await prisma.ticket.findFirst({
      where: { ticketNumber: 'GEN001' }
    });

    if (!existingTicket) {
      await prisma.ticket.create({
        data: {
          ticketNumber: 'GEN001',
          status: 'WAITING',
          type: 'WALK_IN',
          position: 1,
          waitingBefore: 0,
          customerId: patient.id,
          serviceId: servicesMap['General Consultation'].id,
          queueId: queue.id
        }
      });
    }
  }

  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
