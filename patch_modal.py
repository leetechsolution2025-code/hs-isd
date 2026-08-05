import sys

with open("src/components/DesignFullscreenModal.tsx", "r") as f:
    content = f.read()

# Add getTerrainData and saveTerrainData to imports
if "saveTerrainData" not in content:
    content = content.replace(
        "saveCanalStructures,",
        "saveCanalStructures,\n  getTerrainData,\n  saveTerrainData,"
    )

# Update the TerrainDataOffcanvas onUpdate handler
old_handler = """        <TerrainDataOffcanvas 
          isOpen={isTerrainDataOpen} 
          onClose={() => setIsTerrainDataOpen(false)} 
          onUpdate={(data) => {
            setTerrainData(data);
            setIsTerrainDataOpen(false);
          }}
        />"""

new_handler = """        <TerrainDataOffcanvas 
          isOpen={isTerrainDataOpen} 
          onClose={() => setIsTerrainDataOpen(false)} 
          onUpdate={async (data) => {
            setTerrainData(data);
            setIsTerrainDataOpen(false);
            if (project?.id) {
              const res = await saveTerrainData(project.id, data);
              if (res.success) {
                toast.success('Đã lưu dữ liệu địa hình thành công');
              } else {
                toast.error('Lỗi khi lưu dữ liệu địa hình');
              }
            }
          }}
        />"""

if old_handler in content:
    content = content.replace(old_handler, new_handler)
else:
    print("Failed to find TerrainDataOffcanvas")


# Load terrain data on mount
old_effect = """  useEffect(() => {
    if (project?.id) {
      loadLandmarkCoordinates(project.id);
      loadCanalStructures(project.id);
    }
  }, [project?.id]);"""

new_effect = """  useEffect(() => {
    if (project?.id) {
      loadLandmarkCoordinates(project.id);
      loadCanalStructures(project.id);
      getTerrainData(project.id).then(data => {
        if (data && data.length > 0) {
          setTerrainData(data);
        }
      });
    }
  }, [project?.id]);"""

if old_effect in content:
    content = content.replace(old_effect, new_effect)
else:
    print("Failed to find initial load effect")

with open("src/components/DesignFullscreenModal.tsx", "w") as f:
    f.write(content)
print("Success modal patch")
