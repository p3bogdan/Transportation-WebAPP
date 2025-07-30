import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // If user exists but has no password, allow them to set one
      if (!existingUser.password) {
        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Update the existing user with password and any new info
        const updatedUser = await prisma.user.update({
          where: { email },
          data: {
            password: hashedPassword,
            name: name || existingUser.name, // Use provided name or keep existing
            phone: phone || existingUser.phone, // Use provided phone or keep existing
            updatedAt: new Date(),
          },
        });

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
        return NextResponse.json(
          { error: 'An account with this email address already exists. Please sign in instead.' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || '',
        updatedAt: new Date(),
      },
    });

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