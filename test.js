const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const groups = await prisma.categoryGroup.findMany({ include: { categories: true } });
  const deptGroup = groups.find(g => g.name.toLowerCase().includes('phòng ban'));
  if (deptGroup) {
    console.log(deptGroup.categories.map(c => c.name));
  } else {
    console.log("No dept group");
  }
}
main().then(() => prisma.$disconnect());
