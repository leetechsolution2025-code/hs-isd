import sys

with open("src/app/actions.ts", "r") as f:
    content = f.read()

content = content.replace("await prisma.terrainData.findMany({", "await (prisma as any).terrainData.findMany({")
content = content.replace("await tx.terrainData.deleteMany({", "await (tx as any).terrainData.deleteMany({")
content = content.replace("await tx.terrainData.createMany({", "await (tx as any).terrainData.createMany({")

with open("src/app/actions.ts", "w") as f:
    f.write(content)
print("Patched TS ignores")
