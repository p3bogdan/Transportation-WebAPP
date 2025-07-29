import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get booking statistics
    const totalBookings = await prisma.booking.count();
    
    const bookingsByStatus = await prisma.booking.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const bookingsByPaymentStatus = await prisma.booking.groupBy({
      by: ['paymentStatus'],
      _count: {
        id: true,
      },
    });

    // Get recent bookings (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentBookings = await prisma.booking.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Get total revenue
    const totalRevenue = await prisma.booking.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        paymentStatus: 'succeeded',
      },
    });

    // Get top routes by bookings
    const topRoutes = await prisma.booking.groupBy({
      by: ['routeId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    // Get route details for top routes
    const routeDetails = await Promise.all(
      topRoutes.map(async (item) => {
        const route = await prisma.route.findUnique({
          where: { id: item.routeId },
          select: {
            departure: true,
            arrival: true,
            provider: true,
          },
        });
        return {
          ...route,
          bookingCount: item._count.id,
        };
      })
    );

    // Get user statistics
    const totalUsers = await prisma.user.count();
    const totalRoutes = await prisma.route.count();
    const totalCompanies = await prisma.company.count();

    return NextResponse.json({
      totalBookings,
      recentBookings,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalUsers,
      totalRoutes,
      totalCompanies,
      bookingsByStatus: bookingsByStatus.map(item => ({
        status: item.status,
        count: item._count.id,
      })),
      bookingsByPaymentStatus: bookingsByPaymentStatus.map(item => ({
        status: item.paymentStatus,
        count: item._count.id,
      })),
      topRoutes: routeDetails,
    });
  } catch (error) {
    console.error('GET /api/statistics error:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}