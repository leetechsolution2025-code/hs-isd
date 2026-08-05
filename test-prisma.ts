import prisma from './src/lib/db'

async function main() {
  console.log('Company model:', !!prisma.company)
  if (prisma.company) {
    const comp = await prisma.company.findFirst()
    console.log('Company:', comp)
  }
}

main().catch(console.error)
