import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeUserData, sanitizeEmail, sanitizeName, sanitizeAddress, sanitizeNumber, createRateLimiter } from '@/utils/sanitization';

// Rate limiter: 10 booking attempts per minute per IP
const rateLimiter = createRateLimiter(10, 60000);

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
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!rateLimiter(clientIp)) {
      return NextResponse.json(
        { error: 'Too many booking attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const rawData = await request.json();
    
    // Sanitize all input data
    const sanitizedData = sanitizeUserData(rawData);
    const { name, email, phone, pickupAddress, paymentMethod, route, paymentStatus } = sanitizedData;

    // Backend validation with sanitized data
    if (!name || typeof name !== 'string' || name.length < 2 || name.length > 60) {
      return NextResponse.json({ error: 'Name is required and must be between 2-60 characters.' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    if (!phone || typeof phone !== 'string' || !/^\+\d{8,15}$/.test(phone)) {
      return NextResponse.json({ error: 'Enter a valid international phone number (e.g. +40712345678).' }, { status: 400 });
    }
    if (!pickupAddress || typeof pickupAddress !== 'string' || pickupAddress.length > 90) {
      return NextResponse.json({ error: 'Pickup city is required and must be ≤ 90 characters.' }, { status: 400 });
    }
    
    // Validate payment method
    if (!['cash', 'card'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method.' }, { status: 400 });
    }
    
    // Find or create user (with or without password)
    let user = await prisma.user.findUnique({ where: { email: sanitizeEmail(email) } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: sanitizeName(name),
          email: sanitizeEmail(email),
          phone: phone,
          updatedAt: new Date(),
        },
      });
    }
    
    // Find the route by id first, then by matching fields
    let dbRoute = null;
    if (route.id) {
      dbRoute = await prisma.route.findUnique({ where: { id: Number(route.id) } });
    } else {
      // Use the correct field names for database lookup
      dbRoute = await prisma.route.findFirst({
        where: {
          provider: sanitizeName(route.provider),
          departure: sanitizeAddress(route.departure),
          arrival: sanitizeAddress(route.arrival),
          price: sanitizeNumber(route.price, 0, 10000),
        },
      });
    }
    
    if (!dbRoute) {
      // Create a fallback route if not found (for testing purposes)
      dbRoute = await prisma.route.create({
        data: {
          departure: sanitizeAddress(route.departure || route.origin),
          arrival: sanitizeAddress(route.arrival || route.destination),
          departureTime: route.departureTime ? new Date(route.departureTime) : new Date(),
          arrivalTime: route.arrivalTime ? new Date(route.arrivalTime) : new Date(),
          price: sanitizeNumber(route.price, 0, 10000),
          provider: sanitizeName(route.provider),
          vehicleType: sanitizeName(route.vehicleType) || 'Bus',
          seats: sanitizeNumber(route.seats, 1, 100) || 50,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
    
    // Validate price consistency
    const sanitizedPrice = sanitizeNumber(route.price, 0, 10000);
    if (Math.abs(dbRoute.price - sanitizedPrice) > 0.01) {
      return NextResponse.json({ error: 'Price mismatch detected.' }, { status: 400 });
    }
    
    // Create booking with proper status
    const booking = await prisma.booking.create({
      data: {
        routeId: dbRoute.id,
        userId: user.id,
        status: 'confirmed',
        amount: sanitizeNumber(route.price, 0, 10000),
        updatedAt: new Date(),
        paymentStatus: paymentStatus || (paymentMethod === 'card' ? 'pending' : 'not_required'),
      },
    });
    
    return NextResponse.json({ 
      ...booking, 
      message: 'Booking created successfully',
      route: dbRoute,
      user: { name: user.name, email: user.email }
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/bookings error:', error);
    return NextResponse.json({ error: 'Failed to create booking', details: String(error) }, { status: 500 });
  }
}

// Handles PATCH requests to update a booking
export async function PATCH(request: NextRequest) {
  try {
    const rawData = await request.json();
    const { id, ...updateData } = rawData;
    
    // Validate ID
    const bookingId = sanitizeNumber(id, 1);
    if (!bookingId) {
      return NextResponse.json({ error: 'Valid booking ID is required' }, { status: 400 });
    }
    
    // Sanitize update data
    const sanitizedUpdate: any = {};
    
    if (updateData.status && ['confirmed', 'pending', 'cancelled'].includes(updateData.status)) {
      sanitizedUpdate.status = updateData.status;
    }
    
    if (updateData.paymentStatus && ['paid', 'pending', 'failed', 'not_required'].includes(updateData.paymentStatus)) {
      sanitizedUpdate.paymentStatus = updateData.paymentStatus;
    }
    
    if (updateData.amount !== undefined) {
      sanitizedUpdate.amount = sanitizeNumber(updateData.amount, 0, 10000);
    }
    
    sanitizedUpdate.updatedAt = new Date();
    
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: sanitizedUpdate,
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
    const bookingId = sanitizeNumber(data.id, 1);
    
    if (!bookingId) {
      return NextResponse.json({ error: 'Valid booking ID is required' }, { status: 400 });
    }
    
    await prisma.booking.delete({ where: { id: bookingId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/bookings error:', error);
    return NextResponse.json({ error: 'Failed to delete booking', details: String(error) }, { status: 500 });
  }
}
