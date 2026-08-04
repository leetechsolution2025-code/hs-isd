import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  try {
    const accesses = await prisma.userDepartmentAccess.findMany({
      where: {
        userId,
        accessLevel: { gt: 0 } // Only > 0 (View or Full)
      },
      include: {
        department: true
      }
    });

    return NextResponse.json(accesses);
  } catch (error) {
    console.error('Fetch access error:', error);
    return NextResponse.json({ error: 'Failed to fetch access' }, { status: 500 });
  }
}
