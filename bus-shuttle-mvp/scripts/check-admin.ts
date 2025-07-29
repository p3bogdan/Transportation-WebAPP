import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    console.log('🔍 Checking admin users in database...');
    
    // Get all admin users
    const admins = await prisma.admin.findMany();
    
    if (admins.length === 0) {
      console.log('❌ No admin users found in database');
      return;
    }
    
    console.log(`✅ Found ${admins.length} admin user(s):`);
    
    for (const admin of admins) {
      console.log('==========================================');
      console.log(`ID: ${admin.id}`);
      console.log(`Username: ${admin.username}`);
      console.log(`Email: ${admin.email}`);
      console.log(`Role: ${admin.role}`);
      console.log(`Active: ${admin.isActive}`);
      console.log(`Created: ${admin.createdAt}`);
      console.log(`Last Login: ${admin.lastLogin || 'Never'}`);
      
      // Test if password 'admin123' matches
      const isMatch = await bcrypt.compare('admin123', admin.password);
      console.log(`Password 'admin123' matches: ${isMatch}`);
      console.log('==========================================');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();