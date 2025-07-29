import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const routes = await prisma.route.findMany({
      include: { company: true },
      orderBy: { id: 'asc' }
    });

    // Convert routes to CSV format
    const csvHeaders = [
      'id',
      'provider',
      'departure',
      'arrival',
      'departureTime',
      'arrivalTime',
      'price',
      'seats',
      'vehicleType',
      'companyId',
      'companyName'
    ];

    const csvRows = routes.map(route => [
      route.id,
      route.provider,
      route.departure,
      route.arrival,
      route.departureTime?.toISOString() || '',
      route.arrivalTime?.toISOString() || '',
      route.price,
      route.seats || 0,
      route.vehicleType || '',
      route.companyId || '',
      route.company?.name || ''
    ]);

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => 
        typeof field === 'string' && field.includes(',') 
          ? `"${field.replace(/"/g, '""')}"` 
          : field
      ).join(','))
    ].join('\n');

    // Return CSV file as download
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="routes_export_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error: any) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      { error: 'Failed to export routes to CSV', details: error.message },
      { status: 500 }
    );
  }
}