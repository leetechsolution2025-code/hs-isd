import sys

with open("src/app/actions.ts", "r") as f:
    content = f.read()

old_logic = "tenMoc: item.tenMoc || '',"
new_logic = "tenMoc: item.tenMoc !== undefined && item.tenMoc !== null ? String(item.tenMoc) : '',"

content = content.replace(old_logic, new_logic)

with open("src/app/actions.ts", "w") as f:
    f.write(content)
print("Patched tenMoc to String")
