import sys

with open("src/components/DesignFullscreenModal.tsx", "r") as f:
    content = f.read()

useEffect_block = """  // Backward compatibility: Convert numeric breakpoints to node IDs
  useEffect(() => {
    if (segmentBreakpoints.length > 0 && typeof segmentBreakpoints[0] === 'number' && flowNodesData.flowNodes.length > 0) {
      const newBreakpoints = (segmentBreakpoints as any as number[])
        .map(idx => flowNodesData.flowNodes[idx]?.id)
        .filter(Boolean);
      setSegmentBreakpoints(newBreakpoints);
    }
  }, [segmentBreakpoints, flowNodesData.flowNodes]);

"""

# Remove from top
content = content.replace(useEffect_block, "")

# Add before computedSegments
content = content.replace(
    "  const computedSegments = useMemo(() => {",
    useEffect_block + "  const computedSegments = useMemo(() => {"
)

with open("src/components/DesignFullscreenModal.tsx", "w") as f:
    f.write(content)

print("Effect moved!")
