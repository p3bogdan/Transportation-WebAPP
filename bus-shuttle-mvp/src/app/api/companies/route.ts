import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/generated/prisma/client-singleton';

// GET: List all companies
export async function GET() {
  const companies = await prisma.company.findMany();
  return NextResponse.json(companies);
}

// POST: Add a new company
export async function POST(request: NextRequest) {
  try {
    const { name, phone } = await request.json();
    const company = await prisma.company.create({
      data: {
        name,
        phone,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create company', details: String(error) }, { status: 500 });
  }
}

// PATCH: Edit company details
export async function PATCH(request: NextRequest) {
  try {
    const { id, name, phone } = await request.json();
    const company = await prisma.company.update({
      where: { id },
      data: {
        name,
        phone,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json(company);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update company', details: String(error) }, { status: 500 });
  }
}
