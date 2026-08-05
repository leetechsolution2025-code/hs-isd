import sys

with open("src/app/actions.ts", "r") as f:
    content = f.read()

old_insert = """        await tx.terrainData.createMany({
          data: data.map(item => ({
            projectId,
            tenMoc: item.tenMoc || '',
            lyTrinh: parseFloat(item.lyTrinh) || 0,
            khoangCach: parseFloat(item.khoangCach) || 0,
            caoDo: parseFloat(item.caoDo) || 0
          }))
        });"""

new_insert = """        const CHUNK_SIZE = 100;
        const mappedData = data.map(item => ({
          projectId,
          tenMoc: item.tenMoc || '',
          lyTrinh: parseFloat(item.lyTrinh) || 0,
          khoangCach: parseFloat(item.khoangCach) || 0,
          caoDo: parseFloat(item.caoDo) || 0
        }));
        
        for (let i = 0; i < mappedData.length; i += CHUNK_SIZE) {
          const chunk = mappedData.slice(i, i + CHUNK_SIZE);
          await tx.terrainData.createMany({
            data: chunk
          });
        }"""

if old_insert in content:
    content = content.replace(old_insert, new_insert)
    with open("src/app/actions.ts", "w") as f:
        f.write(content)
    print("Patched chunking logic")
else:
    print("Could not find insert logic")
