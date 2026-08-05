const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL || 'file:./prisma/dev.db' });

async function main() {
  const project = await prisma.project.findFirst({ where: { code: 'DA-0001' } });
  if (!project) return console.log('Project not found');

  const coords = await prisma.landmarkCoordinate.findMany({
     where: { projectId: project.id },
     orderBy: { createdAt: 'asc' } // Assuming this is how they are ordered
  });
  console.log('Total points:', coords.length);
  
  if (coords.length < 2) return console.log('Not enough points');

  let len = 0;
  for (let i = 0; i < coords.length - 2; i++) {
     const p1 = coords[i];
     const p2 = coords[i+1];
     len += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }
  
  const p_n_1 = coords[coords.length - 2];
  const p_n = coords[coords.length - 1];
  
  const currentDist = Math.sqrt(Math.pow(p_n.x - p_n_1.x, 2) + Math.pow(p_n.y - p_n_1.y, 2));
  console.log('Current length:', len + currentDist);
  
  const targetDist = 10075 - len;
  console.log('Target distance from p(n-1) to p(n):', targetDist);
  
  // Extend p_n_1 to p_n vector to exactly targetDist
  const vx = p_n.x - p_n_1.x;
  const vy = p_n.y - p_n_1.y;
  
  const v_len = Math.sqrt(vx*vx + vy*vy);
  const u_x = vx / v_len;
  const u_y = vy / v_len;
  
  const new_x = p_n_1.x + u_x * targetDist;
  const new_y = p_n_1.y + u_y * targetDist;
  
  console.log('New last point:', { x: new_x, y: new_y });
  
  await prisma.landmarkCoordinate.update({
     where: { id: p_n.id },
     data: { x: new_x, y: new_y }
  });
  
  console.log('Updated successfully');
}

main().catch(console.error).finally(() => prisma.$disconnect());
