import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      fullName: 'Quản trị viên',
      username: 'admin',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const staffHash = await bcrypt.hash('staff123', 12);
  const staff = await prisma.user.upsert({
    where: { username: 'staff' },
    update: {},
    create: {
      fullName: 'Nhân viên mẫu',
      username: 'staff',
      passwordHash: staffHash,
      role: 'STAFF',
      isActive: true,
    },
  });

  console.log('Seeded users:', {
    admin: admin.username,
    staff: staff.username,
  });
  console.log('Default passwords: admin123 / staff123 — đổi ngay trên môi trường thật.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
