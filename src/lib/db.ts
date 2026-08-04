import { PrismaClient } from '@prisma/client'

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const prismaClientSingleton = () => {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL || 'file:./prisma/dev.db'
  })
  return new PrismaClient({ adapter })
}

declare global {
  var prismaGlobal6: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal6 ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal6 = prisma
