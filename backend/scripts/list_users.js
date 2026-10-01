import '../src/config/env.js';
import prisma from '../src/config/database.js';

// Read-only helper: list every account with its activation / lock state.
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    isActive: true,
    isLocked: true,
    lockedUntil: true,
    deletedAt: true
  },
  orderBy: { createdAt: 'asc' }
});

for (const u of users) {
  console.log(
    [u.email, u.role, `active=${u.isActive}`, `locked=${u.isLocked}`,
      `deletedAt=${u.deletedAt ? 'yes' : 'no'}`, `id=${u.id}`].join(' | ')
  );
}
await prisma.$disconnect();
