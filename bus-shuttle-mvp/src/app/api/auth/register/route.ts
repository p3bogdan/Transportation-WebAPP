import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sanitizeUserData, sanitizeEmail, sanitizeName, validatePassword, createRateLimiter } from '@/utils/sanitization';

// Rate limiter: 5 registration attempts per minute per IP
const rateLimiter = createRateLimiter(5, 60000);

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!rateLimiter(clientIp)) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const rawData = await request.json();
    
    // Handle password separately - don't sanitize passwords
    const password = rawData.password;
    
    // Sanitize other input data
    const sanitizedData = sanitizeUserData(rawData);
    const { name, email, phone } = sanitizedData;

    console.log('Registration attempt:', { 
      name: name || 'MISSING', 
      email: email || 'MISSING', 
      passwordProvided: !!password,
      phone: phone || 'not provided'
    });

    // Validate required fields after sanitization
    if (!name || name.length < 2) {
      console.log('Registration failed: Invalid name');
      return NextResponse.json(
        { error: 'Name is required and must be at least 2 characters' },
        { status: 400 }
      );
    }
    
    if (!email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      console.log('Registration failed: Invalid email');
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }
    
    if (!password) {
      console.log('Registration failed: Missing password');
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      console.log('Registration failed: Password validation', passwordValidation.errors);
      return NextResponse.json(
        { error: 'Password requirements not met', details: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizeEmail(email) }
    });

    if (existingUser) {
      // If user exists but has no password, allow them to set one
      if (!existingUser.password) {
        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Update the existing user with password and any new info
        const updatedUser = await prisma.user.update({
          where: { email: sanitizeEmail(email) },
          data: {
            password: hashedPassword,
            name: sanitizeName(name) || existingUser.name,
            phone: phone || existingUser.phone,
            updatedAt: new Date(),
          },
        });

        console.log('Registration success: Updated existing user with password');
        return NextResponse.json(
          { 
            message: 'Password added to your existing account successfully',
            user: {
              id: updatedUser.id,
              name: updatedUser.name,
              email: updatedUser.email,
            }
          },
          { status: 200 }
        );
      } else {
        // User exists and already has a password
        console.log('Registration failed: User already exists with password');
        return NextResponse.json(
          { error: 'An account with this email address already exists. Please sign in instead.' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with sanitized data
    const user = await prisma.user.create({
      data: {
        name: sanitizeName(name),
        email: sanitizeEmail(email),
        password: hashedPassword,
        phone: phone || '',
        updatedAt: new Date(),
      },
    });

    console.log('Registration success: New user created');
    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}