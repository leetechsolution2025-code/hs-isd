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
  let splitIndex = -1;
  let exactP = null;

  for (let i = 0; i < coords.length - 1; i++) {
     const p1 = coords[i];
     const p2 = coords[i+1];
     const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
     
     if (len + dist >= 10075) {
        splitIndex = i + 1;
        const targetDist = 10075 - len;
        const vx = p2.x - p1.x;
        const vy = p2.y - p1.y;
        const u_x = vx / dist;
        const u_y = vy / dist;
        exactP = {
           id: p2.id, // we will update this point
           x: p1.x + u_x * targetDist,
           y: p1.y + u_y * targetDist
        };
        break;
     }
     len += dist;
  }

  if (splitIndex !== -1 && exactP) {
     console.log('Split index:', splitIndex);
     console.log('Updating point', exactP.id, 'to', exactP.x, exactP.y);
     
     await prisma.landmarkCoordinate.update({
        where: { id: exactP.id },
        data: { x: exactP.x, y: exactP.y }
     });
     
     const pointsToDelete = coords.slice(splitIndex + 1).map(p => p.id);
     console.log('Points to delete:', pointsToDelete.length);
     
     if (pointsToDelete.length > 0) {
        await prisma.landmarkCoordinate.deleteMany({
           where: { id: { in: pointsToDelete } }
        });
     }
     console.log('Successfully adjusted to exactly 10075.');
  } else {
     console.log('Total length is less than 10075:', len);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
