import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/generated/prisma/client-singleton';

// Handles GET requests to return the list of bookings from the database
export async function GET(request: NextRequest) {
  try {
    const bookings = await prisma.booking.findMany({
      include: { route: true, User: true },
    });
    return NextResponse.json(bookings);
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
