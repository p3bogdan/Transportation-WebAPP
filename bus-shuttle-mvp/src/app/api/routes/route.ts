import { NextResponse } from 'next/server';
import { routes } from '../../../utils/mockData';

export async function GET(request: Request) {
  // Optionally filter by query params in the future
  return NextResponse.json(routes);
}
