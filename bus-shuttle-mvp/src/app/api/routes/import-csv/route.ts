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

    const requiredFields = ['provider', 'departure', 'arrival', 'departureTime', 'arrivalTime', 'price', 'seats', 'vehicleType'];
    const results = { imported: 0, failed: 0, errors: [] as any[] };

    for (const [i, row] of records.entries()) {
      // Validate required fields
      const missing = requiredFields.filter(f => !row[f]);
      if (missing.length) {
        results.failed++;
        results.errors.push({ row: i + 2, error: `Missing fields: ${missing.join(', ')}` });
        continue;
      }

      try {
        // Parse and validate data
        const price = parseFloat(row.price);
        const seats = parseInt(row.seats);
        
        if (isNaN(price) || isNaN(seats)) {
          results.failed++;
          results.errors.push({ row: i + 2, error: 'Invalid price or seats number' });
          continue;
        }

        // Create route in database
        await prisma.route.create({
          data: {
            provider: row.provider,
            departure: row.departure,
            arrival: row.arrival,
            departureTime: new Date(row.departureTime),
            arrivalTime: new Date(row.arrivalTime),
            price,
            seats,
            vehicleType: row.vehicleType,
            updatedAt: new Date(),
          },
        });

        results.imported++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({ 
          row: i + 2, 
          error: error.message || 'Unknown error occurred' 
        });
      }
    }

    return NextResponse.json({
      message: `Import completed. ${results.imported} routes imported, ${results.failed} failed.`,
      results
    });

  } catch (error: any) {
    console.error('CSV import error:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV file', details: error.message },
      { status: 500 }
    );
  }
}
