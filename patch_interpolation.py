import sys

with open("src/components/DesignFullscreenModal.tsx", "r") as f:
    content = f.read()

old_logic = """                      // Find terrain elevation for this chainage
                      let terrainElevationStr = '-';
                      if (terrainData && terrainData.length > 0) {
                        const tNode = terrainData.find(t => Math.abs(Number(t.lyTrinh) - (node.chainage || 0)) < 0.1);
                        if (tNode) {
                          terrainElevationStr = Number(tNode.caoDo).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\\.00$/, '');
                        }
                      }"""

new_logic = """                      // Find terrain elevation for this chainage
                      let terrainElevationStr = '-';
                      if (terrainData && terrainData.length > 0) {
                        const chainage = node.chainage || 0;
                        const exactMatch = terrainData.find(t => Math.abs(Number(t.lyTrinh) - chainage) < 0.1);
                        if (exactMatch) {
                          terrainElevationStr = Number(exactMatch.caoDo).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\\.00$/, '');
                        } else {
                          const sortedData = [...terrainData].sort((a, b) => Number(a.lyTrinh) - Number(b.lyTrinh));
                          let prev = null;
                          let next = null;
                          for (let i = 0; i < sortedData.length; i++) {
                            const tChainage = Number(sortedData[i].lyTrinh);
                            if (tChainage <= chainage) prev = sortedData[i];
                            if (tChainage >= chainage && !next) next = sortedData[i];
                          }
                          if (prev && next && Number(prev.lyTrinh) !== Number(next.lyTrinh)) {
                            const lyTrinhPrev = Number(prev.lyTrinh);
                            const lyTrinhNext = Number(next.lyTrinh);
                            const caoDoPrev = Number(prev.caoDo);
                            const caoDoNext = Number(next.caoDo);
                            const ratio = (chainage - lyTrinhPrev) / (lyTrinhNext - lyTrinhPrev);
                            const interpolated = caoDoPrev + ratio * (caoDoNext - caoDoPrev);
                            terrainElevationStr = interpolated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\\.00$/, '');
                          } else if (prev) {
                            terrainElevationStr = Number(prev.caoDo).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\\.00$/, '');
                          } else if (next) {
                            terrainElevationStr = Number(next.caoDo).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\\.00$/, '');
                          }
                        }
                      }"""

content = content.replace(old_logic, new_logic)

with open("src/components/DesignFullscreenModal.tsx", "w") as f:
    f.write(content)
print("Patched interpolation logic")
