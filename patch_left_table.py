import sys

with open("src/components/DesignFullscreenModal.tsx", "r") as f:
    content = f.read()

target = """                        {processedBranches && processedBranches.length > 0 ? (
                          processedBranches.map((branch: any, idx: number) => ("""

new_target = """                        {sortedBranches && sortedBranches.length > 0 ? (
                          sortedBranches.map((branch: any, idx: number) => ("""

if target in content:
    content = content.replace(target, new_target)
    with open("src/components/DesignFullscreenModal.tsx", "w") as f:
        f.write(content)
    print("Patched left table to use sortedBranches")
else:
    print("Target not found")
