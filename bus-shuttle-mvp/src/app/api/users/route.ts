import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET - Fetch all users
export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            Booking: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password } = await request.json();
    
    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }
    
    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || '',
        password: hashedPassword,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('POST /api/users error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// PATCH - Update user
export async function PATCH(request: NextRequest) {
  try {
    const { id, name, email, phone, password } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    
    // Hash new password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }
    
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('PATCH /api/users error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Check if user has bookings
    const userWithBookings = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: { Booking: true }
    });
    
    if (!userWithBookings) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (userWithBookings.Booking.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete user with existing bookings. Delete bookings first.' 
      }, { status: 400 });
    }
    
    await prisma.user.delete({
      where: { id: Number(id) }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/users error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}