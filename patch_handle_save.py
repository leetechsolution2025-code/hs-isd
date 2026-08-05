import sys

with open("src/components/DesignFullscreenModal.tsx", "r") as f:
    content = f.read()

old_configData = """    const configData = {
      sourceFlow,
      reinforcementFactor,
      permeabilityLevel,
      applyToAll,
      segmentPermeabilities,
      segmentBreakpoints,
      autoSegment,
      flowDifference,
      calcMethod,
      calcProblem,
      crossSectionType,
      kminCoef,
      segmentHydraulicResults
    };"""

new_configData = """    const calculatedElevations = computedSegments.map((seg, segIdx) => {
      const res = segmentHydraulicResults[segIdx];
      const isDesigned = res !== undefined;
      const nodes = [];
      const endNodeIdx = Math.min(seg.startIdx + seg.nodes.length, flowNodesData.flowNodes.length - 1);
      
      for (let index = seg.startIdx; index <= endNodeIdx; index++) {
        const node = flowNodesData.flowNodes[index];
        const dayVal = nodeElevations[segIdx]?.[index];
        const htkVal = dayVal !== null && dayVal !== undefined && isDesigned && res.h_des ? dayVal + Number(res.h_des) : null;
        
        let safeHeightVal = 0;
        if (res && res.safeHeight) {
          safeHeightVal = Number(String(res.safeHeight).replace(',', '.'));
          if (isNaN(safeHeightVal)) safeHeightVal = 0;
        } else {
          // Approximate safe height if not found
          safeHeightVal = 0;
        }
        const h_max_val = !isNaN(Number(res?.h_max)) ? Number(res?.h_max) : 0;
        const dinhKenhVal = dayVal !== null && dayVal !== undefined && isDesigned ? dayVal + h_max_val + safeHeightVal : null;

        let terrainVal = null;
        if (terrainData && terrainData.length > 0) {
          const chainage = node.chainage || 0;
          const exactMatch = terrainData.find(t => Math.abs(Number(t.lyTrinh) - chainage) < 0.1);
          if (exactMatch) {
            terrainVal = Number(exactMatch.caoDo);
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
              terrainVal = Number(prev.caoDo) + ((chainage - Number(prev.lyTrinh)) / (Number(next.lyTrinh) - Number(prev.lyTrinh))) * (Number(next.caoDo) - Number(prev.caoDo));
            } else if (prev) {
              terrainVal = Number(prev.caoDo);
            } else if (next) {
              terrainVal = Number(next.caoDo);
            }
          }
        }
        
        nodes.push({
          nodeId: node.id,
          chainage: node.chainage,
          dayKenh: dayVal,
          htk: htkVal,
          dinhKenh: dinhKenhVal,
          matDat: terrainVal
        });
      }
      return { segIdx, nodes };
    });

    const configData = {
      sourceFlow,
      reinforcementFactor,
      permeabilityLevel,
      applyToAll,
      segmentPermeabilities,
      segmentBreakpoints,
      autoSegment,
      flowDifference,
      calcMethod,
      calcProblem,
      crossSectionType,
      kminCoef,
      segmentHydraulicResults,
      calculatedElevations
    };"""

content = content.replace(old_configData, new_configData)

with open("src/components/DesignFullscreenModal.tsx", "w") as f:
    f.write(content)
print("Patched handleSaveProject")
