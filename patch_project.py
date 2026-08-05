import sys

with open("prisma/schema.prisma", "r") as f:
    content = f.read()

content = content.replace(
    "canalStructures     CanalStructure[]",
    "canalStructures     CanalStructure[]\n  terrainData         TerrainData[]"
)

with open("prisma/schema.prisma", "w") as f:
    f.write(content)
