import sys

with open("src/app/actions.ts", "r") as f:
    content = f.read()

# Append getTerrainData and saveTerrainData
if "getTerrainData" not in content:
    content += """
export async function getTerrainData(projectId: string) {
  try {
    const data = await prisma.terrainData.findMany({
      where: { projectId },
      orderBy: { lyTrinh: 'asc' }
    });
    return data;
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu địa hình:', error);
    return [];
  }
}

export async function saveTerrainData(projectId: string, data: any[]) {
  try {
    await prisma.$transaction(async (tx) => {
      // Xoá dữ liệu cũ
      await tx.terrainData.deleteMany({
        where: { projectId }
      });
      
      if (data && data.length > 0) {
        // Thêm dữ liệu mới
        await tx.terrainData.createMany({
          data: data.map(item => ({
            projectId,
            tenMoc: item.tenMoc || '',
            lyTrinh: parseFloat(item.lyTrinh) || 0,
            khoangCach: parseFloat(item.khoangCach) || 0,
            caoDo: parseFloat(item.caoDo) || 0
          }))
        });
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Lỗi khi lưu dữ liệu địa hình:', error);
    return { success: false, error: 'Đã xảy ra lỗi khi lưu' };
  }
}
"""

# Now update saveCanalStructures
if "headLoss: struct.headLoss," in content:
    content = content.replace(
        "headLoss: struct.headLoss,",
        "headLoss: struct.headLoss,\n          inletLoss: struct.inletLoss,\n          outletLoss: struct.outletLoss,\n          frictionLoss: struct.frictionLoss,"
    )

with open("src/app/actions.ts", "w") as f:
    f.write(content)
print("Success actions update")
