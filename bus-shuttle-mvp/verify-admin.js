const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function verifyAdmin() {
  try {
    console.log('🔍 Checking admin account...');
    
    // Find the admin account
    const admin = await prisma.admin.findUnique({
      where: { username: 'admin' }
    });
    
    if (!admin) {
      console.log('❌ No admin account found');
      return;
    }
    
    console.log('✅ Admin account found:');
    console.log('- Username:', admin.username);
    console.log('- Email:', admin.email);
    console.log('- Role:', admin.role);
    console.log('- Active:', admin.isActive);
    console.log('- Created:', admin.createdAt);
    
    // Test password verification
    const isPasswordValid = await bcrypt.compare('admin123', admin.password);
    console.log('🔐 Password "admin123" is valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('🔧 Updating password to "admin123"...');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await prisma.admin.update({
        where: { id: admin.id },
        data: { 
          password: hashedPassword,
          isActive: true // Ensure account is active
        }
      });
      
      console.log('✅ Password updated successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdmin();