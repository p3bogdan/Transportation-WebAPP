import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sanitizeName, sanitizeEmail, validatePassword, createRateLimiter } from '@/utils/sanitization';

// Rate limiter: 3 login attempts per minute per IP
const loginRateLimiter = createRateLimiter(3, 60000);
// Rate limiter for failed attempts: 1 attempt per 5 minutes after 3 failures
const failedAttemptLimiter = createRateLimiter(1, 300000);

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    
    if (!loginRateLimiter(clientIp)) {
      return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, { status: 429 });
    }

    const rawData = await request.json();
    const username = sanitizeName(rawData.username);
    const password = rawData.password; // Don't sanitize passwords
    
    console.log('🔑 Admin login attempt:', { username, passwordLength: password?.length });

    if (!username || !password) {
      console.log('❌ Missing credentials');
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Additional validation
    if (username.length < 3 || username.length > 50) {
      return NextResponse.json({ error: 'Invalid username format' }, { status: 400 });
    }

    // Find admin by username
    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!admin) {
      console.log('❌ Admin not found:', username);
      // Rate limit failed attempts more aggressively
      if (!failedAttemptLimiter(clientIp + '_failed')) {
        return NextResponse.json({ error: 'Account temporarily locked due to failed attempts' }, { status: 423 });
      }
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
      // Rate limit failed attempts more aggressively
      if (!failedAttemptLimiter(clientIp + '_failed')) {
        return NextResponse.json({ error: 'Account temporarily locked due to failed attempts' }, { status: 423 });
      }
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
    const rawData = await request.json();
    const { username, email, password, setupKey } = rawData;

    // Sanitize inputs
    const sanitizedUsername = sanitizeName(username);
    const sanitizedEmail = sanitizeEmail(email);

    // Simple setup key for initial admin creation - should be environment variable in production
    if (setupKey !== 'setup_admin_2025') {
      return NextResponse.json({ error: 'Invalid setup key' }, { status: 403 });
    }

    // Validate inputs
    if (!sanitizedUsername || sanitizedUsername.length < 3) {
      return NextResponse.json({ error: 'Username must be at least 3 characters' }, { status: 400 });
    }

    if (!sanitizedEmail || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(sanitizedEmail)) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'Password requirements not met', details: passwordValidation.errors },
        { status: 400 }
      );
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
        username: sanitizedUsername,
        email: sanitizedEmail,
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