import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/index.js';

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const prisma = new PrismaClient();

async function main() {
  // Clear existing data to avoid unique constraint errors
  await prisma.booking.deleteMany();
  await prisma.route.deleteMany();
  await prisma.user.deleteMany();

  // Create demo users
  const user1 = await prisma.user.create({
    data: {
      name: 'Alice Smith',
      email: 'alice@example.com',
      phone: '1234567890',
      updatedAt: new Date(),
    },
  });
  const user2 = await prisma.user.create({
    data: {
      name: 'Bob Johnson',
      email: 'bob@example.com',
      phone: '0987654321',
      updatedAt: new Date(),
    },
  });

  // Create demo routes
  const route1 = await prisma.route.create({
    data: {
      provider: 'TransEuro',
      departure: 'Bucharest',
      arrival: 'Vienna',
      departureTime: new Date('2025-07-22T08:00:00Z'),
      arrivalTime: new Date('2025-07-22T20:00:00Z'),
      price: 60,
      seats: 50,
      vehicleType: 'Bus',
      updatedAt: new Date(),
    },
  });
  const route2 = await prisma.route.create({
    data: {
      provider: 'EuroShuttle',
      departure: 'Cluj-Napoca',
      arrival: 'Munich',
      departureTime: new Date('2025-07-23T09:00:00Z'),
      arrivalTime: new Date('2025-07-23T21:00:00Z'),
      price: 75,
      seats: 30,
      vehicleType: 'Shuttle',
      updatedAt: new Date(),
    },
  });

  // Create demo bookings
  await prisma.booking.create({
    data: {
      routeId: route1.id,
      userId: user1.id,
      status: 'confirmed',
      amount: 60,
      updatedAt: new Date(),
    },
  });
  await prisma.booking.create({
    data: {
      routeId: route2.id,
      userId: user2.id,
      status: 'pending',
      amount: 75,
      updatedAt: new Date(),
    },
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
