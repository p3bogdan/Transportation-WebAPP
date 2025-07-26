import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/generated/prisma/client-singleton';

// Handles GET requests to return the list of bookings from the database
export async function GET(request: NextRequest) {
  try {
    const bookings = await prisma.booking.findMany({
      include: { route: true, User: true },
    });
    // Map pickupAddress from route.departure for each booking
    const mapped = bookings.map(b => ({
      ...b,
      pickupAddress: b.route?.departure || '',
      destination: b.route?.arrival || '',
      user: b.User?.name || '',
      email: b.User?.email || '',
      phone: b.User?.phone || '',
      company: b.route?.provider || '',
    }));
    return NextResponse.json(mapped);
  } catch (error) {
    console.error('GET /api/bookings error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings', details: String(error) }, { status: 500 });
  }
}

// Handles POST requests to create a new booking in the database
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { name, email, phone, pickupAddress, paymentMethod, route, paymentStatus } = data;

    // Backend validation
    if (!name || typeof name !== 'string' || name.length > 60) {
      return NextResponse.json({ error: 'Name is required and must be ≤ 60 characters.' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (!phone || typeof phone !== 'string' || !/^\+\d{8,15}$/.test(phone)) {
      return NextResponse.json({ error: 'Enter a valid international phone number (e.g. +40712345678).' }, { status: 400 });
    }
    if (!pickupAddress || typeof pickupAddress !== 'string' || pickupAddress.length > 90) {
      return NextResponse.json({ error: 'Pickup city is required and must be ≤ 90 characters.' }, { status: 400 });
    }
    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          updatedAt: new Date(),
        },
      });
    }
    // Find the route by id or by matching fields
    let dbRoute = null;
    if (route.id) {
      dbRoute = await prisma.route.findUnique({ where: { id: route.id } });
    } else {
      dbRoute = await prisma.route.findFirst({
        where: {
          provider: route.provider,
          departure: route.origin || route.departure,
          arrival: route.destination || route.arrival,
          departureTime: new Date(route.departure),
        },
      });
    }
    if (!dbRoute) {
      return NextResponse.json({ error: 'Route not found' }, { status: 400 });
    }
    // Create booking with paymentStatus
    const booking = await prisma.booking.create({
      data: {
        routeId: dbRoute.id,
        userId: user.id,
        status: 'pending',
        amount: route.price,
        updatedAt: new Date(),
        paymentStatus: paymentStatus || (paymentMethod === 'card' ? 'pending' : 'not_required'),
      },
    });
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('POST /api/bookings error:', error);
    return NextResponse.json({ error: 'Failed to create booking', details: String(error) }, { status: 500 });
  }
}

// Handles PATCH requests to update a booking
export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;
    const booking = await prisma.booking.update({
      where: { id: Number(id) },
      data: {
        // Only update allowed fields
        status: updateData.status,
        paymentStatus: updateData.paymentStatus,
        amount: updateData.amount ? Number(updateData.amount) : undefined,
        updatedAt: new Date(),
        // Add more fields as needed
      },
    });
    return NextResponse.json(booking);
  } catch (error) {
    console.error('PATCH /api/bookings error:', error);
    return NextResponse.json({ error: 'Failed to update booking', details: String(error) }, { status: 500 });
  }
}

// Handles DELETE requests to remove a booking
export async function DELETE(request: NextRequest) {
  try {
    const data = await request.json();
    await prisma.booking.delete({ where: { id: Number(data.id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/bookings error:', error);
    return NextResponse.json({ error: 'Failed to delete booking', details: String(error) }, { status: 500 });
  }
}
