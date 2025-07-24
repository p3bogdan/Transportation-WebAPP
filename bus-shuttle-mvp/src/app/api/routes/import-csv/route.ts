import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    // Use TextDecoder for robust arrayBuffer to string conversion
    const arrayBuffer = await file.arrayBuffer();
    const csvString = new TextDecoder('utf-8').decode(arrayBuffer);

    // Ensure the CSV string ends with a newline for robust parsing
    const csvStringFixed = csvString.endsWith('\n') ? csvString : csvString + '\n';
    console.log('Raw CSV string:', JSON.stringify(csvStringFixed));
    // Force record_delimiter to '\n' for macOS/Unix CSVs
    const records = parse(csvStringFixed, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      record_delimiter: '\n',
    });
    console.log('Parsed records:', records.length, records);
    if (records.length === 0) {
      // Debug: print lines if parsing fails
      const lines = csvStringFixed.split('\n');
      console.log('CSV lines:', lines.length, lines);
    }

    const requiredFields = ['departure', 'arrival', 'departureTime', 'arrivalTime', 'price', 'provider', 'companyId'];
    const results = { imported: 0, failed: 0, errors: [] as any[] };

    for (const [i, row] of records.entries()) {
      // Validate required fields
      const missing = requiredFields.filter(f => !row[f]);
      if (missing.length) {
        results.failed++;
        results.errors.push({ row: i + 2, error: `Missing fields: ${missing.join(', ')}` });
        console.log(`Row ${i + 2} skipped: missing fields: ${missing.join(', ')}`);
        continue;
      }
      // Validate date
      const departureTime = new Date(row.departureTime);
      const arrivalTime = new Date(row.arrivalTime);
      if (isNaN(departureTime.getTime()) || isNaN(arrivalTime.getTime())) {
        results.failed++;
        results.errors.push({ row: i + 2, error: 'Invalid date format' });
        console.log(`Row ${i + 2} skipped: invalid date format`);
        continue;
      }
      // Validate price
      const price = Number(row.price);
      if (isNaN(price) || price < 0) {
        results.failed++;
        results.errors.push({ row: i + 2, error: 'Invalid price' });
        console.log(`Row ${i + 2} skipped: invalid price`);
        continue;
      }
      // Validate companyId
      const companyId = Number(row.companyId);
      if (isNaN(companyId) || companyId < 1) {
        results.failed++;
        results.errors.push({ row: i + 2, error: 'Invalid companyId' });
        console.log(`Row ${i + 2} skipped: invalid companyId`);
        continue;
      }
      try {
        await prisma.route.create({
          data: {
            departure: row.departure,
            arrival: row.arrival,
            departureTime,
            arrivalTime,
            price,
            provider: row.provider,
            companyId,
            vehicleType: row.vehicleType || '',
            seats: row.seats ? Number(row.seats) : 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        results.imported++;
        console.log(`Row ${i + 2} imported successfully.`);
      } catch (err: any) {
        results.failed++;
        results.errors.push({ row: i + 2, error: err.message });
        console.log(`Row ${i + 2} failed to import: ${err.message}`);
      }
    }
    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to import CSV', details: error.message }, { status: 500 });
  }
}
