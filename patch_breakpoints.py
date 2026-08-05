import sys

with open("src/components/DesignFullscreenModal.tsx", "r") as f:
    content = f.read()

# 1. State definition
content = content.replace(
    "const [segmentBreakpoints, setSegmentBreakpoints] = useState<number[]>([]);",
    "const [segmentBreakpoints, setSegmentBreakpoints] = useState<string[]>([]);"
)

# 2. Add useEffect for backward compatibility (after state declarations)
injection = """
  // Backward compatibility: Convert numeric breakpoints to node IDs
  useEffect(() => {
    if (segmentBreakpoints.length > 0 && typeof segmentBreakpoints[0] === 'number' && flowNodesData.flowNodes.length > 0) {
      const newBreakpoints = (segmentBreakpoints as any as number[])
        .map(idx => flowNodesData.flowNodes[idx]?.id)
        .filter(Boolean);
      setSegmentBreakpoints(newBreakpoints);
    }
  }, [segmentBreakpoints, flowNodesData.flowNodes]);
"""
# find where autoSegment state is declared, which is right below segmentBreakpoints
content = content.replace(
    "const [autoSegment, setAutoSegment] = useState<boolean>(false);",
    "const [autoSegment, setAutoSegment] = useState<boolean>(false);\n" + injection
)

# 3. computedSegments mapping IDs back to indices
old_computed = """  const computedSegments = useMemo(() => {
    if (!flowNodesData.flowNodes || flowNodesData.flowNodes.length === 0) return [];
    
    const segments: {startIdx: number, endIdx: number | null}[] = [];
    let startIdx = 0;
    segmentBreakpoints.forEach(bp => {
      segments.push({ startIdx, endIdx: bp });
      startIdx = bp;
    });"""

new_computed = """  const computedSegments = useMemo(() => {
    if (!flowNodesData.flowNodes || flowNodesData.flowNodes.length === 0) return [];
    
    const breakpointIndices = segmentBreakpoints
       .map(id => flowNodesData.flowNodes.findIndex((n: any) => n.id === id))
       .filter(idx => idx > 0)
       .sort((a, b) => a - b);

    const segments: {startIdx: number, endIdx: number | null}[] = [];
    let startIdx = 0;
    breakpointIndices.forEach(bp => {
      segments.push({ startIdx, endIdx: bp });
      startIdx = bp;
    });"""

content = content.replace(old_computed, new_computed)

# 4. handleAutoSegmentCalculator
content = content.replace("const newBreakpoints: number[] = [];", "const newBreakpoints: string[] = [];")
content = content.replace("newBreakpoints.push(i);", "newBreakpoints.push(nodes[i].id);")

# 5. Table rendering
old_onClick = """                            onClick={() => {
                              if (!isFirstRow) {
                                setSegmentBreakpoints(prev => {
                                  if (prev.includes(index)) {
                                    return prev.filter(i => i !== index).sort((a, b) => a - b);
                                  }
                                  return [...prev, index].sort((a, b) => a - b);
                                });
                              }
                            }}"""

new_onClick = """                            onClick={() => {
                              if (!isFirstRow) {
                                setSegmentBreakpoints(prev => {
                                  if (prev.includes(node.id)) {
                                    return prev.filter(id => id !== node.id);
                                  }
                                  return [...prev, node.id];
                                });
                              }
                            }}"""
content = content.replace(old_onClick, new_onClick)

content = content.replace(
    "const isSelected = segmentBreakpoints.includes(index);",
    "const isSelected = segmentBreakpoints.includes(node.id);"
)

with open("src/components/DesignFullscreenModal.tsx", "w") as f:
    f.write(content)
print("Breakpoints patched!")
