import sys

with open("src/components/DesignFullscreenModal.tsx", "r") as f:
    content = f.read()

old_promise = """        Promise.all([
          getLandmarkCoordinates(project.id),
          getCanalStructures(project.id),
          getCategoriesByGroupName("Độ thấm kênh nhánh"),
          getCategoriesByGroupName("Độ thấm kênh chính"),
          getCategoriesByGroupName("Loại công trình trên kênh")
        ]).then(([coords, structures, branchPermCats, mainPermCats, structureCats]) => {"""

new_promise = """        Promise.all([
          getLandmarkCoordinates(project.id),
          getCanalStructures(project.id),
          getCategoriesByGroupName("Độ thấm kênh nhánh"),
          getCategoriesByGroupName("Độ thấm kênh chính"),
          getCategoriesByGroupName("Loại công trình trên kênh"),
          getTerrainData(project.id)
        ]).then(([coords, structures, branchPermCats, mainPermCats, structureCats, terrainRows]) => {
          if (terrainRows && terrainRows.length > 0) {
            setTerrainData(terrainRows);
          }"""

if old_promise in content:
    content = content.replace(old_promise, new_promise)
else:
    print("Failed to find Promise.all")

with open("src/components/DesignFullscreenModal.tsx", "w") as f:
    f.write(content)
print("Success")
