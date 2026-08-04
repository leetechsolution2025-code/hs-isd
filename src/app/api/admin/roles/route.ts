import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { userId, role, functionalPerms, deptAccesses } = data;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // 1. Update user role
    if (role) {
      await prisma.user.update({
        where: { id: userId },
        data: { role }
      });
    }

    // 2. Update functional permissions
    if (functionalPerms) {
      await prisma.userPermission.upsert({
        where: { userId },
        update: functionalPerms,
        create: {
          userId,
          ...functionalPerms
        }
      });
    }

    // 3. Update department accesses
    if (deptAccesses && Array.isArray(deptAccesses)) {
      // deptAccesses: { departmentId: string, accessLevel: number }[]
      for (const access of deptAccesses) {
        await prisma.userDepartmentAccess.upsert({
          where: {
            userId_departmentId: {
              userId,
              departmentId: access.departmentId
            }
          },
          update: {
            accessLevel: access.accessLevel
          },
          create: {
            userId,
            departmentId: access.departmentId,
            accessLevel: access.accessLevel
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save roles error:', error);
    return NextResponse.json({ error: 'Failed to save roles' }, { status: 500 });
  }
}
