import prisma from './src/lib/db'

async function main() {
  const contractGroup = await prisma.categoryGroup.create({
    data: {
      name: 'Loại hợp đồng',
      orderIndex: 6,
      categories: {
        create: [
          { name: 'HĐ Không xác định thời hạn', orderIndex: 1 },
          { name: 'HĐ Xác định thời hạn (12 tháng)', orderIndex: 2 },
          { name: 'HĐ Xác định thời hạn (24 tháng)', orderIndex: 3 },
          { name: 'HĐ Xác định thời hạn (36 tháng)', orderIndex: 4 },
          { name: 'HĐ Thử việc', orderIndex: 5 },
        ]
      }
    }
  })
  console.log("Seeded contract types")
}
main()
