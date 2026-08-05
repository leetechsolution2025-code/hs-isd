import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({
  url: 'file:./dev.db'
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const project = await prisma.project.findFirst({ where: { code: 'DA-0001' } });
  if (!project) return console.log('Project not found');

  const coords = await prisma.landmarkCoordinate.findMany({
     where: { projectId: project.id },
     orderBy: { createdAt: 'asc' }
  });

  let len = 0;
  for (let i = 0; i < coords.length - 2; i++) {
     const p1 = coords[i];
     const p2 = coords[i+1];
     len += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }
  
  const p_n_1 = coords[coords.length - 2];
  const p_n = coords[coords.length - 1];
  
  const currentDist = Math.sqrt(Math.pow(p_n.x - p_n_1.x, 2) + Math.pow(p_n.y - p_n_1.y, 2));
  console.log('Length up to p(n-1):', len);
  console.log('Distance from p(n-1) to p(n):', currentDist);
  console.log('Total length:', len + currentDist);
}

main().catch(console.error).finally(() => prisma.$disconnect());
