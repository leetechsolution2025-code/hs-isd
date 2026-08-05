import re

with open("src/components/AddUserModal.tsx", "r") as f:
    content = f.read()

# Replace the fallback logic for the four selects
content = re.sub(r'\? departments\.map\([^)]+\)\n\s*\)\s*:\s*\(\s*<>\s*<option value="bdh">.*?</>\s*\)', r'? departments.map(d => (\n                            <option key={d.id} value={d.id}>{d.name}</option>\n                          )) : null', content, flags=re.DOTALL)

content = re.sub(r'\? levels\.map\([^)]+\)\n\s*\)\s*:\s*\(\s*<>\s*<option value="1">.*?</>\s*\)', r'? levels.map(l => (\n                            <option key={l.id} value={l.id}>{l.name}</option>\n                          )) : null', content, flags=re.DOTALL)

content = re.sub(r'\? employeeTypes\.map\([^)]+\)\n\s*\)\s*:\s*\(\s*<>\s*<option value="ft">.*?</>\s*\)', r'? employeeTypes.map(t => (\n                            <option key={t.id} value={t.id}>{t.name}</option>\n                          )) : null', content, flags=re.DOTALL)

content = re.sub(r'\? contractTypes\.map\([^)]+\)\n\s*\)\s*:\s*\(\s*<>\s*<option value="1">.*?</>\s*\)', r'? contractTypes.map(c => (\n                            <option key={c.id} value={c.id}>{c.name}</option>\n                          )) : null', content, flags=re.DOTALL)

with open("src/components/AddUserModal.tsx", "w") as f:
    f.write(content)
