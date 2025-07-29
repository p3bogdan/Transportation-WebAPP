import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Handles GET requests to return the list of available routes from the database
export async function GET(request: NextRequest) {
  try {
    const routes = await prisma.route.findMany({
      include: { bookings: true, company: true }, // Include company relation
    });
    return NextResponse.json(routes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch routes', details: String(error) }, { status: 500 });
  }
}

// Handles POST requests to add a new route
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    // Validate date fields
    const departureTime = new Date(data.departureTime);
    const arrivalTime = new Date(data.arrivalTime);
    if (isNaN(departureTime.getTime()) || isNaN(arrivalTime.getTime())) {
      return NextResponse.json({ error: 'Invalid date format for departureTime or arrivalTime' }, { status: 400 });
    }
    const route = await prisma.route.create({
      data: {
        departure: data.departure,
        arrival: data.arrival,
        departureTime,
        arrivalTime,
        price: Number(data.price),
        provider: data.provider,
        companyId: data.companyId ? Number(data.companyId) : null,
        vehicleType: data.vehicleType || '',
        seats: data.seats ? Number(data.seats) : 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Add other fields as needed
      },
    });
    return NextResponse.json(route, { status: 201 });
  } catch (error) {
    console.error('POST /api/routes error:', error);
    return NextResponse.json({ error: 'Failed to add route', details: String(error) }, { status: 500 });
  }
}

// Handles PATCH requests to update a route
export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;
    const route = await prisma.route.update({
      where: { id: Number(id) },
      data: {
        departure: updateData.departure,
        arrival: updateData.arrival,
        departureTime: updateData.departureTime ? new Date(updateData.departureTime) : undefined,
        arrivalTime: updateData.arrivalTime ? new Date(updateData.arrivalTime) : undefined,
        price: updateData.price ? Number(updateData.price) : undefined,
        provider: updateData.provider,
        companyId: updateData.companyId ? Number(updateData.companyId) : null,
        vehicleType: updateData.vehicleType || '',
        seats: updateData.seats ? Number(updateData.seats) : undefined,
        updatedAt: new Date(),
        // Add other fields as needed
      },
    });
    return NextResponse.json(route);
  } catch (error) {
    console.error('PATCH /api/routes error:', error);
    return NextResponse.json({ error: 'Failed to update route', details: String(error) }, { status: 500 });
  }
}

// Handles DELETE requests to remove a route
export async function DELETE(request: NextRequest) {
  try {
    const data = await request.json();
    await prisma.route.delete({ where: { id: Number(data.id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/routes error:', error);
    return NextResponse.json({ error: 'Failed to delete route', details: String(error) }, { status: 500 });
  }
}
