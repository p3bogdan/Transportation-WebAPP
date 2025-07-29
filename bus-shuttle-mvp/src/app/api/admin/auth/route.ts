import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    console.log('🔑 Admin login attempt:', { username, passwordLength: password?.length });

    if (!username || !password) {
      console.log('❌ Missing credentials');
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Find admin by username
    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!admin) {
      console.log('❌ Admin not found:', username);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    console.log('✅ Admin found:', { id: admin.id, username: admin.username, isActive: admin.isActive });

    // Check if admin is active
    if (!admin.isActive) {
      console.log('❌ Admin account disabled');
      return NextResponse.json({ error: 'Account is disabled' }, { status: 401 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    console.log('🔐 Password validation:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Update last login
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    console.log('✅ Login successful for:', admin.username);

    // Return success (without sensitive data)
    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('💥 Admin login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create initial admin (for development/setup)
export async function PUT(request: NextRequest) {
  try {
    const { username, email, password, setupKey } = await request.json();

    // Simple setup key for initial admin creation
    if (setupKey !== 'setup_admin_2025') {
      return NextResponse.json({ error: 'Invalid setup key' }, { status: 403 });
    }

    // Check if any admin already exists
    const existingAdmin = await prisma.admin.findFirst();
    if (existingAdmin) {
      return NextResponse.json({ error: 'Admin already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'super_admin',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Initial admin created successfully',
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Admin setup error:', error);
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
  }
}