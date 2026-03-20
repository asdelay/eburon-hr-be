import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma/client';

const connectionString = String(process.env.DATABASE_URL);

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const candidateRole = await prisma.userRole.upsert({
    where: { userRole: 'candidate' },
    update: {},
    create: { userRole: 'candidate' },
  });

  await prisma.userRole.upsert({
    where: { userRole: 'employer' },
    update: {},
    create: { userRole: 'employer' },
  });

  await prisma.user.upsert({
    where: { email: 'johndoe@gmail.com' },
    update: {},
    create: {
      fullName: 'John Doe',
      email: 'johndoe@gmail.com',
      role: 'Frontend Developer',
      experience: 12,
      userRoleId: candidateRole.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
