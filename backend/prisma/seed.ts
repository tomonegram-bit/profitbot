import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

// Load local env (if present) so seeds can access secrets like COORDINATOR_JWT_SECRET_KEY
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default admin user
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';
  
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    
    await prisma.adminUser.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'SUPER_ADMIN',
        totpEnabled: false
      }
    });

    console.log(`Created default admin user: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log('Admin user already exists');
  }

  // Create default configuration values
  const configs = [
    {
      key: 'system_name',
      value: 'TRON Lock System',
      updatedBy: 'system'
    },
    {
      key: 'maintenance_mode',
      value: false,
      updatedBy: 'system'
    },
    {
      key: 'telegram_bot_name',
      value: 'TRON Lock Bot',
      updatedBy: 'system'
    }
  ];

  for (const config of configs) {
    const existing = await prisma.config.findUnique({
      where: { key: config.key }
    });

    if (!existing) {
      await prisma.config.create({
        data: config
      });
      console.log(`Created config: ${config.key}`);
    }
  }

  // Persist coordinator JWT if provided in env
  const coordinatorJwt = process.env.COORDINATOR_JWT_SECRET_KEY;
  if (coordinatorJwt) {
    const existing = await prisma.config.findUnique({ where: { key: 'coordinator_jwt' } });
    if (!existing) {
      await prisma.config.create({
        data: { key: 'coordinator_jwt', value: coordinatorJwt, updatedBy: 'system' }
      });
      console.log('Created config: coordinator_jwt');
    } else {
      console.log('coordinator_jwt already exists');
    }
  }

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });