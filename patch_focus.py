import sys

with open("src/components/DesignFullscreenModal.tsx", "r") as f:
    content = f.read()

# 1. Update the select onChange
old_select = """                        if (id) {
                          const struct = canalStructures.find(s => s.id === id);
                          if (struct) {
                            setInlineStructureTypeInput(struct.type || '');"""

new_select = """                        if (id) {
                          const struct = canalStructures.find(s => s.id === id);
                          if (struct) {
                            setFocusedChainage(Number(struct.chainage) || 0);
                            setInlineStructureTypeInput(struct.type || '');"""

content = content.replace(old_select, new_select)

old_else = """                        } else {
                          setInlineStructureTypeInput('');"""

new_else = """                        } else {
                          setFocusedChainage(null);
                          setInlineStructureTypeInput('');"""

content = content.replace(old_else, new_else)

# 2. Add id to the tr
old_tr = """                      const dataRow = (
                        <tr 
                          key={`data-${segIdx}-${index}`} 
                          className={`hover:bg-slate-100 transition-colors cursor-pointer text-[13px] ${focusedChainage === node.chainage ? 'bg-blue-50/50' : ''}`}"""

new_tr = """                      const dataRow = (
                        <tr 
                          id={`row-${node.chainage}`}
                          key={`data-${segIdx}-${index}`} 
                          className={`hover:bg-slate-100 transition-colors cursor-pointer text-[13px] ${focusedChainage === node.chainage ? 'bg-blue-50/50' : ''}`}"""

content = content.replace(old_tr, new_tr)

# 3. Add useEffect to scroll table
scroll_effect = """  useEffect(() => {
    if (focusedChainage !== null) {
      setTimeout(() => {
        const row = document.getElementById(`row-${focusedChainage}`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [focusedChainage]);

  if (!isOpen) return null;"""

content = content.replace("  if (!isOpen) return null;", scroll_effect)


with open("src/components/DesignFullscreenModal.tsx", "w") as f:
    f.write(content)
print("Focus patched")
