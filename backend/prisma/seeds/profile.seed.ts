import { PrismaClient } from '../../generated/prisma/client';

export async function seedProfile(prisma: PrismaClient) {
  await prisma.profile.create({
    data: {
      firstName: 'Jazeb',
      lastName: 'Munir',
      email: 'jazeb.dividend.com',
      phone: '123123123',
    },
  });

  console.log(`Done. Seeded profile.`);
}
