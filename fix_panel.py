import sys

filepath = 'src/components/DesignFullscreenModal.tsx'
with open(filepath, 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if '{/* Properties Panel for Step 3 */}' in line:
        start_idx = i
        break

if start_idx != -1:
    for i in range(start_idx, len(lines)):
        if '        )}' in lines[i] and '      </div>' in lines[i+1]:
            end_idx = i
            break

if start_idx != -1 and end_idx != -1:
    panel_lines = lines[start_idx:end_idx+1]
    
    # remove from original
    lines = lines[:start_idx] + lines[end_idx+1:]
    
    insert_idx = -1
    for i, line in enumerate(lines):
        if '                  </FullWidthTable>' in line and '                </div>' in lines[i+1] and '              </div>' in lines[i+2] and '            </div>' in lines[i+3]:
            insert_idx = i + 3
            break
            
    if insert_idx != -1:
        # Before inserting, adjust indentation if needed. The original panel was indented 8 spaces.
        # Inside the div, it should probably be 14 spaces or so. But React doesn't care.
        lines = lines[:insert_idx] + panel_lines + lines[insert_idx:]
    
    for i, line in enumerate(lines):
        if '<div className="flex-1 flex overflow-hidden p-2 gap-2 bg-[#f8f9fa]">' in line:
            lines[i] = line.replace('<div className="flex-1 flex overflow-hidden p-2 gap-2 bg-[#f8f9fa]">', '<div className="flex-1 flex overflow-hidden p-2 gap-2 bg-[#f8f9fa] relative">')
            break

    with open(filepath, 'w') as f:
        f.writelines(lines)
    print("Successfully moved panel")
else:
    print("Panel bounds not found", start_idx, end_idx)
