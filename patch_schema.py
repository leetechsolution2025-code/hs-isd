import sys

with open("prisma/schema.prisma", "r") as f:
    content = f.read()

# Add to Project
if "canalStructures CanalStructure[]" in content:
    content = content.replace(
        "canalStructures CanalStructure[]",
        "canalStructures CanalStructure[]\n  terrainData TerrainData[]"
    )

# Add fields to CanalStructure
if "headLoss      Float?" in content:
    content = content.replace(
        "headLoss      Float?",
        "headLoss      Float?\n  inletLoss     Float?\n  outletLoss    Float?\n  frictionLoss  Float?"
    )

# Append TerrainData
if "model TerrainData" not in content:
    content += """

model TerrainData {
  id         String   @id @default(uuid())
  projectId  String
  tenMoc     String
  lyTrinh    Float
  khoangCach Float
  caoDo      Float
  createdAt  DateTime @default(now())

  project    Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}
"""

with open("prisma/schema.prisma", "w") as f:
    f.write(content)
print("Success")
