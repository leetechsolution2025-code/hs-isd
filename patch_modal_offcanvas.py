import sys

with open("src/components/DesignFullscreenModal.tsx", "r") as f:
    content = f.read()

old_offcanvas = """        <TerrainDataOffcanvas 
          isOpen={isTerrainDataOpen} 
          onClose={() => setIsTerrainDataOpen(false)} 
          onUpdate={async (data) => {"""
new_offcanvas = """        <TerrainDataOffcanvas 
          isOpen={isTerrainDataOpen} 
          initialData={terrainData}
          onClose={() => setIsTerrainDataOpen(false)} 
          onUpdate={async (data) => {"""

if old_offcanvas in content:
    content = content.replace(old_offcanvas, new_offcanvas)
else:
    print("Not found old offcanvas usage")

with open("src/components/DesignFullscreenModal.tsx", "w") as f:
    f.write(content)
print("Success patch modal offcanvas")
