import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({ exists: false });
  }
  
  try {
    const user = await prisma.user.findUnique({ 
      where: { email } 
    });
    
    return NextResponse.json({ exists: !!user });
  } catch (error) {
    console.error('Check user error:', error);
    return NextResponse.json({ exists: false });
  }
}