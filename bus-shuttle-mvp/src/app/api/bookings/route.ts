import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// In-memory bookings array for demonstration
const BOOKINGS_PATH = path.join(process.cwd(), 'src/utils/bookings.json');

async function readBookings() {
  const data = await fs.readFile(BOOKINGS_PATH, 'utf-8');
  return JSON.parse(data);
}

async function writeBookings(bookings: any[]) {
  await fs.writeFile(BOOKINGS_PATH, JSON.stringify(bookings, null, 2));
}

export async function POST(request: Request) {
  const data = await request.json();
  const { user, routeId, date } = data;

  if (!user || !routeId || !date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const bookings = await readBookings();
  const newBooking = {
    id: bookings.length + 1,
    user,
    routeId,
    date,
    createdAt: new Date().toISOString(),
  };
  bookings.push(newBooking);
  await writeBookings(bookings);
  return NextResponse.json(newBooking, { status: 201 });
}

export async function GET() {
  const bookings = await readBookings();
  return NextResponse.json(bookings);
}
