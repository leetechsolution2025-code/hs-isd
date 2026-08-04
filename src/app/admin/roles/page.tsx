import React from 'react';
import prisma from '@/lib/db';
import RolesClient from './RolesClient';

export default async function RolesPage() {
  const users = await prisma.user.findMany({
    include: {
      department: true,
      permission: true,
      departmentAccesses: true,
    },
    orderBy: {
      fullName: 'asc'
    }
  });

  const departments = await prisma.category.findMany({
    where: {
      group: {
        name: 'Phòng ban'
      }
    },
    orderBy: {
      orderIndex: 'asc'
    }
  });

  return <RolesClient initialUsers={users} departments={departments} />;
}
