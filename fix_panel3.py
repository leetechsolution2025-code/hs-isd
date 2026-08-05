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
        if '</PropertiesPanel>' in lines[i]:
            if ')}' in lines[i+1]:
                end_idx = i + 1
                break

if start_idx != -1 and end_idx != -1:
    panel_lines = lines[start_idx:end_idx+1]
    
    # remove from current location
    lines = lines[:start_idx] + lines[end_idx+1:]
    
    # find where to insert. We need to insert before the last `</div>` of the inner relative div.
    # We can search backwards from the new start_idx (which is where it used to be).
    # Since it was right after the `</div>` at line 1039, we just need to insert it one line up!
    # Wait, the `</div>` that was at 1039 is now at `start_idx - 1`.
    
    # Actually, we can just insert it at start_idx - 1
    insert_idx = start_idx - 1
    
    lines = lines[:insert_idx] + panel_lines + lines[insert_idx:]
    
    with open(filepath, 'w') as f:
        f.writelines(lines)
    print("Fixed layout again")
else:
    print("Not found", start_idx, end_idx)
