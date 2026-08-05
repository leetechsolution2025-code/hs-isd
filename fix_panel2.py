import sys

filepath = 'src/components/DesignFullscreenModal.tsx'
with open(filepath, 'r') as f:
    lines = f.readlines()

# Fix toast.info
for i, line in enumerate(lines):
    if 'toast.info' in line:
        lines[i] = line.replace('toast.info', 'toast')

# Find the panel
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if '{/* Properties Panel for Step 3 */}' in line:
        start_idx = i
        break

if start_idx != -1:
    for i in range(start_idx, len(lines)):
        if '        )}' in lines[i] and '      </div>' in lines[i+1]:
            # Wait, the previous script might not have had the `</div>` correctly if it was placed weirdly.
            # Let's just find the closing tags of the panel.
            pass

        # Since it's inside currentStep === 2 now, it might end with `        )}`
        if '</PropertiesPanel>' in lines[i]:
            if ')}' in lines[i+1]:
                end_idx = i + 1
                break

if start_idx != -1 and end_idx != -1:
    panel_lines = lines[start_idx:end_idx+1]
    # delete it
    lines = lines[:start_idx] + lines[end_idx+1:]
    
    # find where to insert it.
    insert_idx = -1
    for i, line in enumerate(lines):
        if '{currentStep === 4 && (' in line:
            # i is `{currentStep === 4`
            # i-1 is `        )}` (of currentStep === 3)
            # i-2 is `          </div>` (of flex-1 flex flex-col h-full)
            # i-3 is `            </div>` (of flex-1 flex overflow-hidden relative)
            # we should insert it at i-3 !
            insert_idx = i - 2
            break
            
    if insert_idx != -1:
        # Also, remove `{currentStep === 3 && (` and `)}` from the panel_lines because it's already inside currentStep === 3!
        # wait, the panel_lines has:
        # {/* Properties Panel for Step 3 */}
        # {currentStep === 3 && (
        #   <PropertiesPanel ...>
        #   ...
        #   </PropertiesPanel>
        # )}
        # It's totally fine to leave it as {currentStep === 3 && ( ... )} even if it's already inside {currentStep === 3}. It evaluates to true.
        # But to be cleaner, we can remove it. Let's just leave it to not break the formatting.
        
        lines = lines[:insert_idx] + panel_lines + lines[insert_idx:]
    
    with open(filepath, 'w') as f:
        f.writelines(lines)
    print("Fixed layout")
else:
    print("Not found", start_idx, end_idx)
