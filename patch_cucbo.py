import sys

with open("src/components/DesignFullscreenModal.tsx", "r") as f:
    content = f.read()

old_td = """                          <td className={`px-3 py-1.5 text-center border-r border-slate-100 ${node.loss > 0 ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>{node.loss > 0 ? Number(node.loss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>"""

new_td = """                          <td className={`px-3 py-1.5 text-center border-r border-slate-100 ${(node.headLoss || 0) > 0 ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>{(node.headLoss || 0) > 0 ? Number(node.headLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>"""

if old_td in content:
    content = content.replace(old_td, new_td)
else:
    print("Not found old td")

with open("src/components/DesignFullscreenModal.tsx", "w") as f:
    f.write(content)
print("Success patch cucbo")
