import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parse } from 'csv-parse/sync';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const csvText = await file.text();
    const records = parse(csvText, { 
      columns: true, 
      skip_empty_lines: true 
    }) as Record<string, string>[];

    const requiredFields = ['id']; // ID is required for updates
    const results = { updated: 0, failed: 0, errors: [] as any[] };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      // Validate required fields
      const missing = requiredFields.filter(f => !row[f]);
      if (missing.length) {
        results.failed++;
        results.errors.push({ row: i + 2, error: `Missing required field: id` });
        continue;
      }

      try {
        const routeId = parseInt(row.id);
        if (isNaN(routeId)) {
          results.failed++;
          results.errors.push({ row: i + 2, error: 'Invalid route ID' });
          continue;
        }

        // Check if route exists
        const existingRoute = await prisma.route.findUnique({
          where: { id: routeId }
        });

        if (!existingRoute) {
          results.failed++;
          results.errors.push({ row: i + 2, error: `Route with ID ${routeId} not found` });
          continue;
        }

        // Prepare update data (only include fields that are provided)
        const updateData: any = { updatedAt: new Date() };
        
        if (row.provider) updateData.provider = row.provider;
        if (row.departure) updateData.departure = row.departure;
        if (row.arrival) updateData.arrival = row.arrival;
        if (row.departureTime) updateData.departureTime = new Date(row.departureTime);
        if (row.arrivalTime) updateData.arrivalTime = new Date(row.arrivalTime);
        if (row.price) {
          const price = parseFloat(row.price);
          if (!isNaN(price)) updateData.price = price;
        }
        if (row.seats) {
          const seats = parseInt(row.seats);
          if (!isNaN(seats)) updateData.seats = seats;
        }
        if (row.vehicleType) updateData.vehicleType = row.vehicleType;
        if (row.companyId) {
          const companyId = parseInt(row.companyId);
          if (!isNaN(companyId)) updateData.companyId = companyId;
        }

        // Update route in database
        await prisma.route.update({
          where: { id: routeId },
          data: updateData,
        });

        results.updated++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({ 
          row: i + 2, 
          error: error.message || 'Unknown error occurred' 
        });
      }
    }

    return NextResponse.json({
      message: `Update completed. ${results.updated} routes updated, ${results.failed} failed.`,
      results
    });

  } catch (error: any) {
    console.error('CSV update error:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV file', details: error.message },
      { status: 500 }
    );
  }
}