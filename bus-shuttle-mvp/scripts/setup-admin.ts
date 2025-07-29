import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createInitialAdmin() {
  try {
    // Check if any admin already exists
    const existingAdmin = await prisma.admin.findFirst();
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log(`Username: ${existingAdmin.username}`);
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Role: ${existingAdmin.role}`);
      return;
    }

    // Create initial admin
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const now = new Date();
    
    const admin = await prisma.admin.create({
      data: {
        username: 'admin',
        email: 'admin@transport.com',
        password: hashedPassword,
        role: 'super_admin',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    });

    console.log('🚀 Initial admin user created successfully!');
    console.log('==========================================');
    console.log(`Username: ${admin.username}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log('Password: admin123');
    console.log('==========================================');
    console.log('⚠️  Please change the password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating initial admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createInitialAdmin();