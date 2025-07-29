const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('🔧 Setting up admin account...');
    
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { username: 'admin' }
    });
    
    if (existingAdmin) {
      console.log('✅ Admin account already exists');
      console.log('Username:', existingAdmin.username);
      console.log('Email:', existingAdmin.email);
      return;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create the admin account
    const admin = await prisma.admin.create({
      data: {
        username: 'admin',
        email: 'admin@busshuttle.com',
        password: hashedPassword,
        role: 'super_admin',
        isActive: true
      }
    });
    
    console.log('✅ Admin account created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();